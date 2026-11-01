import type { JSX } from "react";
import { useState } from "react";
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@hx/ui";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";
import { API_DEFAULT_FALSE, API_TYPE_BOOLEAN, API_TYPE_STRING, DEMO_ALIGN, DEMO_CLASS, DEMO_TAB_KEY, DEMO_TAB_VIEW, DEMO_VARIANT } from "../../../src/constants/docs-legacy";

/** Tabs 页。 */
export function TabsPage(): JSX.Element {
  const [view, setView] = useState<string>(DEMO_TAB_VIEW.overview);

  return (
    <>
      <P>
        radix 的 Tabs 只给了<b className={DEMO_CLASS.foreground}>行为</b>  roving focus、方向键切换、
        触发器与面板的 aria 关联。样式全归使用方, 这里给两种形态。
      </P>

      <H2>underline: 同一个对象的几个视图</H2>
      <P>
        概览 / 日志 / 配置 这类切换用下划线。它是最轻的指示, 不额外占一层底色。
      </P>
      <Preview
        align={DEMO_ALIGN.start}
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
        <Tabs value={view} onValueChange={setView} className={DEMO_CLASS.fullWidth}>
          <TabsList>
            <TabsTrigger value={DEMO_TAB_VIEW.overview}>概览</TabsTrigger>
            <TabsTrigger value={DEMO_TAB_VIEW.runs}>运行记录</TabsTrigger>
            <TabsTrigger value={DEMO_TAB_VIEW.config}>配置</TabsTrigger>
          </TabsList>
          <TabsContent value={DEMO_TAB_VIEW.overview} className={DEMO_CLASS.tabPanel}>
            当前在「概览」。方向键可以直接切换左右标签。
          </TabsContent>
          <TabsContent value={DEMO_TAB_VIEW.runs} className={DEMO_CLASS.tabPanel}>
            当前在「运行记录」。
          </TabsContent>
          <TabsContent value={DEMO_TAB_VIEW.config} className={DEMO_CLASS.tabPanel}>
            当前在「配置」。
          </TabsContent>
        </Tabs>
      </Preview>

      <H2>pill: 装在工具条上</H2>
      <Preview
        align={DEMO_ALIGN.start}
        code={`<Tabs defaultValue="a">
  <TabsList variant="pill">
    <TabsTrigger value="a">全部 <Badge variant="secondary">128</Badge></TabsTrigger>
    <TabsTrigger value="b">存活</TabsTrigger>
    <TabsTrigger value="c">已死</TabsTrigger>
  </TabsList>
</Tabs>`}
      >
        <Tabs defaultValue={DEMO_TAB_KEY.a}>
          <TabsList variant={DEMO_VARIANT.pill}>
            <TabsTrigger value={DEMO_TAB_KEY.a}>
              全部
              <Badge variant={DEMO_VARIANT.secondary}>128</Badge>
            </TabsTrigger>
            <TabsTrigger value={DEMO_TAB_KEY.b}>存活</TabsTrigger>
            <TabsTrigger value={DEMO_TAB_KEY.c}>已死</TabsTrigger>
          </TabsList>
        </Tabs>
      </Preview>

      <H2>可选: 滑动指示器</H2>
      <P>
        在 TabsList 上传 animated, 选中指示就从旧标签滑到新标签 (motion 共享布局), 两种形态都支持。
        下划线仍是 1px; 系统要求减弱动效时直接跳到位。不传时外观与行为和上面一致。
      </P>
      <Preview
        align={DEMO_ALIGN.start}
        code={`<Tabs defaultValue="overview">
  <TabsList animated>
    <TabsTrigger value="overview">概览</TabsTrigger>
    <TabsTrigger value="runs">运行记录</TabsTrigger>
    <TabsTrigger value="config">配置</TabsTrigger>
  </TabsList>
</Tabs>

<Tabs defaultValue="a">
  <TabsList variant="pill" animated>…</TabsList>
</Tabs>`}
      >
        <div className={DEMO_CLASS.stackLoose}>
          <Tabs defaultValue={DEMO_TAB_VIEW.overview}>
            <TabsList animated>
              <TabsTrigger value={DEMO_TAB_VIEW.overview}>概览</TabsTrigger>
              <TabsTrigger value={DEMO_TAB_VIEW.runs}>运行记录</TabsTrigger>
              <TabsTrigger value={DEMO_TAB_VIEW.config}>配置</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs defaultValue={DEMO_TAB_KEY.a}>
            <TabsList variant={DEMO_VARIANT.pill} animated>
              <TabsTrigger value={DEMO_TAB_KEY.a}>全部</TabsTrigger>
              <TabsTrigger value={DEMO_TAB_KEY.b}>存活</TabsTrigger>
              <TabsTrigger value={DEMO_TAB_KEY.c}>已死</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Preview>

      <H2>禁用某一项</H2>
      <Preview
        align={DEMO_ALIGN.start}
        code={`<Tabs defaultValue="1">
  <TabsList>
    <TabsTrigger value="1">可点</TabsTrigger>
    <TabsTrigger value="2" disabled>没权限</TabsTrigger>
  </TabsList>
</Tabs>`}
      >
        <Tabs defaultValue={DEMO_TAB_KEY.first}>
          <TabsList>
            <TabsTrigger value={DEMO_TAB_KEY.first}>可点</TabsTrigger>
            <TabsTrigger value="2" disabled>没权限</TabsTrigger>
          </TabsList>
        </Tabs>
      </Preview>

      <Callout title="别把它和 SegmentedControl 用混">
        两者长得像, 职责不同: <b className={DEMO_CLASS.foreground}>SegmentedControl</b> 只切视图、
        不负责面板内容, 用在工具栏那种"改一个筛选条件"的地方;
        <b className={DEMO_CLASS.foreground}>Tabs</b> 会把触发器与 TabsContent 做 aria 关联
        (tab → tabpanel), 是"同一对象的多个视图", 读屏软件能正确播报。用错的那一个
        在无障碍上是沉默的  看起来一样, 用起来不一样。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "Tabs.value / defaultValue", type: API_TYPE_STRING, desc: "受控 / 非受控的当前项。" },
          { name: "Tabs.onValueChange", type: "(v: string) => void", desc: "切换时回调。" },
          { name: "TabsList.variant", type: '"underline" | "pill"', default: '"underline"', desc: "由 List 下发给 trigger, 不必两处都写。" },
          { name: "TabsList.animated", type: API_TYPE_BOOLEAN, default: API_DEFAULT_FALSE, desc: "选中指示滑动切换, 同样由 List 下发。" },
          { name: "TabsTrigger.value", type: API_TYPE_STRING, desc: "对应 TabsContent 的 value。" },
          { name: "TabsTrigger.disabled", type: API_TYPE_BOOLEAN, default: API_DEFAULT_FALSE, desc: "禁用。" },
          { name: "TabsContent.value", type: API_TYPE_STRING, desc: "与触发器配对。" },
        ]}
      />
    </>
  );
}
