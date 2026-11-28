"use client";

import * as React from "react";
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type RowSelectionState, type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  /** 出现搜索框, 对所有列做包含匹配 */
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** 搜索框右侧: 筛选, 导出, 新建 */
  toolbar?: React.ReactNode;
  /** 行首出现复选框, 可多选 */
  selectable?: boolean;
  /** 选中行时顶部出现的批量操作; 拿到选中的行和清空函数 */
  bulkActions?: (rows: T[], clear: () => void) => React.ReactNode;
  onSelectionChange?: (rows: T[]) => void;
  /** 行唯一键, 选中状态跨分页和排序保持 */
  getRowId?: (row: T, index: number) => string;
  /** compact: 行高 36px, 适合运营后台的密集数据 */
  density?: "default" | "compact";
  /** 表格的读屏名 */
  "aria-label"?: string;
  className?: string;
}

/** 数据表: TanStack Table 驱动, 排序 / 搜索 / 分页 / 多选与批量操作 / 加载骨架 / 空态 / 行点击. 不接管取数. */
export function DataTable<T>({
  data, columns, searchable, searchPlaceholder = "搜索…", pageSize = 10, loading, empty = "没有数据", onRowClick, toolbar,
  selectable, bulkActions, onSelectionChange, getRowId, density = "default", className, ...aria
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize });
  React.useEffect(() => setPagination((p) => ({ ...p, pageSize, pageIndex: 0 })), [pageSize]);

  const cols = React.useMemo<ColumnDef<T, any>[]>(() => {
    if (!selectable) return columns;
    const select: ColumnDef<T, any> = {
      id: "__select",
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="选择本页全部"
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox aria-label="选择这一行" checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(v === true)} onClick={(e) => e.stopPropagation()} />
      ),
    };
    return [select, ...columns];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: cols,
    state: { sorting, globalFilter, rowSelection, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: (v) => { setGlobalFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    enableRowSelection: !!selectable,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const selectedKey = Object.keys(rowSelection).join(",");
  React.useEffect(() => { onSelectionChange?.(selected); }, [selectedKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const clear = () => setRowSelection({});
  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const compact = density === "compact";

  return (
    <div className={cn("space-y-3", className)}>
      {(searchable || toolbar || selectable) && (
        <div className="relative flex min-h-9 flex-wrap items-center gap-2">
          {searchable && (
            <Input
              value={globalFilter}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder.replace(/…$/, "")}
              leading={<Search />}
              className="max-w-xs"
            />
          )}
          <div className="ml-auto flex items-center gap-2">{toolbar}</div>
          {/* 批量操作条: 选中行时从上方滑入, 盖住工具栏 */}
          {selectable && selected.length > 0 && (
            <div role="region" aria-label="批量操作" className="absolute inset-0 flex items-center gap-2 rounded-lg border bg-background px-2 shadow-soft animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <Button variant="ghost" size="icon" className="size-7" aria-label="取消选择" onClick={clear}><X /></Button>
              <span className="text-sm tabular-nums" aria-live="polite">已选 {selected.length} 项</span>
              <div className="ml-auto flex items-center gap-2">{bulkActions?.(selected, clear)}</div>
            </div>
          )}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table aria-label={aria["aria-label"]} aria-busy={loading || undefined}>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => {
                  const sort = h.column.getIsSorted();
                  const can = h.column.getCanSort();
                  return (
                    <TableHead
                      key={h.id}
                      aria-sort={can ? (sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none") : undefined}
                      className={cn("text-xs font-medium text-muted-foreground", compact ? "h-9" : "h-10", h.column.id === "__select" && "w-10")}
                    >
                      {h.isPlaceholder ? null : can ? (
                        <button type="button" onClick={h.column.getToggleSortingHandler()} className="group/sort -mx-1 inline-flex items-center gap-1 rounded px-1 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sort === "asc" ? <ArrowUp className="size-3 text-foreground" /> : sort === "desc" ? <ArrowDown className="size-3 text-foreground" /> : <ChevronsUpDown className="size-3 opacity-40 transition-opacity group-hover/sort:opacity-80" />}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }, (_, i) => (
                <TableRow key={i}>
                  {cols.map((_, j) => (
                    <TableCell key={j} className={compact ? "py-1.5" : undefined}><Skeleton className="h-4 w-full max-w-[140px]" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" && e.target === e.currentTarget) onRowClick(row.original); } : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn("transition-colors duration-150", onRowClick && "cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={compact ? "py-1.5" : undefined}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={cols.length} className="h-32 text-center text-muted-foreground">{empty}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {total > pagination.pageSize && (
        <PaginationBar page={pagination.pageIndex + 1} total={total} pageSize={pagination.pageSize} onPageChange={(p) => table.setPageIndex(p - 1)} />
      )}
    </div>
  );
}

export type { ColumnDef };
