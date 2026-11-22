import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { GlobeArc, GlobeArcsProps } from "../globe-arcs";
import { TipRow, type SceneApi } from "../frame";
import { isLand } from "../land-mask";
import { useThemeColors } from "../theme";
import { Controls, LabelLayer, LabelProjector, type LabelSpec } from "./common";

const VARS = ["--chart-1", "--chart-2", "--chart-3", "--muted-foreground", "--background", "--foreground", "--brand"] as const;
type Colors = Record<(typeof VARS)[number], string>;
type Props = GlobeArcsProps & { api: SceneApi };

const TUBE = 64;
const RADIAL = 6;

export function toVec(lat: number, lng: number, r = 1) {
  const phi = THREE.MathUtils.degToRad(90 - lat), theta = THREE.MathUtils.degToRad(lng + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

export default function GlobeScene(props: Props) {
  const colors = useThemeColors(VARS);
  const resetRef = useRef<(() => void) | null>(null);
  // 默认看向所有端点的球面中心, 避免只盯第一条弧的起点把远端裁掉
  const home = useMemo(() => {
    if (props.focus) return toVec(props.focus[0] - 12, props.focus[1], 3.1).toArray() as [number, number, number];
    const c = new THREE.Vector3();
    for (const p of endpoints(props.arcs, props.points)) c.add(toVec(p.at[0], p.at[1], 1));
    if (c.lengthSq() < 1e-4) return toVec(8, 110, 3.1).toArray() as [number, number, number];
    c.normalize(); c.y -= 0.2; // 稍微从下往上看, 北半球的弧更立体
    return c.normalize().multiplyScalar(3.1).toArray() as [number, number, number];
    // 只在首次挂载时定机位, 数据变化不抢镜头
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const els = useRef<(HTMLElement | null)[]>([]);
  const labels = useMemo<LabelSpec[]>(() => endpoints(props.arcs, props.points).filter((p) => p.name).map((p) => ({
    id: p.at.join(),
    pos: toVec(p.at[0], p.at[1], 1.035), text: p.name,
    className: "select-none whitespace-nowrap rounded bg-background/70 px-1 font-mono text-[10px] text-foreground backdrop-blur-sm",
  })), [props.arcs, props.points]);
  return (
    <div className="relative h-full w-full">
    <Canvas
      frameloop={props.api.active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: home, fov: 40 }}
      flat
      gl={{ antialias: true, alpha: true }}
      onDoubleClick={() => resetRef.current?.()}
      onPointerMissed={() => props.api.onHover(null)}
    >
      <ambientLight intensity={1} />
      <Globe {...props} colors={colors} />
      <Controls api={props.api} fit={{ radius: 1.8, dir: home, margin: 1 }} autoRotate={props.autoRotate ?? true} autoRotateSpeed={0.35} minDistance={1.7} maxDistance={6} maxPolar={Math.PI - 0.15} resetRef={resetRef} />
      <LabelProjector items={labels} els={els} facing />
    </Canvas>
    <LabelLayer items={labels} els={els} />
    </div>
  );
}

function Globe({ arcs, points = [], format = (v) => v.toLocaleString("zh-CN"), valueLabel = "数值", flow = true, api, colors }: Props & { colors: Colors }) {
  const animate = flow && !api.reduced;

  // 陆地点阵: 斐波那契球面均匀取点, 只留陆地
  const dots = useMemo(() => {
    const N = 16000, pts: number[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      const v = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
      const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(v.y));
      const lng = THREE.MathUtils.radToDeg(Math.atan2(v.z, -v.x)) - 180;
      const L = lng < -180 ? lng + 360 : lng;
      if (isLand(lat, L)) pts.push(v.x * 1.002, v.y * 1.002, v.z * 1.002);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const disc = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d")!; x.fillStyle = "#fff"; x.beginPath(); x.arc(32, 32, 28, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); return t;
  }, []);
  useEffect(() => () => { dots.dispose(); disc.dispose(); }, [dots, disc]);

  const vmax = Math.max(1e-9, ...arcs.map((a) => a.value ?? 1));
  // 飞线按 "起点→终点" 配对: 新线从起点画到终点, 删掉的线从起点收回到终点后移除, 量变化时粗细过渡
  const [leaving, setLeaving] = useState<Map<string, GlobeArc>>(new Map());
  const prevArcs = useRef<GlobeArc[]>(arcs);
  const live = useMemo(() => new Map(arcs.map((a) => [arcKey(a), a])), [arcs]);
  useEffect(() => {
    const gone = prevArcs.current.filter((a) => !live.has(arcKey(a)));
    prevArcs.current = arcs;
    setLeaving((m) => {
      const next = new Map([...m].filter(([k]) => !live.has(k)));
      if (!api.reduced) gone.forEach((a) => next.set(arcKey(a), a));
      return next;
    });
  }, [arcs]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = useMemo(() => [...arcs.map((a) => ({ a, out: false })), ...[...leaving.values()].map((a) => ({ a, out: true }))], [arcs, leaving]);

  // 首屏按顺序依次画出, 之后新加的线立即开始画
  const firstPaint = useRef(true);
  useEffect(() => { firstPaint.current = false; }, []);
  const [hover, setHover] = useState<string | null>(null);
  const rings = useRef<THREE.Group>(null);
  const clock = useRef(0);
  useFrame((_, dt) => {
    clock.current += dt;
    if (!animate) return;
    rings.current?.children.forEach((g, i) => {
      const t = (clock.current * 0.6 + i * 0.27) % 1;
      g.scale.setScalar(1 + t * 2.4);
      ((g as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t);
    });
  });

  // 端点 (去重), 只属于正在离开的线的端点跟着缩掉
  const ends = useMemo(() => {
    const keep = new Set(endpoints(arcs, points).map((p) => p.at.join()));
    return endpoints(shown.map((x) => x.a), points).map((p) => ({ ...p, out: !keep.has(p.at.join()) }));
  }, [arcs, points, shown]);

  const tip = (a: GlobeArc) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const k = arcKey(a);
    if (hover !== k) setHover(k);
    api.onHover({
      x: e.nativeEvent.clientX, y: e.nativeEvent.clientY,
      content: (
        <div className="grid gap-1">
          <p className="font-medium">{a.fromName ?? "起点"} → {a.toName ?? "终点"}</p>
          {a.value != null && <TipRow label={valueLabel} value={format(a.value)} color={colors["--chart-1"]} />}
          {a.label && <p className="text-muted-foreground">{a.label}</p>}
        </div>
      ),
    });
  };

  const sphereColor = useMemo(() => new THREE.Color(colors["--background"]).lerp(new THREE.Color(colors["--foreground"]), 0.004), [colors]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color={sphereColor} />
      </mesh>
      <Atmosphere color={colors["--brand"]} />
      <points geometry={dots}>
        <pointsMaterial color={colors["--muted-foreground"]} size={0.04} sizeAttenuation map={disc} transparent depthWrite={false} opacity={0.8} />
      </points>
      {shown.map(({ a, out }, i) => {
        const k = arcKey(a);
        return (
          <ArcLine key={k} arc={a} out={out} index={i} delay={firstPaint.current ? (i % 12) * 0.05 : 0} vmax={vmax} colors={colors} reduced={api.reduced} animate={animate} clock={clock}
            dim={hover != null && hover !== k} lit={hover === k}
            onMove={tip(a)} onOut={() => { setHover(null); api.onHover(null); }}
            onGone={() => setLeaving((m) => { const n = new Map(m); n.delete(k); return n; })} />
        );
      })}
      <group ref={rings}>
        {!api.reduced && ends.filter((p) => !p.out).map((p) => {
          const v = toVec(p.at[0], p.at[1], 1.004);
          return (
            <mesh key={p.at.join()} position={v} ref={(m) => lookOut(m, v)}>
              <ringGeometry args={[0.014, 0.019, 32]} />
              <meshBasicMaterial color={colors["--chart-1"]} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          );
        })}
      </group>
      {ends.map((p) => <EndDot key={p.at.join()} at={p.at} out={p.out} reduced={api.reduced} color={colors["--foreground"]} />)}
    </group>
  );
}

export function arcKey(a: GlobeArc) {
  return `${a.fromName ?? a.from.join()}→${a.toName ?? a.to.join()}`;
}
const lookOut = (m: THREE.Object3D | null, v: THREE.Vector3) => { if (m) m.lookAt(v.clone().multiplyScalar(2)); };

/** 端点: 出现时放大, 离开时缩掉 */
function EndDot({ at, out, reduced, color }: { at: [number, number]; out: boolean; reduced: boolean; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const s = useRef(reduced ? 1 : 0);
  const v = useMemo(() => toVec(at[0], at[1], 1.005), [at]);
  useFrame((_, dt) => {
    const m = ref.current; if (!m) return;
    const to = out ? 0 : 1;
    s.current = reduced ? to : s.current + (to - s.current) * Math.min(1, dt * 9);
    m.scale.setScalar(Math.max(0.0001, s.current));
  });
  return (
    <mesh ref={(m) => { ref.current = m; lookOut(m, v); }} position={v} scale={s.current || 0.0001}>
      <circleGeometry args={[0.012, 24]} />
      <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}

const C0 = new THREE.Color(), C1 = new THREE.Color(), CT = new THREE.Color();
function paintTube(g: THREE.BufferGeometry, c0: string, c1: string) {
  C0.set(c0); C1.set(c1);
  const n = g.getAttribute("position").count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = Math.floor(i / (RADIAL + 1)) / TUBE; CT.copy(C0).lerp(C1, u); col.set([CT.r, CT.g, CT.b], i * 3); }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
}

/**
 * 一条飞线. 画多少由 head / tail 决定 (0..1 沿线的位置): 进场 head 0→1, 离场 tail 0→1, 都画完再交给流光.
 * 粗细按量, 变化时逐帧重建管子 (几十段, 很便宜).
 */
function ArcLine({ arc, out, index, delay, vmax, colors, reduced, animate, clock, dim, lit, onMove, onOut, onGone }: {
  arc: GlobeArc; out: boolean; index: number; delay: number; vmax: number; colors: Colors; reduced: boolean; animate: boolean;
  clock: React.MutableRefObject<number>; dim: boolean; lit: boolean;
  onMove: (e: ThreeEvent<PointerEvent>) => void; onOut: () => void; onGone: () => void;
}) {
  const curve = useMemo(() => {
    const A = toVec(arc.from[0], arc.from[1]), B = toVec(arc.to[0], arc.to[1]);
    const alt = 0.06 + A.angleTo(B) * 0.2;
    return new THREE.CatmullRomCurve3(Array.from({ length: 48 }, (_, k) => { const t = k / 47; return slerp(A, B, t).multiplyScalar(1 + alt * Math.sin(Math.PI * t)); }));
  }, [arc.from.join(), arc.to.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const radiusTo = 0.0032 + 0.0058 * ((arc.value ?? 1) / vmax);
  const radius = useRef(radiusTo);
  const built = useRef(radiusTo);
  const build = (r: number) => { const t = new THREE.TubeGeometry(curve, TUBE, r, RADIAL, false); paintTube(t, colors["--chart-2"], colors["--chart-1"]); return t; };
  const [tube, setTube] = useState(() => build(radiusTo));
  const flowGeo = useMemo(() => { const f = tube.clone(); return f; }, [tube]);
  const hit = useMemo(() => new THREE.TubeGeometry(curve, 24, 0.03, 4, false), [curve]);
  useEffect(() => () => { tube.dispose(); flowGeo.dispose(); }, [tube, flowGeo]);
  useEffect(() => () => hit.dispose(), [hit]);
  useEffect(() => { setTube(build(radius.current)); }, [colors]); // eslint-disable-line react-hooks/exhaustive-deps

  const head = useRef(reduced ? 1 : 0), tail = useRef(0);
  const wait = useRef(reduced ? 0 : delay);
  const done = useRef(false);
  const phase = (index * 0.37) % 1, speed = 0.55 + (index % 3) * 0.12;
  const per = RADIAL * 6;
  useFrame((_, dt) => {
    if (wait.current > 0) { wait.current -= dt; tube.setDrawRange(0, 0); flowGeo.setDrawRange(0, 0); return; }
    const k = reduced ? 1 : Math.min(1, dt * 2.6);
    head.current += (1 - head.current) * k; if (1 - head.current < 0.002) head.current = 1;
    if (out) { tail.current += (1 - tail.current) * k; if (1 - tail.current < 0.004 && !done.current) { done.current = true; onGone(); } }
    // 粗细过渡
    radius.current += (radiusTo - radius.current) * Math.min(1, dt * 7);
    if (Math.abs(radius.current - built.current) > 0.00025) { built.current = radius.current; setTube(build(radius.current)); return; }
    const s = Math.floor(tail.current * TUBE), e = Math.ceil(head.current * TUBE);
    tube.setDrawRange(s * per, Math.max(0, e - s) * per);
    if (animate) {
      const seg = 18;
      const pos = ((clock.current * speed + phase) % 1) * (TUBE + seg) - seg;
      const fs = Math.max(s, Math.floor(pos)), fe = Math.min(e, Math.floor(pos + seg));
      flowGeo.setDrawRange(fs * per, Math.max(0, fe - fs) * per);
    } else flowGeo.setDrawRange(0, 0);
  });
  const base = animate ? 0.28 : 0.85;
  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial vertexColors transparent opacity={lit ? 0.9 : dim ? 0.08 : base} />
      </mesh>
      {animate && (
        <mesh geometry={flowGeo}>
          <meshBasicMaterial vertexColors transparent opacity={dim || out ? 0.15 : 1} toneMapped={false} />
        </mesh>
      )}
      {!out && (
        <mesh geometry={hit} onPointerMove={onMove} onPointerOut={onOut}>
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/** 大气光晕: 背面渲染的菲涅尔壳 */
function Atmosphere({ color }: { color: string }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) } },
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(c, f * 0.55); }",
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [color]);
  useEffect(() => () => mat.dispose(), [mat]);
  return <mesh scale={1.14} material={mat}><sphereGeometry args={[1, 48, 48]} /></mesh>;
}

function slerp(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const ang = a.angleTo(b);
  if (ang < 1e-6) return a.clone();
  const s = Math.sin(ang);
  return a.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(b.clone().multiplyScalar(Math.sin(t * ang) / s));
}

function endpoints(arcs: GlobeArcsProps["arcs"], points: GlobeArcsProps["points"] = []) {
  const map = new Map<string, { at: [number, number]; name?: string }>();
  for (const a of arcs) {
    map.set(a.from.join(), { at: a.from, name: a.fromName ?? map.get(a.from.join())?.name });
    map.set(a.to.join(), { at: a.to, name: a.toName ?? map.get(a.to.join())?.name });
  }
  for (const p of points) map.set(p.at.join(), { at: p.at, name: p.name });
  return [...map.values()];
}
