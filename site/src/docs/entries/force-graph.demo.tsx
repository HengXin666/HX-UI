import * as React from "react";
import { Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { ForceGraph, type GraphLink, type GraphNode } from "@/data";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

type Data = { nodes: GraphNode[]; links: GraphLink[] };

// 演示数据: 一套虚构的电商服务调用拓扑 (value = 每分钟调用量, 千次)
function services(): Data {
  const N = (id: string, group: string, value: number): GraphNode => ({ id, label: id, group, value });
  const nodes = [
    N("CDN", "接入层", 92), N("API 网关", "接入层", 88), N("BFF-App", "接入层", 51), N("BFF-Web", "接入层", 37),
    N("用户", "业务服务", 34), N("商品", "业务服务", 46), N("搜索", "业务服务", 41), N("购物车", "业务服务", 22), N("订单", "业务服务", 30),
    N("支付", "业务服务", 18), N("库存", "业务服务", 26), N("营销", "业务服务", 19), N("推荐", "业务服务", 33), N("物流", "业务服务", 12),
    N("MySQL 主库", "数据存储", 40), N("Redis", "数据存储", 64), N("Elasticsearch", "数据存储", 38), N("Kafka", "数据存储", 29), N("对象存储", "数据存储", 21),
    N("支付通道", "第三方", 9), N("短信", "第三方", 6), N("快递接口", "第三方", 7),
  ];
  const L = (source: string, target: string, value: number): GraphLink => ({ source, target, value });
  const links = [
    L("CDN", "API 网关", 88), L("API 网关", "BFF-App", 51), L("API 网关", "BFF-Web", 37),
    L("BFF-App", "用户", 18), L("BFF-App", "商品", 24), L("BFF-App", "搜索", 20), L("BFF-App", "购物车", 12), L("BFF-App", "推荐", 21),
    L("BFF-Web", "用户", 12), L("BFF-Web", "商品", 18), L("BFF-Web", "搜索", 16), L("BFF-Web", "订单", 9),
    L("购物车", "商品", 10), L("购物车", "营销", 8), L("订单", "库存", 14), L("订单", "支付", 11), L("订单", "营销", 7), L("订单", "物流", 6),
    L("支付", "支付通道", 9), L("物流", "快递接口", 7), L("用户", "短信", 6),
    L("用户", "MySQL 主库", 12), L("用户", "Redis", 20), L("商品", "MySQL 主库", 14), L("商品", "Redis", 28), L("商品", "对象存储", 21),
    L("搜索", "Elasticsearch", 38), L("推荐", "Redis", 16), L("推荐", "Kafka", 12), L("订单", "MySQL 主库", 14), L("订单", "Kafka", 11),
    L("库存", "Redis", 10), L("库存", "MySQL 主库", 8), L("支付", "Kafka", 6),
  ];
  return { nodes, links };
}

// 演示数据: 4 个社群的虚构用户关系 (value = 互动次数)
function social(): Data {
  const r = seeded(7);
  const groups = ["数码发烧友", "户外运动", "母婴亲子", "美妆护肤"];
  const names = ["阿杰", "小鱼", "老周", "Mia", "安安", "大熊", "七七", "Leo", "糖糖", "阿凯", "木子", "Ivy"];
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  groups.forEach((g, gi) => {
    const n = 9 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) nodes.push({ id: `${gi}-${i}`, label: `${names[(gi * 5 + i) % names.length]}${gi + 1}${i}`, group: g, value: Math.round(10 + r() * (i === 0 ? 220 : 80)) });
    for (let i = 1; i < n; i++) {
      links.push({ source: `${gi}-${i}`, target: `${gi}-0`, value: Math.round(2 + r() * 20) });
      if (r() < 0.55) links.push({ source: `${gi}-${i}`, target: `${gi}-${1 + Math.floor(r() * (n - 1))}`, value: Math.round(1 + r() * 8) });
    }
  });
  // 少量跨社群连线
  for (let k = 0; k < 7; k++) {
    const a = Math.floor(r() * 4), b = (a + 1 + Math.floor(r() * 3)) % 4;
    links.push({ source: `${a}-${Math.floor(r() * 6)}`, target: `${b}-${Math.floor(r() * 6)}`, value: Math.round(1 + r() * 5) });
  }
  const seen = new Set<string>();
  return { nodes, links: links.filter((l) => l.source !== l.target && !seen.has(`${l.source}|${l.target}`) && seen.add(`${l.source}|${l.target}`)) };
}

