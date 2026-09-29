"use client";

import {
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { cn } from "../primitives/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "../primitives/skeleton";

/**
 * 数据表。
 *
 * 为什么要有它: 两个已接入的下游面板各手搓了一份 170 / 184 行的原生 <table>,
 * 而且都把同样四件事重写了一遍 —— 粘性表头、行悬停、空态、加载态。
 * 这类"每个页面都要重来一次"的活不该由使用方承担。
 *
 * ## 三条刻意的设计约束
 *
 * 一、**不接管数据获取**。排序、分页、筛选全部由使用方给数据, 组件只负责渲染。
 *     组件里塞请求逻辑会把"什么时候该重新取数"这类业务问题焊进来, 用两次就会发现
 *     约束不对 —— 真实项目里数据往往来自轮询、SSE、共享 store, 三种都不一样。
 *
 * 二、**列宽用 CSS 网格感**, 不用 table-layout: fixed。列定义里的 width 直接落到
 *     <col>, 这是浏览器原生支持的窄列优先算法, 比手算百分比稳。
 *
 * 三、**粘性表头默认开**。表格一旦超过一屏, 滚动时看不到列名是数据表最常见的可用性缺陷,
 *     而且不写不报错。用 sticky + backdrop-blur 处理半透明底 (直接给不透明底色会让
 *     表头在圆角卡片里露出一条硬边)。
 *
 * ## 与 Card 的关系
 * 默认用 Card 包一层 (与下游现在的写法一致)。要嵌进已有卡片里就传 bare。
 */
export interface DataTableColumn<T> {
  /** 列 id。取不到 row[key] 时用 render。 */
  readonly key: string;
  readonly header: ReactNode;
  /** 单元格内容。不给就取 row[key]。 */
  readonly render?: (row: T, index: number) => ReactNode;
  /** 列宽, 落到 <col style="width">。不写由浏览器按内容分配。 */
  readonly width?: string;
  readonly align?: "left" | "right" | "center";
  /** 数字列: 等宽 + 右对齐, 免得位数不同的数字左右跳。 */
  readonly numeric?: boolean;
  readonly headerClassName?: string;
  readonly cellClassName?: string;
}

export interface DataTableProps<T> {
  readonly columns: readonly DataTableColumn<T>[];
  readonly rows: readonly T[];
  /** 行 key。默认取 (row as {id}).id, 取不到就用下标 —— 有重复 key 的风险, 建议显式给。 */
  readonly rowKey?: (row: T, index: number) => string | number;
  /** 点整行。给了就会加 cursor-pointer 与键盘可达性。 */
  readonly onRowClick?: (row: T) => void;
  readonly loading?: boolean;
  /** 加载态占位行数。 */
  readonly loadingRows?: number;
  readonly empty?: ReactNode;
  readonly emptyText?: string;
  /** 容器最大高度。给值才出滚动区与粘性表头。 */
  readonly maxHeight?: string;
  /** 不套 Card, 直接渲染表格 —— 嵌进已有卡片时用。 */
  readonly bare?: boolean;
  /** 表格外的标题栏 (套 Card 时包在 CardHeader 里)。 */
  readonly title?: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
  readonly tableClassName?: string;
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading = false,
  loadingRows = 5,
  empty,
  emptyText = "暂无数据",
  maxHeight,
  bare = false,
  title,
  actions,
  className,
  tableClassName,
}: DataTableProps<T>): JSX.Element {
  const head = (
    <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
      <tr className="border-b border-border/60">
        {columns.map((c) => (
          <th
            key={c.key}
            scope="col"
            className={cn(
              "px-3 py-2 text-[length:var(--fs-xs)] font-medium whitespace-nowrap text-muted-foreground",
              ALIGN[c.align ?? (c.numeric ? "right" : "left")],
              c.headerClassName,
            )}
          >
            {c.header}
          </th>
        ))}
      </tr>
    </thead>
  );

  const body = loading ? (
    <tbody>
      {Array.from({ length: loadingRows }, (_, i) => (
        <tr key={i} className="border-b border-border/30">
          {columns.map((c) => (
            <td key={c.key} className={cn("px-3 py-2.5", c.cellClassName)}>
              <Skeleton className="h-3" style={{ width: i % 2 === 0 ? "60%" : "80%" }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  ) : (
    <tbody>
      {rows.map((row, i) => (
        <tr
          key={rowKey ? rowKey(row, i) : ((row as { id?: string | number }).id ?? i)}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          onKeyDown={
            onRowClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }
              : undefined
          }
          className={cn(
            "border-b border-border/30 transition-colors last:border-b-0 hover:bg-accent/40",
            onRowClick &&
              "cursor-pointer outline-none focus-visible:bg-accent/60 focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-inset",
          )}
        >
          {columns.map((c) => (
            <td
              key={c.key}
              className={cn(
                "px-3 py-1.5 text-[length:var(--fs-sm-half)] text-foreground",
                ALIGN[c.align ?? (c.numeric ? "right" : "left")],
                c.numeric && "tabular-nums",
                c.cellClassName,
              )}
            >
              {c.render ? c.render(row, i) : ((row as Record<string, unknown>)[c.key] as ReactNode)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  const table = (
    <table
      className={cn("w-full border-collapse text-[length:var(--fs-sm-half)]", tableClassName)}
    >
      <colgroup>
        {columns.map((c) => (
          <col key={c.key} style={c.width ? { width: c.width } : undefined} />
        ))}
      </colgroup>
      {head}
      {body}
    </table>
  );

  const inner =
    !loading && rows.length === 0 ? (
      <>{empty ?? <EmptyState text={emptyText} />}</>
    ) : maxHeight ? (
      <div className="overflow-auto" style={{ maxHeight }}>
        {table}
      </div>
    ) : (
      table
    );

  if (bare) return <div className={className}>{inner}</div>;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center gap-3">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
        </CardHeader>
      )}
      <CardContent className="px-0 pb-0">{inner}</CardContent>
    </Card>
  );
}

/**
 * 客户端搜索框: 输入即时过滤。
 *
 * 单独给出是因为"表格右上角一个搜索框"几乎每张表都要, 而手写时总会出现
 * 一个通病 —— 输入框与过滤后的列表不同步 (受控值存在父层, 过滤结果却按另一个
 * 变量算)。这里把两者收进一个 hook, 使用方只管给数据与匹配函数。
 */
export function useTableSearch<T>(
  rows: readonly T[],
  match: (row: T, query: string) => boolean,
): { query: string; setQuery: (q: string) => void; filtered: readonly T[] } {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => match(r, q));
  }, [rows, query, match]);
  return { query, setQuery, filtered };
}

/** 表格容器 (不需要表头粘性 / 空态逻辑时可用它自己拼)。 */
export function TableShell({ className, ...props }: ComponentPropsWithoutRef<"div">): JSX.Element {
  return <div className={cn("overflow-auto", className)} {...props} />;
}