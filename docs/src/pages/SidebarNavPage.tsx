import { useState, type JSX } from "react";
import { SidebarNavItemButton, type SidebarNavItem } from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout } from "../components/DocKit";

const BASE: SidebarNavItem[] = [
  { id: "new", label: "新会话", icon: "icon-[solar--chat-round-line-linear]" },
  { id: "agents", label: "智能体", icon: "icon-[solar--user-circle-linear]", badge: { text: "3" } },
  { id: "abilities", label: "能力", icon: "icon-[solar--widget-2-linear]" },
  { id: "design", label: "设计", icon: "icon-[solar--layers-linear]", badge: { text: "BETA", variant: "text" } },
  { id: "settings", label: "设置", icon: "icon-[solar--settings-linear]" },
];

export function SidebarNavPage(): JSX.Element {
  const [active, setActive] = useState("agents");

  return (
    <>
      <P>
        侧栏导航项。源码取自上游 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">SidebarNavItemButton</code>,
        类串一字未改。图标走 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">mask-image</code>,
        因此跟随 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">currentColor</code> —— 选中态改个文字色就整体变色, 不用换图。
      </P>
      <Callout title="选中态分两处表达">
        按钮内部只改<b className="text-foreground">字重与文字色</b>(<code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">font-semibold</code>),
        高亮背景由外层容器给出。这样高亮块做滑动动画时, 按钮本身不必重绘, 指示器才能只动 transform。
      </Callout>

      <H2>基础用法</H2>
      <Preview
        align="start"
        code={`const item = { id: "agents", label: "智能体", icon: "icon-[solar--user-circle-linear]", active: false };

<SidebarNavItemButton item={item} onClick={() => setActive(item.id)} />

{/* 选中时: 按钮加字重, 外层给高亮底 */}
<SidebarNavItemButton
  item={{ ...item, active: true }}
  className="bg-primary/10 ring-1 ring-inset ring-primary/25"
/>`}
      >
        <div className="flex w-52 flex-col gap-px">
          {BASE.map((it) => {
            const on = it.id === active;
            return (
              <SidebarNavItemButton
                key={it.id}
                item={{ ...it, active: on }}
                onClick={() => setActive(it.id)}
                className={on ? "bg-primary/10 ring-1 ring-inset ring-primary/25" : undefined}
              />
            );
          })}
        </div>
      </Preview>

      <H2>角标</H2>
      <P>两种形态: <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">count</code> 是数字胶囊, <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">text</code> 是窄长条文本角标。</P>
      <Preview
        align="start"
        code={`{ id: "agents", label: "智能体", icon: "...", badge: { text: "3" } }
{ id: "design", label: "设计", icon: "...", badge: { text: "BETA", variant: "text" } }`}
      >
        <div className="flex w-52 flex-col gap-px">
          {[
            { id: "a", label: "智能体", icon: "icon-[solar--user-circle-linear]", badge: { text: "3" } },
            { id: "b", label: "设计", icon: "icon-[solar--layers-linear]", badge: { text: "BETA", variant: "text" as const } },
            { id: "c", label: "消息", icon: "icon-[solar--bell-linear]", badge: { text: "99+" } },
          ].map((it) => <SidebarNavItemButton key={it.id} item={it as SidebarNavItem} />)}
        </div>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "item.id", type: "string", default: "-", desc: "导航项标识。" },
          { name: "item.label", type: "string", desc: "显示文本, 过长时省略号截断。" },
          { name: "item.icon", type: "string", desc: "Iconify 类名, 例如 icon-[solar--settings-linear]。" },
          { name: "item.iconUrl", type: "string", desc: "全彩图片图标, 优先级高于 icon 且不会被染色。" },
          { name: "item.active", type: "boolean", desc: "选中态。只改字重与文字色, 背景要由外层给。" },
          { name: "item.badge", type: "{ text: string; variant?: \"count\" | \"text\" }", desc: "右侧角标。" },
        ]}
      />
    </>
  );
}