const SETS = { services, social } as const;

export default function ForceGraphDemo({ values }: DemoProps) {
  const set = (values.dataset as keyof typeof SETS) ?? "services";
  const [data, setData] = React.useState<Data>(() => SETS[set]());
  const [picked, setPicked] = React.useState<string | null>(null);
  const added = React.useRef<string[]>([]);
  const rnd = React.useRef(seeded(42));
  React.useEffect(() => { setData(SETS[set]()); added.current = []; setPicked(null); }, [set]);

  const add = () => setData((d) => {
    const r = rnd.current;
    const host = d.nodes[Math.floor(r() * d.nodes.length)];
    const id = `新节点 ${added.current.length + 1}`;
    added.current.push(id);
    const peer = d.nodes.filter((n) => n.group === host.group && n.id !== host.id)[Math.floor(r() * 3)];
    const nodes = [...d.nodes, { id, label: id, group: host.group, value: Math.round((host.value ?? 20) * (0.3 + r() * 0.5)) }];
    const links = [...d.links, { source: id, target: host.id, value: Math.round(2 + r() * 10) }];
    if (peer && r() < 0.6) links.push({ source: id, target: peer.id, value: Math.round(1 + r() * 6) });
    return { nodes, links };
  });
  const remove = () => setData((d) => {
    const r = rnd.current;
    const id = added.current.pop() ?? d.nodes[Math.floor(r() * d.nodes.length)]?.id;
    if (!id || d.nodes.length <= 3) return d;
    return { nodes: d.nodes.filter((n) => n.id !== id), links: d.links.filter((l) => l.source !== id && l.target !== id) };
  });
  const reweigh = () => setData((d) => {
    const r = rnd.current;
    return { nodes: d.nodes.map((n) => ({ ...n, value: Math.max(1, Math.round((n.value ?? 10) * (0.45 + r() * 1.3))) })), links: d.links };
  });
  const reset = () => { added.current = []; setData(SETS[set]()); };

  const label = picked ? data.nodes.find((n) => n.id === picked)?.label ?? picked : null;
  return (
    <ChartCard
      title={set === "services" ? "服务调用拓扑" : "社群用户关系"}
      value={`${data.nodes.length} 个节点 · ${data.links.length} 条连线`}
      delta={label ? <span className="text-muted-foreground">已选中 {label}</span> : undefined}
      wide
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={add}><Plus aria-hidden />新增节点</Button>
        <Button size="sm" variant="outline" onClick={remove}><Minus aria-hidden />删除节点</Button>
        <Button size="sm" variant="outline" onClick={reweigh}><RefreshCw aria-hidden />更新权重</Button>
        <Button size="sm" variant="ghost" onClick={reset}><RotateCcw aria-hidden />重置</Button>
      </div>
      <ForceGraph
        nodes={data.nodes}
        links={data.links}
        directed={!!values.directed}
        labels={values.labels as "auto" | "all" | "none"}
        linkDistance={Number(values.linkDistance)}
        charge={Number(values.charge)}
        valueLabel={set === "services" ? "调用量 (千次/分)" : "互动次数"}
        ariaLabel={set === "services" ? "服务调用拓扑" : "社群用户关系"}
        onSelect={setPicked}
        height={440}
      />
      <p className="mt-2 text-[11px] text-muted-foreground">演示数据为虚构生成。</p>
    </ChartCard>
  );
}
