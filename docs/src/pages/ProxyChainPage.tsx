import { useState, type JSX } from "react";
import { ProxyChain, ProxyLayerLegend, Badge, Button, Card, CardContent, CardHeader, CardTitle, type ProxyLayer } from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code } from "../components/DocKit";

/**
 * 一份真实形态的数据 —— 用来演示这个件真正要解决的问题。
 *
 * 注意三条 `meta`: 41 / 1 / 200 是**不同层**的数量。混起来说就会出现
 * "有 17 个节点"这种错话 (那是入口数)。
 */
const EGRESS: readonly ProxyLayer[] = [
  { kind: "listener", title: "hx-shared-inbound-standard-mixed", meta: "mixed · 7890", status: "启用", tone: "success" },
  { kind: "group", title: "良心云", meta: "url-test · 41 候选节点", status: "url-test", tone: "outline" },
  { kind: "node", title: "lxyus1.777078.xyz", meta: "hysteria2 · 181ms", status: "healthy", tone: "success" },
];

const FIXED: readonly ProxyLayer[] = [
  { kind: "listener", title: "ghreg-us01", meta: "mixed · 7890", status: "启用", tone: "success" },
  { kind: "group", title: "ghreg-us01", meta: "manual · 钉死单节点", status: "manual", tone: "outline" },
  { kind: "node", title: "lxyus1.777078.xyz", meta: "hysteria2", status: "healthy", tone: "success" },
];

const BAD: readonly ProxyLayer[] = [
  { kind: "listener", title: "ghreg-us02", meta: "mixed · 7890", status: "启用", tone: "success" },
  { kind: "group", title: "ghreg-us02", meta: "manual", status: "manual", tone: "outline" },
  {
    kind: "node", title: "lxyus2.777078.xyz", meta: "hysteria2",
    status: "未命中", tone: "destructive",
    detail: "节点不可达 —— 该策略组下无可用实体, 此入口当前无法出网",
  },
];

/** 可切换的实例 —— 演示"同一个组件表达三种真实状态"。 */
function ChainDemo(): JSX.Element {
  const [i, setI] = useState(0);
  const sets = [
    { name: "共享入口 + url-test 组", data: EGRESS, note: "一个入口, 组内 41 个候选, 自动选延迟最低" },
    { name: "专用入口 + manual 组", data: FIXED, note: "钉死单节点 —— 同一身份永远同一 IP" },
    { name: "实体失效", data: BAD, note: "组还在, 但它筛出的实体不可达" },
  ];
  const cur = sets[i];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {sets.map((s, idx) => (
          <Button key={s.name} size="sm" variant={idx === i ? "default" : "outline"} onClick={() => setI(idx)}>
            {s.name}
          </Button>
        ))}
        <span className="ml-auto text-[11px] text-muted-foreground">{cur.note}</span>
      </div>
      <ProxyChain layers={cur.data} />
    </div>
  );
}

