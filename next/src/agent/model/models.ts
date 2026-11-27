/**
 * Agent 客户端 (provider) 与模型选择的数据层 (纯函数, 无 "use client", 服务端安全).
 * 对照 T3 Code 的 ProviderModelPicker: 先选 Agent 客户端 (Codex / Claude Code / OpenCode ...), 再选它的模型,
 * 模型声明自己支持的推理强度档位 (T3 的 reasoning select), 换模型时强度吸附到新模型支持的最近一档.
 * 组件在 model-picker.tsx.
 */
import type { ReactNode } from "react";

/** 推理强度, 由低到高 */
export type ReasoningEffort = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

export const EFFORT_ORDER: readonly ReasoningEffort[] = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];

export const EFFORT_LABEL: Record<ReasoningEffort, string> = {
  off: "关闭",
  minimal: "极低",
  low: "低",
  medium: "中",
  high: "高",
  xhigh: "超高",
  max: "最高",
};

/** 各档的一句话说明 (拖动时的气泡, 读屏) */
export const EFFORT_HINT: Partial<Record<ReasoningEffort, string>> = {
  off: "不思考, 直接回答",
  minimal: "几乎不思考, 最快",
  low: "简单任务够用",
  medium: "大多数任务的默认",
  high: "复杂改动, 多想几步",
  xhigh: "很难的问题",
  max: "最长思考, 最慢最贵",
};

export interface AgentModelOption {
  id: string;
  /** 显示名, 不给用 id */
  name?: string;
  /** 一句话简介 ("最强推理, 适合大改动") */
  description?: string;
  /** 角标 ("新", "快") */
  badge?: string;
  /** 支持的推理强度; 不给或空表示不能调 */
  efforts?: readonly ReasoningEffort[];
  /** 默认强度, 不给取中间一档 */
  defaultEffort?: ReasoningEffort;
  /** 上下文窗口 (token) */
  contextWindow?: number;
  disabled?: boolean;
}

export interface AgentClientOption {
  id: string;
  name: string;
  /** 小图标 (16px) */
  icon?: ReactNode;
  description?: string;
  models: readonly AgentModelOption[];
  /** 不可用时的原因 (未安装 / 未登录), 有就置灰 */
  unavailable?: string;
}

export interface AgentModelSelection {
  client: string;
  model: string;
  effort?: ReasoningEffort;
}

export const modelName = (m: Pick<AgentModelOption, "id" | "name">) => m.name ?? m.id;

/** 模型支持的强度, 按由低到高排好 */
export function effortsOf(m: Pick<AgentModelOption, "efforts"> | undefined): ReasoningEffort[] {
  const set = new Set(m?.efforts ?? []);
  return EFFORT_ORDER.filter((e) => set.has(e));
}

/** 吸附到 levels 里离 wanted 最近的一档 (同样近取较低的; 不会从开着吸附成 "关闭"); levels 为空时 undefined */
export function nearestEffort(levels: readonly ReasoningEffort[], wanted: ReasoningEffort | undefined): ReasoningEffort | undefined {
  if (!levels.length) return undefined;
  if (wanted === undefined || levels.includes(wanted)) return wanted ?? levels[Math.floor((levels.length - 1) / 2)];
  const w = EFFORT_ORDER.indexOf(wanted);
  const on = levels.filter((l) => l !== "off");
  const pool = wanted !== "off" && on.length ? on : levels;
  let best = pool[0];
  for (const l of pool) if (Math.abs(EFFORT_ORDER.indexOf(l) - w) < Math.abs(EFFORT_ORDER.indexOf(best) - w)) best = l;
  return best;
}

export const defaultEffortOf = (m: AgentModelOption | undefined) => nearestEffort(effortsOf(m), m?.defaultEffort);

