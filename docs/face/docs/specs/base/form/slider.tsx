import { useState } from "react";
import { Button, Slider } from "@hx/ui";
import sliderRaw from "../../../../../../src/primitives/slider.tsx?raw";
import { range, select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 滑块. 主演示是播放器音量, 旁边读数跟着走; animateValue 打开后点预设值时滑块平滑过去, 拖动时仍跟手.
 */

const PRESETS = [
  { label: "静音", value: 0 },
  { label: "一半", value: 50 },
  { label: "最大", value: 100 },
];

function SliderDemo(props: Record<string, unknown>) {
  const { initial, step, animateValue, disabled } = props as { initial: number; step: string; animateValue: boolean; disabled: boolean };
  const [volume, setVolume] = useState(initial);
  return (
    <div className="grid w-[22rem] max-w-full gap-3 text-left">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-muted-foreground">音量</span>
        <span className="font-mono tabular-nums text-foreground">{volume}%</span>
      </div>
      <Slider value={[volume]} onValueChange={([next]) => setVolume(next)} step={Number(step)} animateValue={animateValue} disabled={disabled} aria-label="音量" aria-valuetext={`${volume}%`} />
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <Button key={preset.label} size="xs" variant="outline" disabled={disabled} onClick={() => setVolume(preset.value)}>
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function usage(values: Values): string {
  const attrs = ["value={[volume]}", "onValueChange={([next]) => setVolume(next)}", values.step === "1" ? "" : `step={${values.step}}`, values.animateValue ? "animateValue" : "", values.disabled ? "disabled" : "", 'aria-label="音量"'].filter(Boolean);
  return demo(["Slider"], `<Slider\n  ${attrs.join("\n  ")}\n/>`, '\nimport { useState } from "react";').replace("export function Demo() {\n", `export function Demo() {\n  const [volume, setVolume] = useState(${values.initial});\n`);
}

export const SLIDER: PageSpec = {
  id: "slider",
  kind: "single",
  importName: "Slider",
  source: "src/primitives/slider.tsx",
  raw: sliderRaw,
  deps: [],
  controls: [
    range("initial", "初始值", [0, 100, 1], 64, "不是属性: 演示里 useState 的初值, 经 value 传入 (受控)."),
    select("step", "步长", ["1", "5", "10", "25"], "1", "", "拖动与方向键的步长; PageUp / PageDown 一次走 10 步."),
    toggle("animateValue", "值变化动画", true, "value 从外部改变 (点下面的预设) 时滑块平滑过去; 拖动时始终跟手, 减弱动效时直接跳."),
    toggle("disabled", "禁用", false, "禁用, 透明度降到 50%."),
  ],
  propDesc: {
    className: "根元素的类名.",
    value: "受控的值, 单值也写成数组 [n], 与 onValueChange 成对使用.",
    defaultValue: "非受控的初始值, 写成数组 [n].",
    min: "最小值.",
    max: "最大值.",
    disabled: "禁用.",
    "aria-label": "滑块的可访问名称; 页面上没有可见标签时必填.",
    "aria-valuetext": "读屏器读出的值文本 (例如 \"64%\"), 不传时读数字.",
    onValueChange: "拖动与按键过程中每次变化都回调.",
    onValueCommit: "松手或按键后回调一次, 适合发请求.",
  },
  propsNote: "单值滑块; 内部是一个透明的原生 range input, 键盘与读屏都走它.",
  height: 300,
  render: (props) => <SliderDemo {...props} />,
  usage,
  examples: [
    {
      id: "range",
      title: "非受控与自定义范围",
      desc: "只关心松手后的值时用 defaultValue 加 onValueCommit.",
      code: `<Slider defaultValue={[2400]} min={800} max={6000} step={200} aria-label="每月预算" onValueCommit={([v]) => save(v)} />`,
      render: () => <Slider className="w-[22rem] max-w-full" defaultValue={[2400]} min={800} max={6000} step={200} aria-label="每月预算" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到滑块." },
    { keys: ["←", "→"], action: "减少 / 增加一步 (↓ ↑ 同理)." },
    { keys: ["PageDown", "PageUp"], action: "减少 / 增加十步." },
    { keys: ["Home", "End"], action: "跳到最小值 / 最大值." },
  ],
};
