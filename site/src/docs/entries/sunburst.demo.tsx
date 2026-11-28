import * as React from "react";
import { Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { Sunburst, type SunburstNode } from "@/data";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

// 演示数据为虚构
const t = (name: string, kids: (SunburstNode | [string, number])[]): SunburstNode => ({ name, children: kids.map((k) => (Array.isArray(k) ? { name: k[0], value: k[1] } : k)) });
const SALES: SunburstNode = t("全国", [
  t("华东", [t("上海", [["浦东", 412], ["徐汇", 238], ["静安", 196]]), t("江苏", [["南京", 286], ["苏州", 342], ["无锡", 158]]), t("浙江", [["杭州", 398], ["宁波", 176], ["温州", 104]])]),
  t("华南", [t("广东", [["深圳", 456], ["广州", 384], ["东莞", 142]]), t("福建", [["厦门", 128], ["福州", 96]])]),
  t("华北", [t("北京", [["朝阳", 326], ["海淀", 298]]), t("天津", [["和平", 88], ["滨海", 74]]), t("河北", [["石家庄", 82], ["唐山", 46]])]),
  t("西南", [t("四川", [["成都", 268], ["绵阳", 42]]), t("重庆", [["渝中", 136], ["渝北", 92]])]),
  t("华中", [t("湖北", [["武汉", 214], ["宜昌", 38]]), t("湖南", [["长沙", 176], ["株洲", 34]])]),
]);
const CLOUD: SunburstNode = t("本月云账单", [
  t("计算", [t("云服务器", [["生产", 18.6], ["预发", 4.2], ["测试", 2.8]]), t("容器服务", [["网关集群", 6.4], ["任务集群", 9.1]]), t("函数计算", [["定时任务", 1.2], ["事件处理", 2.6]])]),
  t("存储", [t("对象存储", [["图片视频", 7.8], ["日志归档", 3.1]]), t("云盘", [["系统盘", 2.2], ["数据盘", 4.6]])]),
  t("数据库", [t("MySQL", [["主库", 8.4], ["只读", 3.6]]), t("Redis", [["缓存", 3.2]]), t("分析型", [["数仓", 6.9]])]),
  t("网络", [t("CDN", [["静态资源", 5.4], ["下载", 2.1]]), t("公网带宽", [["出口", 3.8]])]),
  t("其他", [t("监控日志", [["日志服务", 2.4], ["链路追踪", 0.9]])]),
]);
const NEW_LEAF: Record<string, string[]> = {
  sales: ["新区", "开发区", "高新区", "经开区", "临港", "南站", "空港", "老城"],
  cloud: ["灰度", "备份", "压测", "边缘节点", "大模型推理", "离线计算"],
};

const leafParents = (n: SunburstNode, path: string[] = []): string[][] =>
  n.children?.some((c) => !c.children) ? [path] : (n.children ?? []).flatMap((c) => leafParents(c, [...path, c.name]));
const update = (n: SunburstNode, path: string[], f: (n: SunburstNode) => SunburstNode): SunburstNode =>
  path.length ? { ...n, children: n.children?.map((c) => (c.name === path[0] ? update(c, path.slice(1), f) : c)) } : f(n);
const mapLeaves = (n: SunburstNode, f: (v: number) => number): SunburstNode =>
  n.children ? { ...n, children: n.children.map((c) => mapLeaves(c, f)) } : { ...n, value: f(n.value ?? 0) };
const sum = (n: SunburstNode): number => (n.children ? n.children.reduce((s, c) => s + sum(c), 0) : n.value ?? 0);

export default function SunburstDemo({ values }: DemoProps) {
  const kind = values.dataset === "cloud" ? "cloud" : "sales";
  const base = kind === "cloud" ? CLOUD : SALES;
  const [data, setData] = React.useState(base);
  const [scope, setScope] = React.useState<string[]>([]);
  const rnd = React.useRef(seeded(23));
  const n = React.useRef(0);
  React.useEffect(() => { setData(kind === "cloud" ? CLOUD : SALES); setScope([]); n.current = 0; }, [kind]);

  // 增删都落在当前下钻范围里, 这样能看到动画
  const parentsInScope = (d: SunburstNode) => {
    const all = leafParents(d);
    const inScope = all.filter((p) => scope.every((s, i) => p[i] === s));
    return inScope.length ? inScope : all;
  };
  const add = () => setData((d) => {
    const ps = parentsInScope(d), p = ps[Math.floor(rnd.current() * ps.length)];
    const names = NEW_LEAF[kind], name = `${names[n.current % names.length]}${n.current >= names.length ? n.current : ""}`;
    n.current++;
    const v = kind === "cloud" ? Math.round((1 + rnd.current() * 6) * 10) / 10 : Math.round(60 + rnd.current() * 260);
    return update(d, p, (x) => ({ ...x, children: [...(x.children ?? []), { name, value: v }] }));
  });
  const remove = () => setData((d) => {
    const ps = parentsInScope(d).filter((p) => {
      let x: SunburstNode | undefined = d; for (const s of p) x = x?.children?.find((c) => c.name === s);
      return (x?.children?.length ?? 0) > 1;
    });
    if (!ps.length) return d;
    const p = ps[Math.floor(rnd.current() * ps.length)];
    return update(d, p, (x) => {
      const kids = [...(x.children ?? [])].sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
      return { ...x, children: x.children?.filter((c) => c !== kids[0]) };
    });
  });
  const refresh = () => setData((d) => mapLeaves(d, (v) => Math.max(kind === "cloud" ? 0.3 : 20, Math.round(v * (0.55 + rnd.current() * 0.9) * 10) / 10)));

  const unit = kind === "cloud" ? " 万" : " 万";
  const total = sum(data);
  return (
    <ChartCard
      title={kind === "cloud" ? "本月云成本构成（万元）" : "Q3 区域销售额（万元）"}
      value={`${total.toLocaleString("zh-CN", { maximumFractionDigits: 1 })} 万`}
      delta={<span className="text-muted-foreground">{kind === "cloud" ? "产品 › 服务 › 用途" : "大区 › 省市 › 区县"}</span>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={add}><Plus aria-hidden />{kind === "cloud" ? "新增用途" : "新增区县"}</Button>
        <Button size="sm" variant="outline" onClick={remove}><Minus aria-hidden />{kind === "cloud" ? "删除用途" : "删除区县"}</Button>
        <Button size="sm" variant="outline" onClick={refresh}><RefreshCw aria-hidden />更新数值</Button>
        <Button size="sm" variant="ghost" onClick={() => setData(base)}><RotateCcw aria-hidden />重置</Button>
      </div>
      <Sunburst
        data={data}
        maxDepth={Number(values.maxDepth)}
        showLabels={!!values.showLabels}
        sort={!!values.sort}
        unit={unit}
        onDrill={setScope}
        ariaLabel={kind === "cloud" ? "云成本构成旭日图" : "区域销售额旭日图"}
      />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。点扇区下钻，点圆心返回；新增和删除落在当前下钻范围内。</p>
    </ChartCard>
  );
}
