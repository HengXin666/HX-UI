import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import type { SceneApi } from "../frame";

interface ControlsProps {
  api: SceneApi;
  /** 固定的初始相机位置; 给了 fit 就按画布比例自动算 */
  home?: [number, number, number];
  /** 让半径为 radius 的球刚好装进画面, 相机从 dir 方向看过去 */
  fit?: { radius: number; dir: [number, number, number]; margin?: number };
  target?: [number, number, number];
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  /** 不让相机钻到地面以下 */
  maxPolar?: number;
  /** 场景注册的双击/复位回调 */
  resetRef?: React.MutableRefObject<(() => void) | null>;
}

/**
 * 轨道控制 + 键盘 + 平滑复位. 自动旋转只在非减弱动效时开.
 * 方向键: 左右绕转 15°, 上下俯仰 10°; + / - 缩放; 0 复位.
 */
export function Controls({ api, home: fixedHome, fit, target = [0, 0, 0], autoRotate = false, autoRotateSpeed = 0.6, minDistance = 2, maxDistance = 40, maxPolar = Math.PI / 2.05, resetRef }: ControlsProps) {
  const ref = useRef<OrbitImpl>(null);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const fly = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null);
  const tgt = useRef(new THREE.Vector3(...target));
  const size = useThree((s) => s.size);
  const touched = useRef(false);
  const home = useMemo<[number, number, number]>(() => {
    if (!fit) return fixedHome ?? [0, 0, 5];
    const cam = camera as THREE.PerspectiveCamera;
    const half = THREE.MathUtils.degToRad(cam.fov / 2);
    const aspect = size.width / Math.max(1, size.height);
    const t = Math.min(Math.tan(half), Math.tan(half) * aspect);
    const d = (fit.radius / t) * (fit.margin ?? 1.08);
    const v = new THREE.Vector3(...fit.dir).normalize().multiplyScalar(d).add(new THREE.Vector3(...target));
    return v.toArray() as [number, number, number];
  }, [fit?.radius, fit?.dir.join(), fit?.margin, fixedHome?.join(), size.width, size.height, target.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  // 用户还没动过相机时, 画布尺寸变化就重新取景
  useEffect(() => {
    if (touched.current) return;
    camera.position.set(...home); ref.current?.update(); invalidate();
  }, [home, camera, invalidate]);

  const move = (fn: (s: THREE.Spherical) => void) => {
    const c = ref.current; if (!c) return;
    const off = camera.position.clone().sub(c.target);
    const s = new THREE.Spherical().setFromVector3(off);
    fn(s);
    s.phi = Math.min(maxPolar, Math.max(0.15, s.phi));
    s.radius = Math.min(maxDistance, Math.max(minDistance, s.radius));
    camera.position.copy(c.target).add(new THREE.Vector3().setFromSpherical(s));
    c.update(); invalidate();
  };
  const reset = () => {
    if (api.reduced) { camera.position.set(...home); ref.current?.target.copy(tgt.current); ref.current?.update(); invalidate(); return; }
    fly.current = { from: camera.position.clone(), to: new THREE.Vector3(...home), t: 0 }; invalidate();
  };

  useEffect(() => {
    api.keys.current = (k) => {
      const step = THREE.MathUtils.degToRad(15);
      if (k === "ArrowLeft") move((s) => { s.theta -= step; });
      else if (k === "ArrowRight") move((s) => { s.theta += step; });
      else if (k === "ArrowUp") move((s) => { s.phi -= step * 0.66; });
      else if (k === "ArrowDown") move((s) => { s.phi += step * 0.66; });
      else if (k === "+" || k === "=") move((s) => { s.radius *= 0.85; });
      else if (k === "-" || k === "_") move((s) => { s.radius /= 0.85; });
      else if (k === "0" || k === "Home") { touched.current = false; reset(); return true; }
      else return false;
      touched.current = true;
      return true;
    };
    if (resetRef) resetRef.current = () => { touched.current = false; reset(); };
    return () => { api.keys.current = null; };
  });

  useFrame((_, dt) => {
    const f = fly.current; if (!f) return;
    f.t = Math.min(1, f.t + dt / 0.45);
    const e = 1 - (1 - f.t) ** 3;
    camera.position.lerpVectors(f.from, f.to, e);
    ref.current?.target.lerp(tgt.current, e);
    ref.current?.update();
    if (f.t >= 1) fly.current = null; else invalidate();
  });

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      target={target}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      autoRotate={autoRotate && !api.reduced}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={maxPolar}
      onStart={() => { touched.current = true; }}
    />
  );
}

/** 地面网格线 */
export function FloorGrid({ w, d, step = 1, color, opacity = 0.35, y = 0 }: { w: number; d: number; step?: number; color: string; opacity?: number; y?: number }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let x = -w / 2; x <= w / 2 + 1e-6; x += step) pts.push(x, y, -d / 2, x, y, d / 2);
    for (let z = -d / 2; z <= d / 2 + 1e-6; z += step) pts.push(-w / 2, y, z, w / 2, y, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [w, d, step, y]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}

/** 坐标轴上的文字, 用 DOM 画, 不额外下载字体 */
export const axisLabelClass = "pointer-events-none select-none whitespace-nowrap font-mono text-[10px] text-muted-foreground";

export interface LabelSpec {
  pos: THREE.Vector3;
  text: React.ReactNode;
  className?: string;
}

/**
 * 把 3D 位置投影成屏幕坐标, 直接写到画布外的 DOM 标签上 (不走 React 渲染, 每帧只改 transform).
 * facing: 球面上的点, 转到背面时淡出.
 */
export function LabelProjector({ items, els, facing = false }: { items: LabelSpec[]; els: React.MutableRefObject<(HTMLElement | null)[]>; facing?: boolean }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  const n = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    items.forEach((it, i) => {
      const el = els.current[i]; if (!el) return;
      v.copy(it.pos).project(camera);
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -50%)`;
      if (facing) {
        const d = n.copy(it.pos).normalize().dot(camera.position.clone().sub(it.pos).normalize());
        el.style.opacity = d > 0.2 ? "1" : d > 0 ? String(d / 0.2) : "0";
      } else if (el.style.opacity !== "1") el.style.opacity = "1";
    });
  });
  return null;
}

/** 画布外的标签层, 配合 LabelProjector 使用 */
export function LabelLayer({ items, els }: { items: LabelSpec[]; els: React.MutableRefObject<(HTMLElement | null)[]> }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it, i) => (
        <span key={i} ref={(el) => { els.current[i] = el; }} className={"absolute left-0 top-0 opacity-0 transition-opacity duration-200 " + (it.className ?? axisLabelClass)}>
          {it.text}
        </span>
      ))}
    </div>
  );
}
