/**
 * 营销区块 E (开发者): CodeShowcase / InstallBlock 的取值, 类名, slot, 默认 aria 文案与复制降级.
 * 区块组件内不写颜色/字号/间距字面量, 全部从这里取; 类名写全字面量, Tailwind 才扫得到.
 */

/** CodeShowcase 布局: 纯代码 / 代码 + 预览并排 (容器宽度不足时预览落到代码下方). */
export const CODE_SHOWCASE_LAYOUT = { code: "code", split: "split" } as const;

/** InstallBlock 外观: 胶囊 (单行, 适合嵌进 Hero) / 卡片 (多行 + 标签头). */
export const INSTALL_VARIANT = { pill: "pill", card: "card" } as const;

/** 常见包管理器名 (manager 也接受任意字符串). */
export const INSTALL_MANAGER = { npm: "npm", pnpm: "pnpm", yarn: "yarn", bun: "bun", curl: "curl" } as const;

/** 默认值. */
export const MARKETING_V106_DEFAULT = {
  codeLanguage: "tsx",
  shellLanguage: "bash",
  prompt: "$",
  previewAddress: "localhost:3000",
  installVariant: "card",
  lineNumbers: true,
} as const;

/** 复制成功 / 失败反馈的保持时长 (design 4.2: 复制后 1.5s 反馈). */
export const COPY_FEEDBACK_MS = 1500;

/** 复制状态 (写在按钮的 data-state 上). */
export const COPY_STATE = { idle: "idle", copied: "copied", failed: "failed" } as const;
export type CopyState = (typeof COPY_STATE)[keyof typeof COPY_STATE];

/** 多行命令的换行符. */
export const LINE_BREAK = "\n";

/** 标签值前缀 (用户未给 value 时以下标生成). */
export const TAB_VALUE_PREFIX = { lang: "lang-", sample: "sample-", manager: "pm-", platform: "os-" } as const;

/** 区块内部部件的 classNames slot 元组 (root 归 BlockShell; 公开 API, 改名为破坏性变更). */
export const CODE_SHOWCASE_SLOTS = ["tabs", "tab-list", "sub-tab-list", "pane", "code", "code-header", "preview", "actions"] as const;
export const INSTALL_BLOCK_SLOTS = ["tabs", "tab-list", "command", "line", "prompt", "copy", "alternatives"] as const;

/** data-slot 取值: root 即组件名, 子部件为 <组件>-<slot>. */
export const CODE_SHOWCASE_SLOT = {
  root: "code-showcase",
  tabs: "code-showcase-tabs",
  tabList: "code-showcase-tab-list",
  tabIcon: "code-showcase-tab-icon",
  subTabs: "code-showcase-sub-tabs",
  subTabList: "code-showcase-sub-tab-list",
  pane: "code-showcase-pane",
  code: "code-showcase-code",
  codeHeader: "code-showcase-code-header",
  filename: "code-showcase-filename",
  preview: "code-showcase-preview",
  actions: "code-showcase-actions",
  copy: "code-showcase-copy",
  status: "code-showcase-status",
} as const;

export const INSTALL_BLOCK_SLOT = {
  root: "install-block",
  tabs: "install-block-tabs",
  tabList: "install-block-tab-list",
  tabIcon: "install-block-tab-icon",
  command: "install-block-command",
  lines: "install-block-lines",
  line: "install-block-line",
  prompt: "install-block-prompt",
  text: "install-block-text",
  note: "install-block-note",
  copy: "install-block-copy",
  status: "install-block-status",
  alternatives: "install-block-alternatives",
  alternativesTitle: "install-block-alternatives-title",
  alternative: "install-block-alternative",
  actions: "install-block-actions",
} as const;

/** 两个区块共用的类名组合 (只引用语义 token 与标准档). */
export const DEV_BLOCK_CLASS = {
  /** 标签条外包一层横向滚动, 13 种语言也不撑破布局. */
  tabScroller: "max-w-full min-w-0 overflow-x-auto overscroll-x-contain",
  tabIcon: "inline-flex",
  copyButton: "shrink-0",
  copyIcon: "size-3.5",
  copyIconOk: "size-3.5 text-success",
  copyIconFail: "size-3.5 text-danger",
  srOnly: "sr-only",
  actions: "mt-6",
} as const;

