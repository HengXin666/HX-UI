"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Surface3DProps } from "../surface3d";
import { TipRow, type SceneApi } from "../frame";
import { useThemeColors } from "../theme";
import { axisLabelClass, Controls, FloorGrid, LabelLayer, LabelMover, LabelProjector, useLabelMotion, type LabelSpec } from "./common";

const VARS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--border", "--foreground"] as const;
const S = 6;
const H = 2.6;
type Props = Surface3DProps & { api: SceneApi };

export default function Surface3DScene(props: Props) {
  const colors = useThemeColors(VARS);
  const resetRef = useRef<(() => void) | null>(null);
  const home: [number, number, number] = [6.4, 4.8, 7];
  const els = useRef<(HTMLElement | null)[]>([]);
  const want = useMemo(() => surfaceLabels(props), [props.values, props.xRange, props.yRange, props.xLabel, props.yLabel, props.format]); // eslint-disable-line react-hooks/exhaustive-deps
  // 峰值标注跟着新峰滑过去
  const { labels, map } = useLabelMotion(want);
  return (
    <div className="relative h-full w-full">
    <Canvas
      frameloop={props.api.active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: home, fov: 38 }}
      flat
      gl={{ antialias: true, alpha: true }}
      onDoubleClick={() => resetRef.current?.()}
      onPointerMissed={() => props.api.onHover(null)}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 9, 6]} intensity={1.5} />
      <directionalLight position={[-6, 3, -4]} intensity={0.35} />
      <Surface {...props} colors={colors} />
      <FloorGrid w={S} d={S} step={S / 6} color={colors["--border"]} opacity={0.9} />
      <Controls api={props.api} fit={{ radius: S * 0.68, dir: [0.9, 0.72, 1], margin: 0.95 }} target={[0, H * 0.3, 0]} autoRotate={props.autoRotate} autoRotateSpeed={0.45} minDistance={5} maxDistance={22} resetRef={resetRef} />
      <LabelMover map={map} reduced={props.api.reduced} />
      <LabelProjector items={labels} els={els} />
    </Canvas>
    <LabelLayer items={labels} els={els} />
    </div>
  );
}

function Surface({ values, xRange = [0, 1], yRange = [0, 1], xLabel = "X", yLabel = "Y", zLabel = "Z", format = (v) => v.toFixed(2), wireframe = true, api, colors }: Props & { colors: Record<(typeof VARS)[number], string> }) {
  const rows = values.length, cols = values[0]?.length ?? 0;
  const flat = values.flat();
  const lo = Math.min(...flat), hi = Math.max(...flat);
  const norm = (v: number) => (hi === lo ? 0.5 : (v - lo) / (hi - lo));
  const invalidate = useThree((s) => s.invalidate);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const ramp = useMemo(() => ["--chart-2", "--chart-1", "--chart-4", "--chart-3"].map((k) => new THREE.Color(colors[k as keyof typeof colors])), [colors]);
  const rampAt = (t: number, out: THREE.Color) => {
    const x = Math.min(0.9999, Math.max(0, t)) * (ramp.length - 1);
    const i = Math.floor(x);
    return out.copy(ramp[i]).lerp(ramp[i + 1], x - i);
  };

  // 顶点位置 (x, z 固定, y 动画), 颜色按高度
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(rows * cols * 3);
    const idx: number[] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = (r * cols + c) * 3;
      pos[k] = (c / (cols - 1) - 0.5) * S; pos[k + 2] = (r / (rows - 1) - 0.5) * S;
      if (r < rows - 1 && c < cols - 1) { const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1; idx.push(a, d, b, b, d, e); }
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(rows * cols * 3), 3));
    g.setIndex(idx);
    return g;
  }, [rows, cols]);
  useEffect(() => () => geo.dispose(), [geo]);

  // 网格线: 每隔几格一条, 沿行和列
  const wire = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const every = Math.max(1, Math.round(Math.max(rows, cols) / 16));
    const segs: number[] = [];
    for (let r = 0; r < rows; r += every) for (let c = 0; c < cols - 1; c++) segs.push(r * cols + c, r * cols + c + 1);
    for (let c = 0; c < cols; c += every) for (let r = 0; r < rows - 1; r++) segs.push(r * cols + c, (r + 1) * cols + c);
    g.setAttribute("position", geo.getAttribute("position"));
    g.setIndex(segs);
    return g;
  }, [geo, rows, cols]);

  const target = useMemo(() => Float32Array.from(flat.map((v) => norm(v) * H)), [values]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = useRef<Float32Array | null>(null);
  if (!cur.current || cur.current.length !== target.length) cur.current = api.reduced ? Float32Array.from(target) : new Float32Array(target.length);

  const tmp = useMemo(() => new THREE.Color(), []);
  const write = () => {
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const col = geo.getAttribute("color") as THREE.BufferAttribute;
    for (let i = 0; i < target.length; i++) {
      pos.array[i * 3 + 1] = cur.current![i];
      rampAt(cur.current![i] / H, tmp);
      col.array[i * 3] = tmp.r; col.array[i * 3 + 1] = tmp.g; col.array[i * 3 + 2] = tmp.b;
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    geo.computeVertexNormals(); geo.computeBoundingSphere();
  };
  useEffect(() => { write(); invalidate(); }, [colors, geo]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    let moving = false;
    const k = Math.min(1, dt * 4.5);
    for (let i = 0; i < target.length; i++) {
      const d = target[i] - cur.current![i];
      if (Math.abs(d) > 0.001) { cur.current![i] += d * k; moving = true; } else cur.current![i] = target[i];
    }
    if (moving) write();
  });

  const at = (r: number, c: number) => new THREE.Vector3((c / (cols - 1) - 0.5) * S, cur.current![r * cols + c], (r / (rows - 1) - 0.5) * S);
  const xv = (c: number) => xRange[0] + (c / (cols - 1)) * (xRange[1] - xRange[0]);
  const yv = (r: number) => yRange[0] + (r / (rows - 1)) * (yRange[1] - yRange[0]);

  const move = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const c = Math.round((e.point.x / S + 0.5) * (cols - 1));
    const r = Math.round((e.point.z / S + 0.5) * (rows - 1));
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    if (!hover || hover.r !== r || hover.c !== c) setHover({ r, c });
    const v = values[r][c];
    api.onHover({
      x: e.nativeEvent.clientX, y: e.nativeEvent.clientY,
      content: (
        <div className="grid gap-1">
          <TipRow label={xLabel} value={formatAxis(xv(c))} />
          <TipRow label={yLabel} value={formatAxis(yv(r))} />
          <TipRow label={zLabel} value={format(v)} color={`#${rampAt(norm(v), tmp).getHexString()}`} />
        </div>
      ),
    });
  };

  return (
    <group>
      <mesh geometry={geo} onPointerMove={move} onPointerOut={() => { setHover(null); api.onHover(null); }}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.55} metalness={0.05} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {wireframe && (
        <lineSegments geometry={wire}>
          <lineBasicMaterial color={colors["--foreground"]} transparent opacity={0.18} />
        </lineSegments>
      )}
      {hover && (() => {
        const p = at(hover.r, hover.c);
        return (
          <group>
            <mesh position={p}><sphereGeometry args={[0.07, 16, 16]} /><meshBasicMaterial color={colors["--foreground"]} /></mesh>
            {p.y > 0.02 && (
              <mesh position={[p.x, p.y / 2, p.z]}>
                <cylinderGeometry args={[0.012, 0.012, p.y, 6]} />
                <meshBasicMaterial color={colors["--foreground"]} transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        );
      })()}
    </group>
  );
}

