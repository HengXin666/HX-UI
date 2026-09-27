import type { JSX } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Switch } from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code } from "../components/DocKit";

export function CardPage(): JSX.Element {
  return (
    <>
      <P>
        上游**没有** Card 组件 —— 它用的是一条约定: 所有卡片都是 <Code>rounded-xl border border-border bg-card</Code> 这一族类串,
        在上百个文件里手写。复刻时把那族类串收成一个组件, 免得每个使用方各自记一遍边界的写法。
      </P>
      <Callout title="三条硬约定">
        普通卡片<b className="text-foreground">零阴影</b>, 层级靠 1px 边框加半透明底叠出来;
        hover 只换边框色与背景透明度, 不加阴影不放大; 线条全局 1px。
      </Callout>

      <H2>四种变体</H2>
      <P>按容器角色选: 普通卡片用 default, 浮层或需要压住背景时用 solid, 次级容器用 muted, 只要一圈边用 outline。</P>
      <Preview
        align="stretch"
        code={`<Card variant="default">默认: 半透明底 + 模糊</Card>
<Card variant="solid">实底: 不透明卡片面</Card>
<Card variant="muted">低对比: 次级容器</Card>
<Card variant="outline">描边: 只留一圈边</Card>

{/* hover 反馈: 只换边框色与背景透明度 */}
<Card interactive>可悬停的卡片</Card>`}
      >
        <Card variant="default" className="w-44 p-3 text-[12.5px]">默认 (半透明底 + 模糊)</Card>
        <Card variant="solid" className="w-44 p-3 text-[12.5px]">实底</Card>
        <Card variant="muted" className="w-44 p-3 text-[12.5px]">低对比</Card>
        <Card variant="outline" className="w-44 p-3 text-[12.5px]">描边</Card>
        <Card variant="default" interactive className="w-44 p-3 text-[12.5px]">悬停看看</Card>
      </Preview>

      <H2>带分区的卡片</H2>
      <P>Header / Title / Description / Content / Footer 五段。padding 按上游"标准卡片"档给死, 不用自己调。</P>
      <Preview
        code={`<Card variant="solid" className="w-80">
  <CardHeader>
    <CardTitle>系统通知</CardTitle>
    <CardDescription>agent 完成一轮回答时发系统通知</CardDescription>
  </CardHeader>
  <CardContent>内容区。padding 是 px-3.5 pb-3 pt-2.5。</CardContent>
  <CardFooter>
    <Button variant="outline" size="sm">取消</Button>
    <Button variant="primary" size="sm">保存</Button>
  </CardFooter>
</Card>`}
      >
        <Card variant="solid" className="w-80">
          <CardHeader>
            <CardTitle>系统通知</CardTitle>
            <CardDescription>agent 完成一轮回答时发系统通知</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <span className="text-[12.5px] text-muted-foreground">启用</span>
            <Switch defaultChecked />
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">取消</Button>
            <Button variant="primary" size="sm">保存</Button>
          </CardFooter>
        </Card>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "variant", type: '"default" | "solid" | "muted" | "outline"', default: '"default"', desc: "按容器角色选底色与边框深度。" },
          { name: "interactive", type: "boolean", default: "false", desc: "加上 hover 反馈。只换边框色与背景透明度。" },
        ]}
      />
    </>
  );
}
