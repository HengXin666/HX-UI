import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Bar3DProps } from "../bar3d";
import { TipRow, type SceneApi } from "../frame";
import { useThemeColors } from "../theme";
import { Controls, FloorGrid, LabelLayer, LabelMover, LabelProjector, useLabelMotion } from "./common";

const VARS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--border", "--muted-foreground", "--foreground"] as const;
const MAX_H = 3.2;

type Props = Bar3DProps & { api: SceneApi };

export default function Bar3DScene(props: Props) {
  const colors = useThemeColors(VARS);
  const resetRef = useRef<(() => void) | null>(null);
  const rows = props.values.length, cols = props.values[0]?.length ?? 0;
  const span = Math.max(rows, cols);
  const els = useRef<(HTMLElement | null)[]>([]);
  // 标签按文字配对; 行列增删时位置在 LabelMover 里逐帧滑过去
  const want = useMemo(() => [
    ...props.xLabels.map((l, c) => ({ id: `x:${l}`, pos: new THREE.Vector3(c - cols / 2 + 0.5, 0, rows / 2 + 0.6), text: l })),
    ...props.yLabels.map((l, r) => ({ id: `y:${l}`, pos: new THREE.Vector3(-cols / 2 - 0.7, 0, r - rows / 2 + 0.5), text: l })),
  ], [props.xLabels, props.yLabels, rows, cols]);
  const { labels, map: labelPos } = useLabelMotion(want);
  return (
    <div className="relative h-full w-full">
    <Canvas
      frameloop={props.api.active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [span * 0.95, span * 0.85, span * 1.25], fov: 36 }}
      flat
      gl={{ antialias: true, alpha: true }}
      onDoubleClick={() => resetRef.current?.()}
      onPointerMissed={() => props.api.onHover(null)}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 10, 4]} intensity={1.6} />
      <directionalLight position={[-6, 4, -6]} intensity={0.4} />
      <Bars {...props} colors={colors} />
      <FloorGrid w={cols} d={rows} color={colors["--border"]} opacity={0.9} />
      <Controls api={props.api} fit={{ radius: Math.hypot(cols, rows) / 2 + 0.6, dir: [0.5, 0.6, 1], margin: 0.78 }} target={[0, 0.9, 0]} autoRotate={props.autoRotate} autoRotateSpeed={0.5} minDistance={span * 0.8} maxDistance={span * 3} resetRef={resetRef} />
      <LabelMover map={labelPos} reduced={props.api.reduced} />
      <LabelProjector items={labels} els={els} />
    </Canvas>
    <LabelLayer items={labels} els={els} />
    </div>
  );
}

/** 一根柱子的动画状态. 按 "行名|列名" 配对, 增删行列时留下的柱子滑到新位置, 新柱从地面长出, 删掉的缩回地面后移除 */
interface BarState { key: string; r: number; c: number; v: number; h: number; to: number; x: number; z: number; tx: number; tz: number; wait: number; dying: boolean }