/** 找客户端与模型 */
export function findModel(clients: readonly AgentClientOption[], clientId: string, modelId: string): { client?: AgentClientOption; model?: AgentModelOption } {
  const client = clients.find((c) => c.id === clientId);
  return { client, model: client?.models.find((m) => m.id === modelId) };
}

/**
 * 把一个选择规整成有效的: 客户端不存在用第一个可用的, 模型不存在用该客户端的第一个, 强度吸附到模型支持的档位.
 * 选了新模型时调用它, 强度会尽量保持原来的高低.
 */
export function resolveModelSelection(clients: readonly AgentClientOption[], sel: Partial<AgentModelSelection>): AgentModelSelection | null {
  const client = clients.find((c) => c.id === sel.client && !c.unavailable) ?? clients.find((c) => !c.unavailable && c.models.length);
  if (!client) return null;
  const model = client.models.find((m) => m.id === sel.model && !m.disabled) ?? client.models.find((m) => !m.disabled);
  if (!model) return null;
  const effort = sel.effort === undefined ? defaultEffortOf(model) : nearestEffort(effortsOf(model), sel.effort);
  return { client: client.id, model: model.id, ...(effort ? { effort } : null) };
}

/** 按名字 / id / 简介过滤 (不分大小写); 返回每个客户端过滤后的模型, 空的客户端去掉 */
export function searchModels(clients: readonly AgentClientOption[], query: string): { client: AgentClientOption; models: AgentModelOption[] }[] {
  const q = query.trim().toLowerCase();
  return clients
    .map((client) => ({
      client,
      models: client.models.filter((m) => !q || [m.id, m.name, m.description, client.name].some((s) => s?.toLowerCase().includes(q))),
    }))
    .filter((g) => g.models.length);
}

/**
 * 在模型支持的档位里升 / 降一档 (Codex TUI 的 Alt+, / Alt+. : 只走模型声明的档位, 当前值不在里面时先落到最近一档).
 * 已经在最低 / 最高时返回 undefined; levels 为空也是 undefined.
 */
export function stepEffort(levels: readonly ReasoningEffort[], value: ReasoningEffort | undefined, dir: 1 | -1): ReasoningEffort | undefined {
  const sorted = EFFORT_ORDER.filter((e) => levels.includes(e));
  if (!sorted.length) return undefined;
  const at = nearestEffort(sorted, value);
  const i = at ? sorted.indexOf(at) : 0;
  return sorted[i + dir];
}

/* ---------------- 渐变档位条 (EffortTrack) 的纯逻辑 ---------------- */

/** 档位越高: 饱和度 / 亮度 / 不透明度从低档的值升到最高档的值, 流光一趟的时长从慢到快 */
const TRACK_SATURATE: readonly [number, number] = [0.5, 1.3];
const TRACK_BRIGHTNESS: readonly [number, number] = [0.92, 1.12];
const TRACK_OPACITY: readonly [number, number] = [0.6, 1];
const TRACK_SHEEN_MS: readonly [number, number] = [3600, 1100];

const lerp = ([a, b]: readonly [number, number], t: number) => a + (b - a) * t;

export interface EffortIntensity {
  /** 0 (最低一档) .. 1 (最高一档) */
  t: number;
  saturate: number;
  brightness: number;
  opacity: number;
  /** 流光扫过一趟的时长 (ms), 越高越快 */
  sheenMs: number;
}

/** 第 index 档 (共 count 档) 的强度: "越高越亮、越鲜艳、越快". 只有一档时按最高算 */
export function effortIntensity(index: number, count: number): EffortIntensity {
  const t = count > 1 ? Math.max(0, Math.min(1, index / (count - 1))) : 1;
  const r = (n: number) => Math.round(n * 100) / 100;
  return { t: r(t), saturate: r(lerp(TRACK_SATURATE, t)), brightness: r(lerp(TRACK_BRIGHTNESS, t)), opacity: r(lerp(TRACK_OPACITY, t)), sheenMs: Math.round(lerp(TRACK_SHEEN_MS, t)) };
}

