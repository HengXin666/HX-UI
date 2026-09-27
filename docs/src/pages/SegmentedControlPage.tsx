import { useState, type JSX } from "react";
import { Card, SegmentedControl, type SegmentedControlItem } from "@hx/ui";
import { Callout, H2, H3, P, Preview, PropsTable } from "../components/DocKit";

/**
 * SegmentedControl 页。
 *
 * 容器是 self-drawn: 没有 radix, 也没有 <input type=radio>。
 * 它靠 motion 的 layoutId 把指示器在按钮之间"搬"过去, 所以**同一页里每个实例的
 * layoutId 必须唯一** —— 源码用 useId() 做到这点, 这也是为什么不要手写 layoutId。
 */

type View = "grid" | "list" | "timeline";
type Panel = "chat" | "files" | "tasks";

const VIEWS: SegmentedControlItem<View>[] = [
  { key: "grid", label: "网格", icon: "icon-[solar--widget-2-linear]" },
  { key: "list", label: "列表", icon: "icon-[solar--list-check-linear]" },
  { key: "timeline", label: "时间线", icon: "icon-[solar--clock-circle-linear]" },
];

const PANELS: SegmentedControlItem<Panel>[] = [
  { key: "chat", label: "对话" },
  { key: "files", label: "文件", badge: 12 },
  { key: "tasks", label: "任务", badge: 3 },
];

export function SegmentedControlPage(): JSX.Element {
  const [view, setView] = useState<View>("grid");
  const [panel, setPanel] = useState<Panel>("chat");

  return (
    <>
      <P>
        分段控件的容器底是 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-black/[0.06]</code>
        (暗色下 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-white/[0.08]</code>),
        内边距 2px, 所以指示器与容器之间天然留出一条 1px 旁的缝, 不用额外画边。
        这是<b className="text-foreground">唯一一个允许出现阴影的基础件</b> —— 指示器的 1px 影子是它表达"浮在底上"的方式。
      </P>

      <H2>基础</H2>
      <P>
        它是受控组件: <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">value</code> 与
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> onChange</code> 都必填, 没有 defaultValue。
        视觉上只有两个状态 (选中 / 未选中), 但布局上它永远 inline-flex, 不会自己撑满一行。
      </P>
      <Preview
        align="start"
        code={`const [view, setView] = useState("grid");

const items = [
  { key: "grid", label: "网格", icon: "icon-[solar--widget-2-linear]" },
  { key: "list", label: "列表", icon: "icon-[solar--list-check-linear]" },
  { key: "timeline", label: "时间线", icon: "icon-[solar--clock-circle-linear]" },
];

<SegmentedControl items={items} value={view} onChange={setView} />`}
      >
        <SegmentedControl items={VIEWS} value={view} onChange={setView} />
        <span className="self-center text-[12px] text-muted-foreground">当前: {view}</span>
      </Preview>

      <H2>角标</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">badge</code> 是未读数, 大于 99 显示 99+,
        为 0 或 undefined 时不渲染。它只用红色实底 —— 用的是 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-red-500</code>,
        因为红点是通用约定, 不走 token 反而更稳。文字角标请改用 Badge 组件。
      </P>
      <Preview
        align="start"
        code={`const items = [
  { key: "chat", label: "对话" },
  { key: "files", label: "文件", badge: 12 },
  { key: "tasks", label: "任务", badge: 3 },
  { key: "archive", label: "归档", badge: 128 },   // 显示 99+
];

<SegmentedControl items={items} value={panel} onChange={setPanel} />`}
      >
        <SegmentedControl items={PANELS} value={panel} onChange={setPanel} />
        <SegmentedControl
          items={[
            { key: "a", label: "归档", badge: 128 },
            { key: "b", label: "已读" },
          ]}
          value="a"
          onChange={() => undefined}
        />
      </Preview>

      <H2>放进界面</H2>
      <P>典型位置是卡片头部左侧, 或者设置项右侧 (SettingRow 的 children 槽)。</P>
      <Preview
        align="stretch"
        code={`const [view, setView] = useState("grid");
const items = [{ key: "grid", label: "网格" }, { key: "list", label: "列表" }];

<Card variant="solid" className="w-80">
  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
    <span className="text-[13px] font-medium">视图</span>
    <SegmentedControl items={items} value={view} onChange={setView} />
  </div>
</Card>`}
      >
        <Card variant="solid" className="flex w-80 items-center justify-between gap-3 px-3.5 py-2.5">
          <span className="text-[13px] font-medium">视图</span>
          <SegmentedControl
            items={[
              { key: "grid", label: "网格" },
              { key: "list", label: "列表" },
            ]}
            value={view}
            onChange={setView}
          />
        </Card>
      </Preview>

      <Callout kind="warning" title="suppressLayoutAnimation 只给容器尺寸正在变的场景">
        面板从窄变宽、侧栏展开收起时, 外层尺寸一帧一变, 指示器的 spring 动画会追着这些中间值跑, 看起来是抖。
        这时传 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">suppressLayoutAnimation</code> 把过渡时长置 0,
        等尺寸稳定了再关掉。平时不要开 —— 指示器的高光全在滑动那一下。
      </Callout>

      <H2>属性</H2>
      <H3>SegmentedControl</H3>
      <PropsTable
        rows={[
          { name: "items", type: "SegmentedControlItem<T>[]", desc: "分段项。key 的类型就是 value 的类型。" },
          { name: "value", type: "T", desc: "当前选中项。受控, 没有 defaultValue。" },
          { name: "onChange", type: "(value: T) => void", desc: "点击切换时回调。" },
          { name: "className", type: "string", desc: "外层容器类串。宽度与对齐给这里。" },
          { name: "suppressLayoutAnimation", type: "boolean", default: "false", desc: "容器尺寸在变时禁用指示器动画, 避免抖动。" },
        ]}
      />
      <H3>SegmentedControlItem</H3>
      <PropsTable
        rows={[
          { name: "key", type: "T extends string", desc: "选项标识, 与 value 同域。" },
          { name: "label", type: "string", desc: "文案, 11px 中字重。" },
          { name: "icon", type: "string", desc: "Iconify 类名, 固定 12×12 并跟随文字色。" },
          { name: "badge", type: "number", desc: "未读数, 大于 99 显示 99+, 0 不渲染。" },
        ]}
      />
    </>
  );
}