function formatAxis(v: number) {
  const a = Math.abs(v);
  if (a < 1e-9) return "0";
  return a >= 1000 ? v.toLocaleString("zh-CN", { maximumFractionDigits: 0 }) : a >= 10 ? v.toFixed(0) : v.toFixed(a >= 1 ? 1 : 2);
}

function surfaceLabels({ values, xRange = [0, 1], yRange = [0, 1], xLabel = "X", yLabel = "Y", format = (v: number) => v.toFixed(2) }: Surface3DProps): (LabelSpec & { id: string })[] {
  const rows = values.length, cols = values[0]?.length ?? 0;
  const flat = values.flat();
  const hi = Math.max(...flat), lo = Math.min(...flat);
  const pk = flat.indexOf(hi), pr = Math.floor(pk / cols), pc = pk % cols;
  const ticks = [0, 0.5, 1];
  const strong = axisLabelClass + " text-foreground";
  return [
    { id: "peak", pos: new THREE.Vector3((pc / (cols - 1) - 0.5) * S, (hi === lo ? 0.5 : 1) * H + 0.35, (pr / (rows - 1) - 0.5) * S), text: `峰值 ${format(hi)}`, className: "whitespace-nowrap rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] backdrop-blur" },
    ...ticks.map((t) => ({ id: `x${t}`, pos: new THREE.Vector3((t - 0.5) * S, 0, S / 2 + 0.45), text: formatAxis(xRange[0] + t * (xRange[1] - xRange[0])) })),
    // y 轴刻度放在右侧边, 默认机位下左侧边被曲面挡住; 近角留给 x 轴, 只标 0 和 0.5
    ...[0, 0.5].map((t) => ({ id: `y${t}`, pos: new THREE.Vector3(S / 2 + 0.6, 0, (t - 0.5) * S), text: formatAxis(yRange[0] + t * (yRange[1] - yRange[0])) })),
    { id: "xl", pos: new THREE.Vector3(0, 0, S / 2 + 0.95), text: `${xLabel} →`, className: strong },
    { id: "yl", pos: new THREE.Vector3(S / 2 + 1.05, 0, S * 0.22), text: yLabel, className: strong },
  ];
}