/**
 * 指针落在轨道上 x (相对轨道左边, px) 处吸附到第几档: 两端各留 inset (滑块半径), 档位均分剩下的宽度.
 * 越界夹到两端; count <= 1 时恒为 0.
 */
export function effortIndexAt(x: number, width: number, inset: number, count: number): number {
  if (count <= 1) return 0;
  const span = Math.max(1, width - inset * 2);
  return Math.max(0, Math.min(count - 1, Math.round(((x - inset) / span) * (count - 1))));
}

/** 指针位置对应的连续进度 0..1 (拖动时滑块跟手, 松开再吸附) */
export function effortFractionAt(x: number, width: number, inset: number): number {
  const span = Math.max(1, width - inset * 2);
  return Math.max(0, Math.min(1, (x - inset) / span));
}

/**
 * 滑块的键盘: ← ↓ PageDown 降一档, → ↑ PageUp 升一档, Home / End 到两端 (WAI-ARIA slider).
 * 返回新的档位; 不认识的键或已经到头返回 undefined.
 */
export function effortKey(levels: readonly ReasoningEffort[], value: ReasoningEffort | undefined, key: string): ReasoningEffort | undefined {
  const sorted = EFFORT_ORDER.filter((e) => levels.includes(e));
  if (!sorted.length) return undefined;
  const at = nearestEffort(sorted, value);
  let next: ReasoningEffort | undefined;
  if (key === "Home") next = sorted[0];
  else if (key === "End") next = sorted[sorted.length - 1];
  else if (key === "ArrowRight" || key === "ArrowUp" || key === "PageUp") next = stepEffort(sorted, at, 1);
  else if (key === "ArrowLeft" || key === "ArrowDown" || key === "PageDown") next = stepEffort(sorted, at, -1);
  return next && next !== value ? next : undefined;
}

/* ---------------- 档位样式 (触发器 / 档名 / 弹层共用, 组件是 effort-track.tsx 的 EffortBadge) ---------------- */

/**
 * 档位的视觉分级, 由低到高: off 淡 (无柱) → low 灰 → mid 正常前景 → high 品牌色 → max 渐变字 + 光晕.
 * 跟渐变条同一套 token 色阶; 黑白主题 (ink) 里品牌色就是前景色, 所以每级还靠 柱数 / 字重 / 亮度 区分, 不只靠色相.
 */
export type EffortTone = "off" | "low" | "mid" | "high" | "max";

/** 由低到高 */
export const EFFORT_TONE_ORDER: readonly EffortTone[] = ["off", "low", "mid", "high", "max"];

/** 档位小图标一共几根柱 (像信号格, 由低到高) */
export const EFFORT_GLYPH_BARS = 4;

export interface EffortLook {
  tone: EffortTone;
  /** 小图标填几根柱 (0..EFFORT_GLYPH_BARS) */
  bars: number;
  /** 档名字重 */
  weight: 400 | 500 | 600;
  /** 只有最高档带光晕 (呼吸只动 opacity, 减弱动效时静态) */
  glow: boolean;
}

const EFFORT_LOOK: Record<ReasoningEffort, EffortLook> = {
  off: { tone: "off", bars: 0, weight: 400, glow: false },
  minimal: { tone: "low", bars: 1, weight: 400, glow: false },
  low: { tone: "low", bars: 1, weight: 400, glow: false },
  medium: { tone: "mid", bars: 2, weight: 400, glow: false },
  high: { tone: "high", bars: 3, weight: 500, glow: false },
  xhigh: { tone: "max", bars: 4, weight: 600, glow: false },
  max: { tone: "max", bars: 4, weight: 600, glow: true },
};

/** 某一档的样式 (按档位本身定, 不随模型变: "高" 在哪个模型里都长一样) */
export const effortLook = (e: ReasoningEffort): EffortLook => EFFORT_LOOK[e];
