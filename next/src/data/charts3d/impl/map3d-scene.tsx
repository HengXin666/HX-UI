import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { geoConicEqualArea, type GeoProjection } from "d3-geo";
import type { Geometry, Position } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { loadGeo } from "../../charts/china-map";
import type { Map3DProps } from "../map3d";
import { TipRow, type SceneApi } from "../frame";
import { useThemeColors } from "../theme";
import { Controls, LabelLayer, LabelMover, LabelProjector, useLabelMotion } from "./common";

const VARS = ["--chart-1", "--chart-2", "--border", "--muted", "--muted-foreground", "--foreground"] as const;
type Colors = Record<(typeof VARS)[number], string>;
type Props = Map3DProps & { api: SceneApi };
const W = 10; // 地图宽度
const MAX_H = 1.5;
const BASE = 0.06;

type Geo = Awaited<ReturnType<typeof loadGeo>>;
interface Prov { name: string; short: string; geo: THREE.ExtrudeGeometry; c: THREE.Vector3 }

function shapesOf(g: Geometry, proj: GeoProjection): THREE.Shape[] {
  const polys: Position[][][] = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  const ring = (r: Position[]) => r.map((p) => { const [x, y] = proj(p as [number, number]) ?? [0, 0]; return new THREE.Vector2(x, -y); });
  return polys.map((poly) => {
    const s = new THREE.Shape(ring(poly[0]));
    poly.slice(1).forEach((h) => s.holes.push(new THREE.Path(ring(h))));
    return s;
  });
}

export default function Map3DScene(props: Props) {
  const colors = useThemeColors(VARS);
  const resetRef = useRef<(() => void) | null>(null);
  const els = useRef<(HTMLElement | null)[]>([]);
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => { let on = true; loadGeo().then((g) => on && setGeo(g)); return () => { on = false; }; }, []);

  const provs = useMemo<Prov[]>(() => {
    if (!geo) return [];
    const fc = { type: "FeatureCollection" as const, features: geo.provinces.filter((p) => !p.properties.adcode.includes("JD")) };
    // 取景按大陆算: 海南带着南海诸岛, 会把整体往南拉偏
    const main = { type: "FeatureCollection" as const, features: fc.features.filter((f) => !f.properties.adcode.startsWith("46")) };
    const proj = geoConicEqualArea().parallels([25, 47]).rotate([-105, 0]).fitExtent([[-W / 2, -W * 0.38], [W / 2, W * 0.38]], main as never);
    return fc.features.map((f) => {
      const g = new THREE.ExtrudeGeometry(shapesOf(f.geometry, proj), { depth: 1, bevelEnabled: false, curveSegments: 1 });
      g.rotateX(-Math.PI / 2);
      g.computeBoundingBox();
      const b = g.boundingBox!;
      const [cx, cy] = f.properties.cx != null && f.properties.cy != null ? proj([f.properties.cx, f.properties.cy]) ?? [0, 0] : [(b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2];
      return { name: f.properties.name, short: f.short, geo: g, c: new THREE.Vector3(cx, 0, cy) };
    });
  }, [geo]);
  useEffect(() => () => provs.forEach((p) => p.geo.dispose()), [provs]);

  // 名字匹配: 全称, 简称或前缀
  const valueOf = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of props.data) {
      const p = provs.find((x) => x.name === d.name || x.short === d.name || x.name.startsWith(d.name));
      if (p) m.set(p.name, d.value);
    }
    return m;
  }, [props.data, provs]);
  const vMax = Math.max(1e-9, ...valueOf.values());
  const hOf = (name: string) => (valueOf.has(name) ? BASE + (valueOf.get(name)! / vMax) * MAX_H : BASE);

  const top = props.labelTop ?? 5;
  const want = useMemo(() => [...valueOf].sort((a, b) => b[1] - a[1]).slice(0, top).map(([name]) => {
    const p = provs.find((x) => x.name === name)!;
    return { id: name, pos: new THREE.Vector3(p.c.x, hOf(name) + 0.25, p.c.z), text: p.short, className: "select-none whitespace-nowrap rounded bg-background/75 px-1 font-mono text-[10px] text-foreground backdrop-blur-sm" };
  }), [valueOf, provs, top]); // eslint-disable-line react-hooks/exhaustive-deps
  const { labels, map } = useLabelMotion(want);

  return (
    <div className="relative h-full w-full">
      <Canvas
        frameloop={props.api.active ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ position: [0, 8, 9], fov: 38 }}
        flat
        gl={{ antialias: true, alpha: true }}
        onDoubleClick={() => resetRef.current?.()}
        onPointerMissed={() => props.api.onHover(null)}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 10, 6]} intensity={1.5} />
        <directionalLight position={[-6, 4, -4]} intensity={0.35} />
        {provs.map((p) => (
          <Province key={p.name} p={p} h={hOf(p.name)} value={valueOf.get(p.name)} vMax={vMax} colors={colors} {...props} />
        ))}
        <Controls api={props.api} fit={{ radius: W * 0.5, dir: [0, 1.3, 1], margin: 0.9 }} target={[0, 0.2, 0.7]} autoRotate={props.autoRotate} autoRotateSpeed={0.35} minDistance={5} maxDistance={24} resetRef={resetRef} />
        <LabelMover map={map} reduced={props.api.reduced} />
        <LabelProjector items={labels} els={els} />
      </Canvas>
      <LabelLayer items={labels} els={els} />
      {!geo && <p className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">地图加载中…</p>}
    </div>
  );
}

function Province({ p, h, value, vMax, colors, api, metric = "数值", format = (v: number) => v.toLocaleString("zh-CN") }: Props & { p: Prov; h: number; value?: number; vMax: number; colors: Colors }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const cur = useRef(api.reduced ? h : BASE);
  const [hover, setHover] = useState(false);
  const target = useMemo(() => {
    const c = new THREE.Color();
    if (value == null) return c.set(colors["--muted"]).lerp(new THREE.Color(colors["--muted-foreground"]), 0.25);
    return c.set(colors["--chart-2"]).lerp(new THREE.Color(colors["--chart-1"]), Math.sqrt(value / vMax));
  }, [value, vMax, colors]);
  useFrame((_, dt) => {
    const m = ref.current, mt = mat.current; if (!m || !mt) return;
    const k = api.reduced ? 1 : Math.min(1, dt * 6);
    cur.current += (h - cur.current) * k;
    m.scale.y = Math.max(0.001, cur.current);
    mt.color.lerp(target, k);
    if (hover) mt.emissive.set(colors["--foreground"]).multiplyScalar(0.12); else mt.emissive.setRGB(0, 0, 0);
  });
  const move = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHover(true);
    api.onHover({
      x: e.nativeEvent.clientX, y: e.nativeEvent.clientY,
      content: (
        <div className="grid gap-1">
          <p className="font-medium">{p.name}</p>
          <TipRow label={metric} value={value == null ? "无数据" : format(value)} color={value == null ? undefined : `#${target.getHexString()}`} />
          {value != null && <TipRow label="占最高值" value={`${Math.round((value / vMax) * 100)}%`} />}
        </div>
      ),
    });
  };
  return (
    <mesh ref={ref} geometry={p.geo} scale={[1, cur.current, 1]} onPointerMove={move} onPointerOut={() => { setHover(false); api.onHover(null); }}>
      <meshStandardMaterial ref={mat} color={target} roughness={0.55} metalness={0.05} />
    </mesh>
  );
}
