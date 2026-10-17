import type { JSX } from "react";
import { Badge } from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code } from "../components/DocKit";

export function BadgePage(): JSX.Element {
  return (
    <>
      <P>标签。颜色只有三种语义状态色 (success / warning / danger), 业务标签一律降级为 token 叠色。</P>
      <Callout kind="warning" title="不要引入第四种颜色">
        成功/运行走 <Code>success</Code> token, 警告/可更新走 <Code>warning</Code> token, 错误走 <Code>danger</Code> token, 组件里不写调色盘色。
        「自定义」「实验」「Beta」这类业务标签不能自带颜色, 用 default 或 secondary 变体。
      </Callout>

      <H2>语义变体</H2>
      <Preview
        align="center"
        code={`<Badge variant="default">自定义</Badge>
<Badge variant="secondary">实验</Badge>
<Badge variant="outline">BETA</Badge>
<Badge variant="success">运行中</Badge>
<Badge variant="warning">可更新</Badge>
<Badge variant="destructive">失败</Badge>`}
      >
        <Badge variant="default">自定义</Badge>
        <Badge variant="secondary">实验</Badge>
        <Badge variant="outline">BETA</Badge>
        <Badge variant="success">运行中</Badge>
        <Badge variant="warning">可更新</Badge>
        <Badge variant="destructive">失败</Badge>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "variant", type: '"default" | "secondary" | "outline" | "success" | "warning" | "destructive"', default: '"default"', desc: "语义色。业务标签用前三个, 状态标签用后三个。" },
        ]}
      />
    </>
  );
}