export function ProxyChainPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <H2>ProxyChain 代理服务链路</H2>
        <P>
          把一个代理服务的<b>三层</b>按上下级画出来, 让人不再把它们混成一个词 "节点"。
        </P>
      </div>

      <Callout kind="warning" title="它解决的是一类真实的沟通事故">
        <span className="text-[12px]">
          代理有三个层次, 数量各不相同, 却常被统称为 "节点":
          <br />
          <span className="font-mono text-[11px]">入口 17 个 / 策略组 5 个 / 实体 200 个</span>
          <br />
          实测事故: 把 "入口数" 当成 "节点数" 上报, 并据此删除入口 ——
          连带断掉了挂在那些入口上的<b>全部出口</b>。本组件把层名写死在每一行左侧,
          从视觉上杜绝这种混淆。
        </span>
      </Callout>

      <Card>
        <CardHeader>
          <CardTitle>图层含义</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ProxyLayerLegend />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] text-muted-foreground">
                  <th className="py-1.5 pr-4 font-normal">层</th>
                  <th className="py-1.5 pr-4 font-normal">是什么</th>
                  <th className="py-1.5 font-normal">是否持有服务器</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/25">
                  <td className="py-1.5 pr-4 font-medium text-foreground">入口 listener</td>
                  <td className="py-1.5 pr-4">对外端口 + 协议, 绑定一个策略组</td>
                  <td className="py-1.5">否</td>
                </tr>
                <tr className="border-b border-border/25">
                  <td className="py-1.5 pr-4 font-medium text-foreground">策略 group</td>
                  <td className="py-1.5 pr-4">虚拟选择器 (<span className="font-mono text-[11px]">url-test / manual / round-robin</span>)</td>
                  <td className="py-1.5">否 —— 只描述"怎么挑"</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 font-medium text-foreground">实体 node</td>
                  <td className="py-1.5 pr-4">真实上游服务器 (协议 / 指纹 / 加密配置)</td>
                  <td className="py-1.5 text-foreground">是</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Code>{`关系:  listener  →  group  →  (按策略筛出的)  node`}</Code>
        </CardContent>
      </Card>

      <Preview
        align="stretch"
        code={`<ProxyChain layers={[
  { kind: "listener", title: "hx-shared-inbound-standard-mixed", meta: "mixed · 7890", status: "启用", tone: "success" },
  { kind: "group",    title: "良心云", meta: "url-test · 41 候选节点", status: "url-test", tone: "outline" },
  { kind: "node",     title: "lxyus1.777078.xyz", meta: "hysteria2 · 181ms", status: "healthy", tone: "success" },
]} />`}
      >
        <ChainDemo />
      </Preview>

      <div>
        <H2>单层与失败态</H2>
        <P>
          层数不固定: 一个策略组后面可能跟多个实体。也可以只看其中一段。
          失败态用 <span className="font-mono text-[11px]">tone="destructive"</span> + <span className="font-mono text-[11px]">detail</span> 说明原因 ——
          不要只画一个红点。
        </P>
      </div>

      <Preview
        align="stretch"
        code={`{/* 只看两段: 入口 -> 策略 */}
<ProxyChain layers={EGRESS.slice(0, 2)} />

{/* 实体失效: 组还在, 但它筛出的实体不可达 */}
<ProxyChain layers={[
  { kind: "listener", title: "ghreg-us02", meta: "mixed · 7890", status: "启用", tone: "success" },
  { kind: "group",    title: "ghreg-us02", meta: "manual", status: "manual", tone: "outline" },
  { kind: "node",     title: "lxyus2.777078.xyz", meta: "hysteria2",
    status: "未命中", tone: "destructive",
    detail: "节点不可达 —— 该策略组下无可用实体, 此入口当前无法出网" },
]} />`}
      >
        <div className="space-y-3">
          <ProxyChain layers={EGRESS.slice(0, 2)} />
          <ProxyChain layers={BAD} />
          <ProxyChain layers={EGRESS.slice(2)} />
        </div>
      </Preview>

      <div>
        <H2>Props</H2>
      </div>

      <PropsTable
        rows={[
          { name: "layers", type: "readonly ProxyLayer[]", desc: "按 listener → group → node 顺序排列的层" },
          { name: "showConnector", type: "boolean", default: "true", desc: "左侧圆点 + 竖线。单层使用时建议关掉" },
          { name: "className", type: "string", desc: "外层容器类名" },
        ]}
      />

      <div>
        <H2>ProxyLayer</H2>
      </div>

      <PropsTable
        rows={[
          { name: "kind", type: '"listener" | "group" | "node"', desc: "决定层名与圆点颜色 —— 这是协议事实, 不由使用方覆写" },
          { name: "title", type: "string", desc: "主体 (等宽字体显示): 入口名 / 组名 / 节点名" },
          { name: "meta", type: "string", desc: "次要信息: 端口 / 策略 / 协议 / 延迟" },
          { name: "status", type: "string", desc: "右侧角标文本" },
          { name: "tone", type: "Badge 语义色", default: "secondary", desc: "角标颜色: success / warning / destructive / secondary / outline" },
          { name: "detail", type: "ReactNode", desc: "补充说明。失败态应当写清原因, 不要只染色" },
        ]}
      />

      <Callout kind="info" title="设计取舍">
        <span className="text-[12px]">
          层名 (<span className="font-mono text-[11px]">入口 / 策略 / 实体</span>) 写死在组件里, 不让使用方传 ——
          如果每个调用方自己写标签, 迟早有人写成 "节点 / 节点 / 节点", 那这个组件就没有意义了。
          同理 <ProxyLayerLegend /> 是独立件: 这三句是协议事实, 每个列表页都该说同一遍。
        </span>
      </Callout>
    </div>
  );
}