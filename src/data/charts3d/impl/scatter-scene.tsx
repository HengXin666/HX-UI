"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Scatter3DPoint, Scatter3DProps } from "../scatter3d";
import { TipRow, type SceneApi } from "../frame";
import { useThemeColors } from "../theme";
import { axisLabelClass, Controls, FloorGrid, LabelLayer, LabelMover, LabelProjector, useLabelMotion } from "./common";

const VARS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--border", "--foreground"] as const;
type Colors = Record<(typeof VARS)[number], string>;
type Props = Scatter3DProps & { api: SceneApi };
const S = 5; // 立方体边长

/** 整齐的刻度范围 */
function niceRange(lo: number, hi: number) {
  const span = hi - lo || Math.abs(hi) || 1;
  const step = 10 ** Math.floor(Math.log10(span / 4));
  const k = [1, 2, 2.5, 5, 10].map((s) => s * step).find((s) => span / s <= 5) ?? step * 10;
  return [Math.floor(lo / k) * k, Math.ceil(hi / k) * k] as [number, number];
}

export default function Scatter3DScene(props: Props) {
  const colors = useThemeColors(VARS);
  const resetRef = useRef<(() => void) | null>(null);
  const els = useRef<(HTMLElement | null)[]>([]);
  const { points, xLabel = "X", yLabel = "Y", zLabel = "Z", format = (v: number) => v.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) } = props;
  const rx = useMemo(() => niceRange(Math.min(...points.map((p) => p.x)), Math.max(...points.map((p) => p.x))), [points]);
  const ry = useMemo(() => niceRange(Math.min(...points.map((p) => p.y)), Math.max(...points.map((p) => p.y))), [points]);
  const rz = useMemo(() => niceRange(Math.min(...points.map((p) => p.z)), Math.max(...points.map((p) => p.z))), [points]);
  const want = useMemo(() => {
    const t = [0, 0.5, 1];
    const at = (r: [number, number], k: number) => r[0] + (r[1] - r[0]) * k;
    return [
      ...t.map((k) => ({ id: `x${k}`, pos: new THREE.Vector3((k - 0.5) * S, 0, S / 2 + 0.35), text: format(at(rx, k), "x") })),
      ...t.map((k) => ({ id: `y${k}`, pos: new THREE.Vector3(-S / 2 - 0.4, 0, (0.5 - k) * S), text: format(at(ry, k), "y") })),
      ...t.slice(1).map((k) => ({ id: `z${k}`, pos: new THREE.Vector3(-S / 2 - 0.3, k * S, S / 2), text: format(at(rz, k), "z") })),
      { id: "xl", pos: new THREE.Vector3(0, 0, S / 2 + 0.85), text: `${xLabel} →`, className: axisLabelClass + " text-foreground" },
      { id: "yl", pos: new THREE.Vector3(-S / 2 - 1.1, 0, 0), text: `${yLabel} →`, className: axisLabelClass + " text-foreground" },
      { id: "zl", pos: new THREE.Vector3(-S / 2 - 0.3, S + 0.45, S / 2), text: `${zLabel} ↑`, className: axisLabelClass + " text-foreground" },
    ];
  }, [rx, ry, rz, xLabel, yLabel, zLabel]); // eslint-disable-line react-hooks/exhaustive-deps
  const { labels, map } = useLabelMotion(want);
  return (
    <div className="relative h-full w-full">
      <Canvas
        frameloop={props.api.active ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ position: [7, 6, 8], fov: 38 }}
        flat
        gl={{ antialias: true, alpha: true }}
        onDoubleClick={() => resetRef.current?.()}
        onPointerMissed={() => props.api.onHover(null)}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 9, 6]} intensity={1.4} />
        <Dots {...props} colors={colors} rx={rx} ry={ry} rz={rz} />
        <FloorGrid w={S} d={S} step={S / 4} color={colors["--border"]} opacity={0.9} />
        <BackWalls color={colors["--border"]} />
        <Controls api={props.api} fit={{ radius: S * 0.85, dir: [0.85, 0.7, 1], margin: 0.95 }} target={[0, S * 0.4, 0]} autoRotate={props.autoRotate} autoRotateSpeed={0.45} minDistance={5} maxDistance={24} resetRef={resetRef} />
        <LabelMover map={map} reduced={props.api.reduced} />
        <LabelProjector items={labels} els={els} />
      </Canvas>
      <LabelLayer items={labels} els={els} />
    </div>
  );
}

/** 背后两面墙的网格, 帮助判断高度 */
function BackWalls({ color }: { color: string }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let k = 0; k <= 4; k++) {
      const v = (k / 4) * S, u = (k / 4 - 0.5) * S;
      pts.push(-S / 2, v, -S / 2, S / 2, v, -S / 2); pts.push(u, 0, -S / 2, u, S, -S / 2);
      pts.push(-S / 2, v, -S / 2, -S / 2, v, S / 2); pts.push(-S / 2, 0, u, -S / 2, S, u);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return <lineSegments geometry={geo}><lineBasicMaterial color={color} transparent opacity={0.45} /></lineSegments>;
}

interface Dot { id: string; p: Scatter3DPoint; pos: THREE.Vector3; to: THREE.Vector3; s: number; ts: number; group: number; dying: boolean }

