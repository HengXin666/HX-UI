import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Bar3DProps } from "../bar3d";
import { TipRow, type SceneApi } from "../frame";
import { useThemeColors } from "../theme";
import { Controls, FloorGrid, LabelLayer, LabelProjector, type LabelSpec } from "./common";

const VARS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--border", "--muted-foreground", "--foreground"] as const;
const MAX_H = 3.2;

type Props = Bar3DProps & { api: SceneApi };

export default function Bar3DScene(props: Props) {
  const colors = useThemeColors(VARS);
  const resetRef = useRef<(() => void) | null>(null);
  const rows = props.values.length, cols = props.values[0]?.length ?? 0;
  const span = Math.max(rows, cols);
  const els = useRef<(HTMLElement | null)[]>([]);
  const labels = useMemo<LabelSpec[]>(() => [
    ...props.xLabels.map((l, c) => ({ pos: new THREE.Vector3(c - cols / 2 + 0.5, 0, rows / 2 + 0.6), text: l })),
    ...props.yLabels.map((l, r) => ({ pos: new THREE.Vector3(-cols / 2 - 0.7, 0, r - rows / 2 + 0.5), text: l })),
  ], [props.xLabels, props.yLabels, rows, cols]);
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
      <LabelProjector items={labels} els={els} />
    </Canvas>
    <LabelLayer items={labels} els={els} />
    </div>
  );
}

function Bars({ values, xLabels, yLabels, format = (v) => v.toLocaleString("zh-CN"), colorMode = "value", gap = 0.28, valueLabel = "数值", api, colors }: Props & { colors: Record<(typeof VARS)[number], string> }) {
  const rows = values.length, cols = values[0]?.length ?? 0;
  const n = rows * cols;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const max = Math.max(1e-9, ...values.flat());
  const [hovered, setHovered] = useState<number | null>(null);

  // 当前高度 (动画中) 和目标高度; 首次从 0 长出来, 之后换数据从旧高度过渡
  const cur = useRef<Float32Array>(new Float32Array(0));
  const delay = useRef<Float32Array>(new Float32Array(0));
  const clock = useRef(0);
  const target = useMemo(() => Float32Array.from(values.flat().map((v) => (v / max) * MAX_H)), [values, max]);
  if (cur.current.length !== n) {
    cur.current = api.reduced ? Float32Array.from(target) : new Float32Array(n);
    delay.current = Float32Array.from({ length: n }, (_, i) => api.reduced ? 0 : ((i % cols) + Math.floor(i / cols)) * 0.035);
    clock.current = 0;
  }

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  useEffect(() => () => geo.dispose(), [geo]);

  const palette = useMemo(() => {
    const c = [colors["--chart-1"], colors["--chart-2"], colors["--chart-3"], colors["--chart-4"], colors["--chart-5"]].map((x) => new THREE.Color(x));
    const lo = new THREE.Color(colors["--chart-2"]), hi = new THREE.Color(colors["--chart-1"]);
    return { rows: c, lo, hi };
  }, [colors]);

  const colorOf = (i: number, out: THREE.Color) => {
    if (colorMode === "row") return out.copy(palette.rows[Math.floor(i / cols) % palette.rows.length]);
    const t = values[Math.floor(i / cols)][i % cols] / max;
    return out.copy(palette.lo).lerp(palette.hi, Math.sqrt(t));
  };

  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const w = 1 - gap;
  const place = (i: number) => {
    const r = Math.floor(i / cols), c = i % cols;
    const h = Math.max(0.0001, cur.current[i]);
    m4.makeScale(w, h, w).setPosition(c - cols / 2 + 0.5, 0, r - rows / 2 + 0.5);
    mesh.current!.setMatrixAt(i, m4);
  };

  useLayoutEffect(() => {
    const m = mesh.current; if (!m) return;
    for (let i = 0; i < n; i++) {
      place(i);
      colorOf(i, col);
      if (hovered === i) col.offsetHSL(0, 0.05, 0.12);
      else if (hovered != null) col.multiplyScalar(0.55);
      m.setColorAt(i, col);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    invalidate();
  });

  useFrame((_, dt) => {
    const m = mesh.current; if (!m) return;
    clock.current += dt;
    let moving = false;
    for (let i = 0; i < n; i++) {
      if (clock.current < delay.current[i]) { moving = true; continue; }
      const d = target[i] - cur.current[i];
      if (Math.abs(d) > 0.002) { cur.current[i] += d * Math.min(1, dt * 7); moving = true; place(i); }
      else if (d !== 0) { cur.current[i] = target[i]; place(i); }
    }
    if (moving) { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }
  });

  const move = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const i = e.instanceId; if (i == null) return;
    if (i !== hovered) setHovered(i);
    const r = Math.floor(i / cols), c = i % cols;
    colorOf(i, col);
    const v = values[r][c];
    api.onHover({
      x: e.nativeEvent.clientX, y: e.nativeEvent.clientY,
      content: (
        <div className="grid gap-1">
          <p className="font-medium">{yLabels[r]} · {xLabels[c]}</p>
          <TipRow label={valueLabel} value={format(v)} color={`#${col.getHexString()}`} />
          <TipRow label="占全表最大值" value={`${Math.round((v / max) * 100)}%`} />
        </div>
      ),
    });
  };

  return (
    <group>
      <instancedMesh
        key={n}
        ref={mesh}
        args={[geo, undefined, n]}
        onPointerMove={move}
        onPointerOut={() => { setHovered(null); api.onHover(null); }}
      >
        <meshStandardMaterial roughness={0.45} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}