export const CODE_SHOWCASE_CLASS = {
  root: "flex min-w-0 flex-col gap-4",
  subTabs: "flex min-w-0 flex-col gap-3",
  pane: "grid min-w-0 grid-cols-1 gap-4",
  paneSplit: "grid min-w-0 grid-cols-1 items-start gap-4 @3xl:grid-cols-2",
  code: "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
  codeHeader: "flex min-w-0 items-center gap-2 border-b border-border px-3 py-1.5",
  filename: "min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground",
  /** 压平 CodeBlock 自带外框, 强制不折行 (长行横向滚动). */
  codeBlock: "rounded-none border-0 [&_pre]:whitespace-pre [&_code]:whitespace-pre",
  preview: "min-w-0",
  previewBody: "min-h-full overflow-auto p-4",
} as const;

export const INSTALL_BLOCK_CLASS = {
  root: "flex min-w-0 flex-col gap-3",
  rootEmbedded: "inline-flex max-w-full min-w-0 flex-col gap-2",
  tabs: "flex min-w-0 flex-col gap-2",
  cardCommand: "flex min-w-0 items-start gap-2 rounded-xl border border-border bg-card p-3",
  pillCommand: "inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-border bg-muted ps-4 pe-1 py-1",
  lines: "min-w-0 flex-1 overflow-x-auto font-mono text-sm",
  line: "flex whitespace-pre",
  prompt: "me-2 select-none text-muted-foreground",
  text: "text-foreground",
  note: "text-sm text-muted-foreground",
  alternatives: "flex min-w-0 flex-col gap-2 pt-2",
  alternativesTitle: "text-sm font-medium text-muted-foreground",
  alternative: "flex min-w-0 flex-col gap-1",
  alternativeLink: "text-sm text-link underline-offset-4 hover:underline",
} as const;

/** 本组区块额外的 aria 兜底文案 (BlockLabels 之外), 可经 labels prop 覆盖. */
export const DEV_LABELS_ZH = {
  languages: "代码语言",
  samples: "示例",
  preview: "运行结果预览",
  copyCode: "复制代码",
  copyCommand: "复制命令",
  copyFailed: "复制失败, 请手动选择文本",
  managers: "包管理器",
  platforms: "操作系统",
  actions: "代码相关操作",
} as const;

export const DEV_LABELS_EN = {
  languages: "Languages",
  samples: "Examples",
  preview: "Result preview",
  copyCode: "Copy code",
  copyCommand: "Copy command",
  copyFailed: "Copy failed, select the text manually",
  managers: "Package managers",
  platforms: "Operating systems",
  actions: "Code actions",
} as const satisfies Record<keyof typeof DEV_LABELS_ZH, string>;

export type DevLabels = { [K in keyof typeof DEV_LABELS_ZH]: string };

/** 按语言子标签取文案包, 未命中回到 zh (与 BLOCK_LABEL_FALLBACK 一致). */
export function devLabelsFor(locale: string | undefined): DevLabels {
  return (locale ?? "").toLowerCase().startsWith("en") ? DEV_LABELS_EN : DEV_LABELS_ZH;
}

/** 降级复制用的隐藏 textarea 内联样式 (不进可视区, 不抢指针). */
const OFFSCREEN_STYLE = { position: "fixed", top: "0", left: "0", opacity: "0", pointerEvents: "none" } as const;

/** 非安全上下文 (HTTP) 或 Clipboard API 被拒时: 临时 textarea + execCommand("copy"), 并归还焦点与选区. */
function legacyCopy(text: string): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement as HTMLElement | null;
  const selection = document.getSelection();
  const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  Object.assign(area.style, OFFSCREEN_STYLE);
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  if (range && selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
  active?.focus?.();
  return ok;
}

/**
 * 写剪贴板: 安全上下文优先 navigator.clipboard, 不可用或被拒时降级 legacyCopy.
 * 返回是否成功, 供按钮切换 data-state 与 aria-live 播报.
 */
export async function copyText(text: string): Promise<boolean> {
  const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
  const secure = typeof window !== "undefined" && window.isSecureContext;
  if (clipboard?.writeText && secure) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      return legacyCopy(text);
    }
  }
  return legacyCopy(text);
}