function Dots({ points, xLabel = "X", yLabel = "Y", zLabel = "Z", format = (v: number) => v.toLocaleString("zh-CN", { maximumFractionDigits: 2 }), stems = true, api, colors, rx, ry, rz }: Props & { colors: Colors; rx: [number, number]; ry: [number, number]; rz: [number, number] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const stemRef = useRef<THREE.LineSegments>(null);
  const invalidate = useThree((s) => s.invalidate);
  const [hover, setHover] = useState<string | null>(null);
  const groups = useMemo(() => [...new Set(points.map((p) => p.group ?? ""))], [points]);
  const sMax = Math.max(1e-9, ...points.map((p) => p.size ?? 1));
  const dots = useRef<Dot[]>([]);
  const first = useRef(true);
  useMemo(() => {
    const nx = (v: number, r: [number, number]) => ((v - r[0]) / (r[1] - r[0] || 1));
    const old = new Map(dots.current.map((d) => [d.id, d]));
    const seen = new Set<string>();
    const next: Dot[] = points.map((p) => {
      seen.add(p.id);
      const to = new THREE.Vector3((nx(p.x, rx) - 0.5) * S, nx(p.z, rz) * S, (0.5 - nx(p.y, ry)) * S);
      const ts = 0.07 + 0.11 * Math.sqrt((p.size ?? 1) / sMax);
      const o = old.get(p.id);
      const group = Math.max(0, groups.indexOf(p.group ?? ""));
      return o ? { ...o, p, to, ts, group, dying: false } : { id: p.id, p, pos: to.clone(), to, s: api.reduced ? ts : 0, ts, group, dying: false };
    });
    for (const d of dots.current) if (!seen.has(d.id) && d.s > 0.002) next.push({ ...d, ts: 0, dying: true });
    dots.current = next;
    first.current = false;
  }, [points, rx, ry, rz, sMax, groups, api.reduced]);

  const cap = Math.max(64, Math.ceil(dots.current.length / 64) * 64);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 20, 14), []);
  const stemGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(cap * 6), 3)); return g; }, [cap]);
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => stemGeo.dispose(), [stemGeo]);
  const palette = useMemo(() => [colors["--chart-1"], colors["--chart-2"], colors["--chart-3"], colors["--chart-4"], colors["--chart-5"]].map((c) => new THREE.Color(c)), [colors]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);

  const write = () => {
    const m = mesh.current; if (!m) return;
    const arr = stemGeo.getAttribute("position") as THREE.BufferAttribute;
    dots.current.forEach((d, i) => {
      m4.makeScale(Math.max(1e-4, d.s), Math.max(1e-4, d.s), Math.max(1e-4, d.s)).setPosition(d.pos);
      m.setMatrixAt(i, m4);
      arr.setXYZ(i * 2, d.pos.x, d.pos.y, d.pos.z); arr.setXYZ(i * 2 + 1, d.pos.x, d.s > 0.01 ? 0 : d.pos.y, d.pos.z);
    });
    m.count = dots.current.length;
    m.instanceMatrix.needsUpdate = true;
    arr.needsUpdate = true; stemGeo.setDrawRange(0, dots.current.length * 2);
    m.computeBoundingSphere();
  };
  const paint = () => {
    const m = mesh.current; if (!m) return;
    dots.current.forEach((d, i) => {
      col.copy(palette[d.group % palette.length]);
      if (hover === d.id) col.offsetHSL(0, 0.05, 0.15);
      else if (hover != null) col.multiplyScalar(0.45);
      m.setColorAt(i, col);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };
  useLayoutEffect(() => { write(); paint(); invalidate(); });

  useFrame((_, dt) => {
    const k = api.reduced ? 1 : Math.min(1, dt * 7);
    let moving = false, gone = false;
    for (const d of dots.current) {
      const ds = d.ts - d.s, dist = d.pos.distanceTo(d.to);
      if (Math.abs(ds) > 0.001 || dist > 0.002) { d.s += ds * k; d.pos.lerp(d.to, k); moving = true; }
      else { d.s = d.ts; d.pos.copy(d.to); if (d.dying) gone = true; }
    }
    if (gone) { dots.current = dots.current.filter((d) => !(d.dying && d.s <= 0.002)); paint(); }
    if (moving || gone) write();
  });

  const move = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const i = e.instanceId; if (i == null) return;
    const d = dots.current[i]; if (!d || d.dying) return;
    if (hover !== d.id) setHover(d.id);
    api.onHover({
      x: e.nativeEvent.clientX, y: e.nativeEvent.clientY,
      content: (
        <div className="grid gap-1">
          <p className="font-medium">{d.p.label ?? d.p.id}{d.p.group ? <span className="text-muted-foreground"> · {d.p.group}</span> : null}</p>
          <TipRow label={xLabel} value={format(d.p.x, "x")} color={`#${palette[d.group % palette.length].getHexString()}`} />
          <TipRow label={yLabel} value={format(d.p.y, "y")} />
          <TipRow label={zLabel} value={format(d.p.z, "z")} />
        </div>
      ),
    });
  };

  return (
    <group>
      <instancedMesh key={cap} ref={mesh} args={[geo, undefined, cap]} onPointerMove={move} onPointerOut={() => { setHover(null); api.onHover(null); }}>
        <meshStandardMaterial roughness={0.35} metalness={0.05} />
      </instancedMesh>
      {stems && (
        <lineSegments ref={stemRef} geometry={stemGeo}>
          <lineBasicMaterial color={colors["--foreground"]} transparent opacity={0.18} />
        </lineSegments>
      )}
    </group>
  );
}
