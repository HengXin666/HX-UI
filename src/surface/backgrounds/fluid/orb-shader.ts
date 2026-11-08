// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Orb 条目, 实现为 HX 自有.
import { GLSL_HASH, GLSL_NOISE, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";

/** 入场: 光环从无到满的秒数. */
export const ORB_INTRO_SECONDS = 1.1;
/** 透视焦距 (平面单位), tiltX / tiltY 倾斜光环时用. */
export const ORB_FOCAL = 3.2;
/** 悬停程度的时间常数 (秒). */
export const ORB_HOVER_TAU = 0.16;
/** 贴近亮度的时间常数 (秒). */
export const ORB_NEAR_TAU = 0.12;
/** 伸向指针的弹簧: 刚度与阻尼. */
export const ORB_REACH_STIFFNESS = 70;
export const ORB_REACH_DAMPING = 7;
/** 点击脉冲的弹簧: 刚度与阻尼, 以及一次点击给的初速. */
export const ORB_PULSE_STIFFNESS = 170;
export const ORB_PULSE_DAMPING = 11;
export const ORB_PULSE_KICK = 4;
/** 点击回声环扩散到满所需秒数. */
export const ORB_ECHO_SECONDS = 1.2;

/** JS 侧每帧推进的光球状态. */
export interface OrbState {
  hover: number;
  near: number;
  reachX: number;
  reachY: number;
  reachSpeedX: number;
  reachSpeedY: number;
  rotation: number;
  orbit: number;
  pulse: number;
  pulseSpeed: number;
  kick: number;
  echo: number;
  reveal: number;
}

/** 本帧的输入: 指针相对球心的偏移 (光球半径为 1), 是否瞄着球, 是否刚点过. */
export interface OrbInput {
  readonly aimX: number;
  readonly aimY: number;
  readonly inside: boolean;
  readonly aimed: boolean;
  readonly tapped: boolean;
}

export interface OrbSettings {
  readonly hoverIntensity: number;
  readonly rotateOnHover: boolean;
  readonly forceHoverState: boolean;
  readonly followCursor: boolean;
  readonly clickPulse: boolean;
}

export function createOrbState(revealed: boolean): OrbState {
  return { hover: 0, near: 0, reachX: 0, reachY: 0, reachSpeedX: 0, reachSpeedY: 0, rotation: 0, orbit: 0, pulse: 0, pulseSpeed: 0, kick: 0, echo: 1, reveal: revealed ? 1 : 0 };
}

/** 角度差折到 (-pi, pi]. */
export function wrapAngle(a: number): number {
  const turn = Math.PI * 2;
  return a - turn * Math.floor((a + Math.PI) / turn);
}

/**
 * 推进一帧: 悬停与贴近按指数逼近, 伸向指针走弹簧, 尾迹头部转向指针 (无指针时匀速绕行),
 * 点击给脉冲弹簧一个初速并重放回声环, 入场线性涨满.
 *
 * @param s 原地修改的状态.
 * @param input 本帧指针输入.
 * @param settings 相关 props.
 * @param dt 帧长 (秒).
 */
export function stepOrb(s: OrbState, input: OrbInput, settings: OrbSettings, dt: number): void {
  const hoverTarget = settings.forceHoverState || (input.inside && input.aimed) ? 1 : 0;
  s.hover += (hoverTarget - s.hover) * (1 - Math.exp(-dt / ORB_HOVER_TAU));
  const goalX = settings.followCursor && input.inside ? input.aimX : 0;
  const goalY = settings.followCursor && input.inside ? input.aimY : 0;
  s.reachSpeedX += (ORB_REACH_STIFFNESS * (goalX - s.reachX) - ORB_REACH_DAMPING * s.reachSpeedX) * dt;
  s.reachSpeedY += (ORB_REACH_STIFFNESS * (goalY - s.reachY) - ORB_REACH_DAMPING * s.reachSpeedY) * dt;
  s.reachX += s.reachSpeedX * dt;
  s.reachY += s.reachSpeedY * dt;
  s.near += (hoverTarget * settings.hoverIntensity - s.near) * (1 - Math.exp(-dt / ORB_NEAR_TAU));
  if (settings.rotateOnHover) s.rotation += dt * 0.3 * s.hover;
  const target = input.inside ? Math.atan2(input.aimY, input.aimX) : s.orbit + dt * 0.8;
  s.orbit += wrapAngle(target - s.orbit) * (1 - Math.exp(-dt * 6));
  if (input.tapped && settings.clickPulse) {
    s.pulseSpeed += ORB_PULSE_KICK;
    s.kick = 1;
    s.echo = 0;
  }
  s.pulseSpeed += (-ORB_PULSE_STIFFNESS * s.pulse - ORB_PULSE_DAMPING * s.pulseSpeed) * dt;
  s.pulse += s.pulseSpeed * dt;
  s.echo = Math.min(1, s.echo + dt / ORB_ECHO_SECONDS);
  s.kick *= Math.exp(-dt * 2.5);
  if (s.reveal < 1) s.reveal = Math.min(1, s.reveal + dt / ORB_INTRO_SECONDS);
}

/** 光球: 透视倾斜的平面上一圈噪声扰动的光环, 内侧渐隐出体积, 外侧泛光, 向指针隆起, 尾迹沿环绕行, 点击放出回声环. */
export const ORB_FRAGMENT = fragmentSource(`
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_bg;
uniform float u_hue;
uniform float u_size;
uniform float u_glow;
uniform float u_bleed;
uniform float u_wobble;
uniform float u_highlight;
uniform float u_trail;
uniform vec2 u_tilt;
uniform float u_rotation;
uniform vec2 u_reach;
uniform float u_near;
uniform float u_orbit;
uniform float u_pulse;
uniform vec2 u_echo;
uniform float u_reveal;

const float FOCAL = ${ORB_FOCAL.toFixed(1)};

float light1(float i, float a, float d) { return i / (1.0 + d * a); }
float light2(float i, float a, float d) { return i / (1.0 + d * d * a); }

vec3 hueTurn(vec3 c, float deg) {
  vec3 yiq = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312) * c;
  float a = radians(deg);
  yiq.yz = mat2(cos(a), sin(a), -sin(a), cos(a)) * yiq.yz;
  return mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703) * yiq;
}

vec2 planeAt(vec2 p) {
  vec3 ro = vec3(0.0, 0.0, -FOCAL);
  vec3 rd = normalize(vec3(p, FOCAL));
  float cx = cos(u_tilt.x); float sx = sin(u_tilt.x);
  float cy = cos(u_tilt.y); float sy = sin(u_tilt.y);
  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
  mat3 ry = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 r = ry * rx;
  ro = ro * r;
  rd = rd * r;
  float t = -ro.z / (abs(rd.z) < 1e-4 ? 1e-4 : rd.z);
  return (ro + rd * max(t, 0.0)).xy;
}

void main() {
  vec2 q = hx_rot(u_rotation) * planeAt(hx_centered(gl_FragCoord.xy) * 2.0 / max(u_size, 0.05));
  float rawLen = length(q);
  float ang = atan(q.y, q.x);
  float reach = length(u_reach);
  float reachAmount = min(reach, 1.0) * 0.35 * u_bleed;
  float facing = rawLen > 1e-4 && reach > 1e-4 ? max(dot(q / rawLen, u_reach / reach), 0.0) : 0.0;
  facing *= facing;
  float len = max(rawLen - reachAmount * facing * smoothstep(0.25, 0.65, rawLen), 0.0);
  float n0 = hx_vnoise3(vec3(cos(ang), sin(ang), u_time * 0.35) * 1.6) * 2.0 - 1.0;
  float r0 = (0.62 + 0.07 * n0 * u_wobble) * (1.0 + 0.12 * u_pulse) * mix(0.6, 1.0, u_reveal);
  float v0 = light1(1.0, 10.0 * (1.0 + u_near), abs(len - r0));
  v0 *= smoothstep(r0 * 1.05, r0, len);
  float innerFade = smoothstep(r0 * (1.0 - 0.2 * reach), r0 * (1.0 - 0.05 * reach), len);
  float body = smoothstep(0.8 - 0.2 * reach, 0.8, len / max(r0, 1e-3) * 0.8);
  float lag = mod(u_orbit - ang, HX_TAU);
  float trail = u_trail > 0.0 ? smoothstep(0.0, 0.35, lag) * exp(-max(lag, 0.0) * 2.6 / u_trail) : 0.0;
  float band = v0 * smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len) * body;
  float bloom = light2(1.0, 160.0 / max(u_glow, 0.05), max(len - r0, 0.0)) * smoothstep(0.4, 0.0, len - r0) * step(r0, len);
  float v2 = smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len);
  float echoD = abs(len - r0 - u_echo.x * 0.9);
  float echo = light1(1.0, 60.0, echoD) * smoothstep(0.12, 0.0, echoD) * u_echo.y;
  float spot = exp(-dot(q - vec2(-0.25, 0.3) * r0, q - vec2(-0.25, 0.3) * r0) * 18.0) * innerFade * u_highlight;
  vec3 tint = mix(u_c0, u_c1, 0.5 + 0.5 * sin(ang * 2.0 + u_time * 0.6 + n0));
  tint = mix(tint, u_c2, smoothstep(0.3, 1.0, len / max(r0, 1e-3)) * 0.5);
  tint = hueTurn(tint, u_hue);
  float energy = (v0 * (1.0 + 1.5 * trail) + band * 0.6 + v2 * innerFade * 0.18) * (1.0 + 0.6 * u_near) + bloom * u_glow * 0.8;
  vec3 col = tint * energy + vec3(spot * 0.35) + tint * echo;
  col *= u_reveal;
  o_color = vec4(u_bg + hx_tonemap(col * 1.6) * (1.0 - hx_luma(u_bg) * 0.5), 1.0);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
