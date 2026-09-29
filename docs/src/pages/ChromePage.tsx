import type { JSX } from "react";
import { useState } from "react";
import {
  Button, Card, CardContent, DataBoundary, EmptyState, Input, PageHeader, SegmentedControl,
} from "@hx/ui";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";

/** PageHeader / EmptyState / DataBoundary 页。 */
export function ChromePage(): JSX.Element {
  const [tab, setTab] = useState<"all" | "alive" | "dead">("all");
  const [state, setState] = useState<"ok" | "loading" | "error" | "empty">("ok");

  return (
    <>
      <H2>PageHeader</H2>
      <P>
        两个下游面板各写了一份一模一样的页头 (gh-pool 与 ps-pool 的 Shell.tsx), 字号与间距逐年漂移。
        收进库里顺带定死两件事: <b className="text-foreground">标题不换行溢出</b> (用 truncate, 不让它把右侧按钮挤到下一行)、
        以及右操作区与标题的基线对齐。
      </P>
      <Preview
        align="stretch"
        code={`<PageHeader
  title="账号池"
  desc="共 128 个账号, 其中 104 个存活"
  right={
    <>
      <SegmentedControl items={...} value={tab} onChange={setTab} />
      <Button size="sm" variant="outline">刷新</Button>
    </>
  }
/>`}
      >
        <div className="w-full">
          <PageHeader
            title="账号池"
            desc="共 128 个账号, 其中 104 个存活"
            right={
              <>
                <SegmentedControl
                  items={[
                    { key: "all", label: "全部" },
                    { key: "alive", label: "存活" },
                    { key: "dead", label: "已死" },
                  ]}
                  value={tab}
                  onChange={setTab}
                />
                <Button size="sm" variant="outline">刷新</Button>
              </>
            }
          />
        </div>
      </Preview>

      <H2>PageHeader 的紧凑档与额外行</H2>
      <Preview
        align="start"
        code={`<PageHeader compact title="队列配置" right={<Button size="xs">保存</Button>} />
<PageHeader title="运行记录" extra={<Badge variant="outline">最近 24 小时</Badge>} />`}
      >
        <div className="w-full">
          <PageHeader compact title="队列配置" desc="改动即时生效" right={<Button size="xs">保存</Button>} />
          <PageHeader title="运行记录" desc="翻页会保留筛选条件" right={<Button size="sm" variant="ghost">导出</Button>} />
        </div>
      </Preview>

      <H2>EmptyState</H2>
      <P>
        空态是<b className="text-foreground">最容易被漏掉</b>的一种界面 —— 手写时它总是最后才补,
        于是措辞、留白、图标风格每个页面都不一样。三种语气 (空 / 错误 / 加载) 共用同一个骨架,
        因为它们在视觉上本就是同一件事: 这个位置现在没有内容。
      </P>
      <Preview
        align="start"
        code={`<EmptyState text="还没有账号" hint="点右上角「抓取」开始" />
<EmptyState kind="error" text="加载失败" hint="连接超时" action={<Button size="sm">重试</Button>} />
<EmptyState kind="denied" text="需要管理员权限" />
<EmptyState kind="loading" />`}
      >
        <Card className="w-64">
          <CardContent>
            <EmptyState text="还没有账号" hint="点右上角「抓取」开始" compact />
          </CardContent>
        </Card>
        <Card className="w-64">
          <CardContent>
            <EmptyState kind="error" text="加载失败" hint="连接超时" action={<Button size="sm">重试</Button>} compact />
          </CardContent>
        </Card>
        <Card className="w-64">
          <CardContent>
            <EmptyState kind="denied" text="需要管理员权限" compact />
          </CardContent>
        </Card>
        <Card className="w-64">
          <CardContent>
            <EmptyState kind="loading" compact />
          </CardContent>
        </Card>
      </Preview>

      <H2>DataBoundary: 三态一次判完</H2>
      <P>
        手写这段判断时最常出的错是<b className="text-foreground">顺序</b> —— 先判空再判 loading,
        首次加载会先闪一下"暂无数据"再变成内容。这里把顺序固定为 loading &gt; error &gt; empty &gt; 内容。
      </P>
      <Preview
        align="start"
        code={`<DataBoundary
  loading={state === "loading"}
  error={state === "error" ? new Error("连接超时") : null}
  empty={state === "empty"}
  emptyText="还没有数据"
  onRetry={() => refetch()}
>
  <div>真正的内容</div>
</DataBoundary>`}
      >
        <div className="flex w-full flex-col gap-3">
          <div className="flex gap-2">
            {(["ok", "loading", "error", "empty"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={state === s ? "primary" : "outline"}
                onClick={() => setState(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <Card className="w-72">
            <CardContent>
              <DataBoundary
                loading={state === "loading"}
                error={state === "error" ? new Error("连接超时 (10s)") : null}
                empty={state === "empty"}
                emptyText="还没有数据"
                onRetry={() => setState("loading")}
              >
                <div className="py-4 text-center text-[12px] text-muted-foreground">
                  真正的内容在这里
                </div>
              </DataBoundary>
            </CardContent>
          </Card>
        </div>
      </Preview>

      <Callout title="空态该不该给操作按钮">
        给。空态是新用户唯一会看到的界面之一 —— "还没有账号"配一句"点右上角抓取开始"
        比只写"暂无数据"有用得多。没有下一步可给的场景 (例如筛选后为空) 才只留一句话。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "PageHeader.title", type: "ReactNode", desc: "标题, 长标题自动 truncate。" },
          { name: "PageHeader.desc", type: "ReactNode", desc: "标题下方说明。" },
          { name: "PageHeader.right", type: "ReactNode", desc: "右侧操作区。" },
          { name: "PageHeader.extra", type: "ReactNode", desc: "标题下方的额外一行 (面包屑 / 标签)。" },
          { name: "PageHeader.compact", type: "boolean", default: "false", desc: "小标题档, 嵌在卡片或抽屉里时用。" },
          { name: "EmptyState.kind", type: '"empty" | "error" | "loading" | "denied"', default: '"empty"', desc: "决定图标与语气色。" },
          { name: "EmptyState.action", type: "ReactNode", desc: "下一步操作按钮。" },
          { name: "EmptyState.compact", type: "boolean", default: "false", desc: "紧凑档, 卡片内部用。" },
          { name: "DataBoundary.onRetry", type: "() => void", desc: "给了就在错误态显示重试按钮。" },
        ]}
      />
    </>
  );
}
