import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { GlobeArcsProps } from "../globe-arcs";
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
  const focus = props.focus ?? props.arcs[0]?.from ?? [20, 110];
  const home = toVec(focus[0] - 12, focus[1], 3.1).toArray() as [number, number, number];
  const els = useRef<(HTMLElement | null)[]>([]);
  const labels = useMemo<LabelSpec[]>(() => endpoints(props.arcs, props.points).filter((p) => p.name).map((p) => ({
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
      <Controls api={props.api} fit={{ radius: 1.42, dir: home, margin: 1 }} autoRotate={props.autoRotate ?? true} autoRotateSpeed={0.35} minDistance={1.7} maxDistance={6} maxPolar={Math.PI - 0.15} resetRef={resetRef} />
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
  const built = useMemo(() => arcs.map((a, i) => {
    const A = toVec(a.from[0], a.from[1]), B = toVec(a.to[0], a.to[1]);
    const ang = A.angleTo(B);
    const alt = 0.06 + ang * 0.2;
    const pts = Array.from({ length: 48 }, (_, k) => {
      const t = k / 47;
      const v = slerp(A, B, t);
      return v.multiplyScalar(1 + alt * Math.sin(Math.PI * t));
    });
    const curve = new THREE.CatmullRomCurve3(pts);
    const r = 0.0032 + 0.0058 * ((a.value ?? 1) / vmax);
    const tube = new THREE.TubeGeometry(curve, TUBE, r, RADIAL, false);
    const hit = new THREE.TubeGeometry(curve, 24, 0.03, 4, false);
    const flowGeo = tube.clone();
    return { a, A, B, tube, hit, flowGeo, phase: (i * 0.37) % 1, speed: 0.55 + (i % 3) * 0.12 };
  }), [arcs, vmax]);
  useEffect(() => () => built.forEach((b) => { b.tube.dispose(); b.hit.dispose(); b.flowGeo.dispose(); }), [built]);

  // 渐变: 起点 chart-2, 终点 chart-1
  useEffect(() => {
    const c0 = new THREE.Color(colors["--chart-2"]), c1 = new THREE.Color(colors["--chart-1"]), tmp = new THREE.Color();
    for (const b of built) for (const g of [b.tube, b.flowGeo]) {
      const n = g.getAttribute("position").count;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const u = Math.floor(i / (RADIAL + 1)) / TUBE; tmp.copy(c0).lerp(c1, u); col.set([tmp.r, tmp.g, tmp.b], i * 3); }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
  }, [built, colors]);

  const [hover, setHover] = useState<number | null>(null);
  const rings = useRef<THREE.Group>(null);
  const clock = useRef(0);
  useFrame((_, dt) => {
    clock.current += dt;
    if (animate) {
      const seg = 18;
      for (const b of built) {
        const pos = ((clock.current * b.speed + b.phase) % 1) * (TUBE + seg) - seg;
        const s = Math.max(0, Math.floor(pos)), e = Math.min(TUBE, Math.floor(pos + seg));
        b.flowGeo.setDrawRange(s * RADIAL * 6, Math.max(0, e - s) * RADIAL * 6);
      }
      rings.current?.children.forEach((g, i) => {
        const t = (clock.current * 0.6 + i * 0.27) % 1;
        g.scale.setScalar(1 + t * 2.4);
        ((g as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t);
      });
    } else {
      for (const b of built) b.flowGeo.setDrawRange(0, Infinity);
    }
  });

  // 端点 (去重)
  const ends = useMemo(() => endpoints(arcs, points), [arcs, points]);

  const onArc = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (hover !== i) setHover(i);
    const a = arcs[i];
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
  const lookOut = (m: THREE.Object3D | null, v: THREE.Vector3) => { if (m) m.lookAt(v.clone().multiplyScalar(2)); };

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
      {built.map((b, i) => (
        <group key={i}>
          <mesh geometry={b.tube}>
            <meshBasicMaterial vertexColors transparent opacity={hover == null ? (animate ? 0.28 : 0.85) : hover === i ? 0.9 : 0.08} />
          </mesh>
          {animate && (
            <mesh geometry={b.flowGeo}>
              <meshBasicMaterial vertexColors transparent opacity={hover == null || hover === i ? 1 : 0.15} toneMapped={false} />
            </mesh>
          )}
          <mesh geometry={b.hit} onPointerMove={onArc(i)} onPointerOut={() => { setHover(null); api.onHover(null); }}>
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <group ref={rings}>
        {!api.reduced && ends.map((p, i) => {
          const v = toVec(p.at[0], p.at[1], 1.004);
          return (
            <mesh key={i} position={v} ref={(m) => lookOut(m, v)}>
              <ringGeometry args={[0.014, 0.019, 32]} />
              <meshBasicMaterial color={colors["--chart-1"]} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          );
        })}
      </group>
      {ends.map((p, i) => {
        const v = toVec(p.at[0], p.at[1], 1.005);
        return (
          <group key={i}>
            <mesh position={v} ref={(m) => lookOut(m, v)}>
              <circleGeometry args={[0.012, 24]} />
              <meshBasicMaterial color={colors["--foreground"]} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
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
