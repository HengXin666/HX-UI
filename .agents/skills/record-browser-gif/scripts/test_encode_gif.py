"""Exercise GIF timing and rejection through real ffmpeg/ffprobe subprocesses."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name('encode_gif.py')


class EncodeGifTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='gif-encoder-test-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.video = self.root / 'browser video.webm'
        self.output = self.root / 'demo.gif'
        subprocess.run([
            'ffmpeg', '-v', 'error',
            '-f', 'lavfi', '-i', 'color=red:s=64x48:r=10:d=2',
            '-f', 'lavfi', '-i', 'color=lime:s=64x48:r=10:d=2',
            '-f', 'lavfi', '-i', 'color=blue:s=64x48:r=10:d=2',
            '-filter_complex', '[0:v][1:v][2:v]concat=n=3:v=1:a=0',
            '-c:v', 'libvpx', str(self.video),
        ], check=True, capture_output=True)

    def encode(self, source=None, *options):
        return subprocess.run([
            sys.executable, str(SCRIPT), str(source or self.video), str(self.output), *options,
        ], capture_output=True, text=True)

    def assert_color(self, seconds, channel):
        result = subprocess.run([
            'ffmpeg', '-v', 'error', '-i', str(self.output), '-ss', str(seconds),
            '-frames:v', '1', '-vf', 'scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
        ], check=True, capture_output=True)
        pixel = result.stdout
        self.assertEqual(len(pixel), 3)
        self.assertGreater(pixel[channel], 200)
        self.assertTrue(all(value < 40 for index, value in enumerate(pixel) if index != channel))

    def write_frames(self, count, first=None, last=None):
        """Write numbered PPM frames, with an optional distinct first and last color."""
        frames = self.root / 'frames'
        frames.mkdir(exist_ok=True)
        colors = [(0xff, 0x00, 0x00)] * count
        if first is not None:
            colors[0] = first
        if last is not None:
            colors[-1] = last
        for index, color in enumerate(colors):
            body = bytes(color) * (64 * 48)
            (frames / f'{index}.ppm').write_bytes(b'P6\n64 48\n255\n' + body)
        return frames

    def test_video_trim_speed_final_hold_and_palette_order(self):
        result = self.encode(None, '--start', '1', '--end', '5', '--speed', '2',
                             '--final-hold', '1', '--max-width', '32')
        self.assertEqual(result.returncode, 0, result.stderr)
        summary = json.loads(result.stdout)
        self.assertAlmostEqual(summary['durationSeconds'], 3, delta=0.2)
        self.assertEqual((summary['width'], summary['height']), (32, 24))
        self.assert_color(0.1, 0)
        self.assert_color(0.8, 1)
        self.assert_color(2.7, 2)

    def test_video_defaults_keep_full_duration(self):
        result = self.encode()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertAlmostEqual(json.loads(result.stdout)['durationSeconds'], 8, delta=0.2)
        self.assert_color(7.7, 2)

    def test_invalid_video_options_do_not_write_output(self):
        for options in [
            ['--start', '-1'], ['--speed', 'nan'], ['--final-hold', 'inf'],
            ['--start', '3', '--end', '3'], ['--end', '7'],
            ['--speed', '1000'], ['--durations', '2'], ['--pattern', '*.png'],
        ]:
            with self.subTest(options=options):
                result = self.encode(None, *options)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('error:', result.stderr)
                self.assertFalse(self.output.exists())

    def test_screenshot_durations_and_video_flag_rejection(self):
        frames = self.write_frames(2, first=(0xff, 0x00, 0x00), last=(0x00, 0x00, 0xff))
        rejected = self.encode(frames, '--speed', '1')
        self.assertNotEqual(rejected.returncode, 0)
        self.assertIn('require a video file', rejected.stderr)
        for options in [['--pattern', ''], ['--pattern', '*.ppm', '--durations', ''],
                        ['--pattern', '*.ppm', '--durations', '1,2,3']]:
            with self.subTest(options=options):
                self.assertNotEqual(self.encode(frames, *options).returncode, 0)
                self.assertFalse(self.output.exists())
        result = self.encode(frames, '--pattern', '*.ppm', '--durations', '0.5,1.5')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['sourceFrames'], 2)
        self.assert_color(0.1, 0)
        self.assert_color(1.8, 2)

    def test_more_than_ninety_nine_frames_keep_numeric_order(self):
        """字典序会把 100 排到 99 前面, 帧数过百的录制必须按数字前缀排序."""
        frames = self.write_frames(101, first=(0x00, 0x00, 0xff), last=(0x00, 0xff, 0x00))
        result = self.encode(frames, '--pattern', '*.ppm', '--durations', '0.1',
                             '--fps', '10', '--max-width', '32')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['sourceFrames'], 101)
        # 首帧是蓝色, 末帧是绿色: 若 100 被排到 1 之前, 首帧与末帧的颜色就会对不上
        self.assert_color(0.0, 2)
        self.assert_color(10.0, 1)

    def test_failed_validation_removes_the_written_output(self):
        """校验失败时必须删掉刚写出的 GIF, 否则下次运行会被 output already exists 卡住."""
        failed = self.encode(None, '--max-bytes', '1', '--final-hold', '0.0')
        self.assertNotEqual(failed.returncode, 0)
        self.assertIn('above --max-bytes', failed.stderr)
        self.assertFalse(self.output.exists())
        retried = self.encode()
        self.assertEqual(retried.returncode, 0, retried.stderr)

    def test_overwrite_and_size_limit(self):
        self.output.write_bytes(b'keep')
        rejected = self.encode()
        self.assertNotEqual(rejected.returncode, 0)
        self.assertEqual(self.output.read_bytes(), b'keep')
        # --force 覆盖之后校验失败: 旧内容已经没了, 留下不合规的新文件只会卡住下一次运行
        oversized = self.encode(None, '--force', '--max-bytes', '1', '--final-hold', '0.0')
        self.assertNotEqual(oversized.returncode, 0)
        self.assertIn('above --max-bytes', oversized.stderr)
        self.assertFalse(self.output.exists())
        retried = self.encode(None, '--force')
        self.assertEqual(retried.returncode, 0, retried.stderr)


if __name__ == '__main__':
    unittest.main()
