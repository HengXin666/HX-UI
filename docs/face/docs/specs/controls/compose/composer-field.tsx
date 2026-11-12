import { useEffect, useState } from "react";
import { ComposerField, type ComposerSource } from "../../../../../../src/controls";
import composerRaw from "../../../../../../src/controls/compose/input/ComposerField.tsx?raw";
import { initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlDemo, omit } from "../shared";
import { tag } from "../../usage-code";

/**
 * controls 批 2: 对话输入条. 演示是给代码助手提问: 文本域按内容长高 (到 maxRows 后滚动), 左下选来源, 右下发送;
 * 发送后演示进入 2.4 秒 "生成中", 发送键变停止键, 再点停止提前结束. 底边那道光随打字能量流动, 发送时闪一下.
 */

const SOURCES: readonly ComposerSource[] = [
  { id: "repo", label: "代码库" },
  { id: "docs", label: "文档站" },
  { id: "web", label: "网页" },
];
const DRAFT = "把 ReelPicker 的惯性滑行改成按速度衰减,\n并保留吸附到整格的行为;\n顺手补上键盘 PageUp / PageDown,\n最后跑一遍 docs-typecheck.";

const CONTROLS: readonly ControlDef[] = [
  text("placeholder", "占位文字", "问问代码库", "空值时的提示, 淡入淡出."),
  toggle("draft", "预填草稿", true, "不是属性: 演示里的 defaultValue, 打开时预填四行草稿, 方便看自动长高."),
  range("maxRows", "最多行数", [1, 8, 1], 8, "自动长高的上限行数, 超出后文本域内部滚动."),
  select("defaultSource", "默认来源", ["repo", "docs", "web"], "repo", "string", "非受控的初始来源 id; 不给时取 sources 第一项."),
  toggle("busy", "生成中", false, "发送键变成停止键 (方块), 点它调用 onStop."),
  range("morphDuration", "变形时长", [0, 800, 20], 200, "发送箭头与停止方块交叉淡变的 ms."),
  toggle("listening", "收音条", false, "发送键左边显示三根跳动的均衡条."),
  toggle("ambient", "底边流光", true, "底边那道随打字加速, 发送时闪一下的光."),
  toggle("disabled", "禁用", false, "变淡, 不能输入也不能发送."),
];
const BASE = initialValues(CONTROLS);
/** 底边流光画布是绝对定位的 canvas, 左右定位撑不开替换元素的宽度; 演示从外层给它补上宽度 (容器宽减左右各 16px). */
const GLOW_WIDTH = "[&_[data-slot=composer-glow]]:w-[calc(100%-2rem)]";

function ComposerDemo({ draft, busy, ...props }: Record<string, unknown>) {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState("Enter 发送, Shift+Enter 换行");
  useEffect(() => {
    if (!running) return undefined;
    const id = window.setTimeout(() => setRunning(false), 2400);
    return () => window.clearTimeout(id);
  }, [running]);
  return (
    <div className="flex w-[min(32rem,calc(100vw-6rem))] flex-col gap-3 text-left">
      <ComposerField
        {...props}
        className={GLOW_WIDTH}
        defaultValue={draft ? DRAFT : ""}
        sources={SOURCES}
        busy={Boolean(busy) || running}
        ariaLabel="给代码助手的消息"
        onSubmit={(value, source) => {
          setLog(`onSubmit: ${value.split("\n")[0]}… (${source})`);
          setRunning(true);
        }}
        onStop={() => {
          setRunning(false);
          setLog("onStop: 已停止生成");
        }}
      />
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

const usage = (values: Values): string => {
  const props = { ...omit(values, ["draft"]), ariaLabel: "给代码助手的消息" };
  const base = { ...omit(BASE, ["draft"]), placeholder: "Ask anything", defaultSource: "repo", ariaLabel: "" };
  const body = tag("ComposerField", props, base).replace(" />", " sources={SOURCES} onSubmit={send} />");
  const head = `\n\nconst SOURCES = [\n  { id: "repo", label: "代码库" },\n  { id: "docs", label: "文档站" },\n  { id: "web", label: "网页" },\n];\nconst send = (text: string, source?: string) => console.log(source, text);`;
  return controlDemo(["ComposerField"], body, head);
};

export const COMPOSER_FIELD: PageSpec = {
  id: "composer-field",
  kind: "control",
  importName: "ComposerField",
  source: "src/controls/compose/input/ComposerField.tsx",
  raw: composerRaw,
  deps: [],
  controls: CONTROLS,
  height: 360,
  render: (props) => <ComposerDemo {...props} />,
  usage,
  propDesc: {
    value: "受控文本.",
    defaultValue: "非受控的初始文本.",
    onValueChange: "每次输入调用.",
    onSubmit: "Enter 提交时调用, 参数是去掉首尾空白的文本与当前来源 id; 空文本不提交.",
    onStop: "生成中点停止键时调用.",
    sources: "来源列表 ({ id, label, icon? }); 空数组时不画来源选择.",
    source: "受控的来源 id.",
    onSourceChange: "选了别的来源时调用.",
    ariaLabel: "文本域的读屏名称, 默认 Message.",
    sendLabel: "发送键的读屏名称, 默认 Send.",
    stopLabel: "停止键的读屏名称, 默认 Stop.",
    className: "根元素类名.",
  },
  propsNote: "根元素 data-busy 标出生成中; 来源选择是 button + role=\"listbox\", 高亮块滑到当前项; 底边流光是 aria-hidden 的 canvas.",
  examples: [
    {
      id: "bare",
      title: "不带来源的极简输入条",
      desc: "sources 不给时左下空着, 只剩发送键; ambient={false} 关掉底边流光.",
      code: `<ComposerField placeholder="回复这条评论" maxRows={3} ambient={false} />`,
      render: () => (
        <div className="w-full max-w-[420px]">
          <ComposerField placeholder="回复这条评论" maxRows={3} ambient={false} ariaLabel="回复评论" />
        </div>
      ),
    },
    {
      id: "voice",
      title: "收音中",
      desc: "listening 时发送键左边三根均衡条依次跳动, 适合与 DictateButton 搭配.",
      code: `<ComposerField listening defaultValue="帮我把这段会议纪要整理成三条待办" />`,
      render: () => (
        <div className="w-full max-w-[420px]">
          <ComposerField listening defaultValue="帮我把这段会议纪要整理成三条待办" ariaLabel="语音转写" />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Enter"], action: "发送 (输入法组字中不发送); 生成中时等于点停止." },
    { keys: ["Shift", "Enter"], action: "换行, 文本域随之长高." },
    { keys: ["Tab"], action: "文本域 → 来源按钮 → 发送键." },
    { keys: ["↑", "↓"], action: "来源列表打开时移动高亮; Enter / Space 选中, Esc 收起." },
  ],
  reduced: {
    desc: "减少动效下长高, 换来源与发送 / 停止照常, 只是不做过渡; 底边流光与均衡条停住.",
    notes: ["文本域长高与来源高亮块直接到位, 没有滑动.", "发送箭头与停止方块直接切换, 不交叉淡变; 出场不弹.", "底边流光不画; 收音条停在一个固定高度, 不跳."],
    height: 260,
  },
};
