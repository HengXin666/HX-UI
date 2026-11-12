import type { ReactNode } from "react";
import { GlintButton } from "../../../../../../src/controls";
import glintRaw from "../../../../../../src/controls/press/signal/GlintButton.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage, omit } from "../shared";

/**
 * controls 批 1: 边缘高光按钮. 演示放在一块带斜纹的面板上, 底层模糊 (blur) 才看得出来;
 * 调参只开会改变画面的属性, 自转速度 speed 只在 autoAnimate 下起作用, 留在 Props 表.
 */

const LABEL = "部署到生产环境";
const LINES = ["foreground", "primary", "ring", "muted-foreground"];

const CONTROLS: readonly ControlDef[] = [
  text("label", "按钮文字", LABEL, "不是属性: 演示里传给 children 的文字."),
  select("size", "尺寸", ["sm", "md", "lg"], "md", '"sm" | "md" | "lg"', "高度 28 / 32 / 44 px, 内边距与字号同档."),
  range("radius", "圆角", [0, 22, 1], 8, "圆角 px, 外壳, 内层与高光环同一个值."),
  color("line", "高光色", LINES, "foreground", "string", "高光与内侧反光的颜色, 只收语义 token 名."),
  range("idleIntensity", "远处亮度", [0, 1, 0.05], 0.35, "指针在 proximity 之外时高光的亮度."),
  range("intensity", "贴近亮度", [0, 1, 0.05], 1, "指针贴到按钮边上时的亮度, 0 到 1; 中间按距离插值."),
  range("shineSize", "高光长度", [2, 40, 1], 10, "高光实心段沿边的 px 长."),
  range("glow", "外晕", [0, 2, 0.1], 1, "外晕强度, 0 关闭 (不渲染那一层)."),
  range("blur", "底层模糊", [0, 12, 1], 0, "按钮底下的背景模糊 px; 0 不出模糊层."),
  toggle("autoAnimate", "自转", false, "高光沿边自转; 指针进入 proximity 后改为朝向指针."),
  toggle("loading", "加载中", false, "标签隐去但仍占宽, 中间转一个 12px 圆点; 期间不响应点击."),
  toggle("disabled", "禁用", false, "半透明, 不响应指针, 高光停在远处亮度."),
];
const BASE = initialValues(CONTROLS);

/** 斜纹底: 只用边框令牌画, 让 blur 与半透明底色有东西可透. */
function Panel({ children }: { readonly children: ReactNode }) {
  return (
    <div
      className="grid h-40 w-[min(20rem,calc(100vw-6rem))] place-items-center rounded-2xl border border-border"
      style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--border) 0 1px, transparent 1px 12px)" }}
    >
      {children}
    </div>
  );
}

function usage(values: Values): string {
  return controlUsage("GlintButton", omit(values, ["label"]), omit(BASE, ["label"]), String(values.label));
}

export const GLINT_BUTTON: PageSpec = {
  id: "glint-button",
  kind: "control",
  importName: "GlintButton",
  source: "src/controls/press/signal/GlintButton.tsx",
  raw: glintRaw,
  deps: [],
  controls: CONTROLS,
  height: 300,
  render: ({ label, ...props }) => (
    <Panel>
      <GlintButton {...props}>{String(label ?? LABEL)}</GlintButton>
    </Panel>
  ),
  usage,
  propDesc: {
    children: "按钮文字, 默认 Get Started.",
    speed: "自转速度, 圈每秒; 只在 autoAnimate 时起作用.",
    followMouse: "高光朝向指针并随距离提亮; 关掉后只停在远处亮度.",
    proximity: "指针离按钮外沿多少 px 开始提亮.",
    tintOpacity: "底色薄层 (bg-foreground) 的不透明度.",
    shineFade: "高光两侧淡出的 px 长.",
    onClick: "点击回调; loading 期间不触发.",
  },
  propsNote: "根元素是 <button type=\"button\">; className 与 style 落在它上面, 焦点环也在这一层, 按下的缩放只作用在内层.",
  examples: [
    {
      id: "primary",
      title: "主色高光与自转",
      desc: "line 换成 primary, 打开 autoAnimate 当首屏行动按钮; 指针靠近时停止自转, 改为朝向指针.",
      code: `<GlintButton size="lg" line="primary" autoAnimate radius={12}>\n  免费试用 14 天\n</GlintButton>`,
      render: () => (
        <GlintButton size="lg" line="primary" autoAnimate radius={12}>
          免费试用 14 天
        </GlintButton>
      ),
    },
    {
      id: "states",
      title: "加载与禁用",
      desc: "loading 保留宽度, 文字换成转圈; disabled 降到 0.45 不透明度.",
      code: `<GlintButton loading>保存设置</GlintButton>\n<GlintButton disabled>保存设置</GlintButton>`,
      render: () => (
        <>
          <GlintButton loading>保存设置</GlintButton>
          <GlintButton disabled>保存设置</GlintButton>
        </>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦按钮, 外壳出 1px 焦点环 (偏移 2px), 环不随按压缩放." },
    { keys: ["Enter"], action: "触发点击, 高光闪一下; 按住不放时按钮保持按下的缩放." },
    { keys: ["Space"], action: "同 Enter. loading 时 aria-busy, 点击不触发." },
  ],
  reduced: {
    desc: "高光不再追指针也不自转, 静止在左上; 两边都把指针移上去比较.",
    notes: [
      "高光停在左上方 (固定角度), 不跟随指针, autoAnimate 也不转.",
      "悬停时亮度直接落到 intensity, 移开回到 idleIntensity, 中间没有过渡.",
      "加载圆点不转, 禁用时的透明度切换去掉过渡.",
    ],
  },
};
