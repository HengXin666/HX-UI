import type { JSX } from "react";
import { useState } from "react";
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@hx/ui";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";

/** Tabs 页。 */
export function TabsPage(): JSX.Element {
  const [view, setView] = useState("overview");

  return (
    <>
      <P>
        radix 的 Tabs 只给了<b className="text-foreground">行为</b> —— roving focus、方向键切换、
        触发器与面板的 aria 关联。样式全归使用方, 这里给两种形态。
      </P>

      <H2>underline: 同一个对象的几个视图</H2>
      <P>
        概览 / 日志 / 配置 这类切换用下划线。它是最轻的指示, 不额外占一层底色。
      </P>
      <Preview
        align="start"
        code={`const [view, setView] = useState("overview");

<Tabs value={view} onValueChange={setView}>
  <TabsList>
    <TabsTrigger value="overview">概览</TabsTrigger>
    <TabsTrigger value="runs">运行记录</TabsTrigger>
    <TabsTrigger value="config">配置</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
</Tabs>`}
      >
        <Tabs value={view} onValueChange={setView} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="runs">运行记录</TabsTrigger>
            <TabsTrigger value="config">配置</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-3 text-[12.5px] text-muted-foreground">
            当前在「概览」。方向键可以直接切换左右标签。
          </TabsContent>
          <TabsContent value="runs" className="pt-3 text-[12.5px] text-muted-foreground">
            当前在「运行记录」。
          </TabsContent>
          <TabsContent value="config" className="pt-3 text-[12.5px] text-muted-foreground">
            当前在「配置」。
          </TabsContent>
        </Tabs>
      </Preview>

      <H2>pill: 装在工具条上</H2>
      <Preview
        align="start"
        code={`<Tabs defaultValue="a">
  <TabsList variant="pill">
    <TabsTrigger value="a">全部 <Badge variant="secondary">128</Badge></TabsTrigger>
    <TabsTrigger value="b">存活</TabsTrigger>
    <TabsTrigger value="c">已死</TabsTrigger>
  </TabsList>
</Tabs>`}
      >
        <Tabs defaultValue="a">
          <TabsList variant="pill">
            <TabsTrigger value="a">
              全部
              <Badge variant="secondary">128</Badge>
            </TabsTrigger>
            <TabsTrigger value="b">存活</TabsTrigger>
            <TabsTrigger value="c">已死</TabsTrigger>
          </TabsList>
        </Tabs>
      </Preview>

      <H2>禁用某一项</H2>
      <Preview
        align="start"
        code={`<Tabs defaultValue="1">
  <TabsList>
    <TabsTrigger value="1">可点</TabsTrigger>
    <TabsTrigger value="2" disabled>没权限</TabsTrigger>
  </TabsList>
</Tabs>`}
      >
        <Tabs defaultValue="1">
          <TabsList>
            <TabsTrigger value="1">可点</TabsTrigger>
            <TabsTrigger value="2" disabled>没权限</TabsTrigger>
          </TabsList>
        </Tabs>
      </Preview>

      <Callout title="别把它和 SegmentedControl 用混">
        两者长得像, 职责不同: <b className="text-foreground">SegmentedControl</b> 只切视图、
        不负责面板内容, 用在工具栏那种"改一个筛选条件"的地方;
        <b className="text-foreground">Tabs</b> 会把触发器与 TabsContent 做 aria 关联
        (tab → tabpanel), 是"同一对象的多个视图", 读屏软件能正确播报。用错的那一个
        在无障碍上是沉默的 —— 看起来一样, 用起来不一样。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "Tabs.value / defaultValue", type: "string", desc: "受控 / 非受控的当前项。" },
          { name: "Tabs.onValueChange", type: "(v: string) => void", desc: "切换时回调。" },
          { name: "TabsList.variant", type: '"underline" | "pill"', default: '"underline"', desc: "由 List 下发给 trigger, 不必两处都写。" },
          { name: "TabsTrigger.value", type: "string", desc: "对应 TabsContent 的 value。" },
          { name: "TabsTrigger.disabled", type: "boolean", default: "false", desc: "禁用。" },
          { name: "TabsContent.value", type: "string", desc: "与触发器配对。" },
        ]}
      />
    </>
  );
}