function Bars({ values, xLabels, yLabels, format = (v) => v.toLocaleString("zh-CN"), colorMode = "value", gap = 0.28, valueLabel = "数值", api, colors }: Props & { colors: Record<(typeof VARS)[number], string> }) {
  const rows = values.length, cols = values[0]?.length ?? 0;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const max = Math.max(1e-9, ...values.flat());
  const [hovered, setHovered] = useState<string | null>(null);

  const bars = useRef<BarState[]>([]);
  const first = useRef(true);
  // 每次数据变化: 对齐新旧柱子
  useMemo(() => {
    const old = new Map(bars.current.map((b) => [b.key, b]));
    const next: BarState[] = [];
    const seen = new Set<string>();
    values.forEach((row, r) => row.forEach((v, c) => {
      const key = `${yLabels[r]}|${xLabels[c]}`;
      seen.add(key);
      const tx = c - cols / 2 + 0.5, tz = r - rows / 2 + 0.5, to = (v / max) * MAX_H;
      const b = old.get(key);
      if (b) next.push({ ...b, r, c, v, to, tx, tz, dying: false });
      // 首次按对角线依次长出; 之后新加的柱子立即在自己的位置长出
      else next.push({ key, r, c, v, h: api.reduced ? to : 0, to, x: tx, z: tz, tx, tz, wait: api.reduced || !first.current ? 0 : (c + r) * 0.035, dying: false });
    }));
    for (const b of bars.current) if (!seen.has(b.key) && b.h > 0.002) next.push({ ...b, to: 0, dying: true, wait: 0 });
    bars.current = next;
    first.current = false;
  }, [values, xLabels, yLabels, max, rows, cols, api.reduced]);

  // 容量按 64 取整, 小幅增删不重建实例
  const cap = Math.max(64, Math.ceil(bars.current.length / 64) * 64);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  useEffect(() => () => geo.dispose(), [geo]);

  const palette = useMemo(() => {
    const c = [colors["--chart-1"], colors["--chart-2"], colors["--chart-3"], colors["--chart-4"], colors["--chart-5"]].map((x) => new THREE.Color(x));
    const lo = new THREE.Color(colors["--chart-2"]), hi = new THREE.Color(colors["--chart-1"]);
    return { rows: c, lo, hi };
  }, [colors]);

  const colorOf = (b: BarState, out: THREE.Color) => {
    if (colorMode === "row") return out.copy(palette.rows[b.r % palette.rows.length]);
    return out.copy(palette.lo).lerp(palette.hi, Math.sqrt(Math.min(1, b.v / max)));
  };

  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const w = 1 - gap;
  const place = (i: number) => {
    const b = bars.current[i];
    m4.makeScale(w, Math.max(0.0001, b.h), w).setPosition(b.x, 0, b.z);
    mesh.current!.setMatrixAt(i, m4);
  };
  const paint = () => {
    const m = mesh.current; if (!m) return;
    bars.current.forEach((b, i) => {
      colorOf(b, col);
      if (hovered === b.key) col.offsetHSL(0, 0.05, 0.12);
      else if (hovered != null || b.dying) col.multiplyScalar(0.55);
      m.setColorAt(i, col);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const m = mesh.current; if (!m) return;
    m.count = bars.current.length;
    for (let i = 0; i < bars.current.length; i++) place(i);
    paint();
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  });

  useFrame((_, dt) => {
    const m = mesh.current; if (!m) return;
    const k = Math.min(1, dt * 7);
    let moving = false, gone = false;
    bars.current.forEach((b, i) => {
      if (b.wait > 0) { b.wait -= dt; moving = true; return; }
      const dh = b.to - b.h, dx = b.tx - b.x, dz = b.tz - b.z;
      if (Math.abs(dh) > 0.002 || Math.abs(dx) > 0.002 || Math.abs(dz) > 0.002) {
        b.h += dh * k; b.x += dx * k; b.z += dz * k; moving = true;
      } else { b.h = b.to; b.x = b.tx; b.z = b.tz; if (b.dying) gone = true; }
      place(i);
    });
    if (gone) {
      // 缩回地面的柱子移除, 其余整体前移一位
      bars.current = bars.current.filter((b) => !(b.dying && b.h <= 0.002));
      m.count = bars.current.length;
      bars.current.forEach((_, i) => place(i));
      paint();
    }
    if (moving || gone) { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }
  });

  const move = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const i = e.instanceId; if (i == null) return;
    const b = bars.current[i]; if (!b || b.dying) return;
    if (b.key !== hovered) setHovered(b.key);
    colorOf(b, col);
    api.onHover({
      x: e.nativeEvent.clientX, y: e.nativeEvent.clientY,
      content: (
        <div className="grid gap-1">
          <p className="font-medium">{yLabels[b.r]} · {xLabels[b.c]}</p>
          <TipRow label={valueLabel} value={format(b.v)} color={`#${col.getHexString()}`} />
          <TipRow label="占全表最大值" value={`${Math.round((b.v / max) * 100)}%`} />
        </div>
      ),
    });
  };

  return (
    <group>
      <instancedMesh
        key={cap}
        ref={mesh}
        args={[geo, undefined, cap]}
        onPointerMove={move}
        onPointerOut={() => { setHovered(null); api.onHover(null); }}
      >
        <meshStandardMaterial roughness={0.45} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}
