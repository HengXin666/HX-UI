"use client";

import type { JSX } from "react";
import { STACK_DIRECTION } from "../../constants/box";
import { cn } from "../../primitives/utils";
import { HX_LEAD, STUDIO_CLASS } from "../classes";

export interface CompareColumn {
  id: string;
  title: string;
  featured?: boolean;
}

export interface CompareRow {
  label: string;
  cells: Readonly<Record<string, string>>;
}

export interface CompareProps {
  caption: string;
  columns: readonly CompareColumn[];
  rows: readonly CompareRow[];
  className?: string;
  classNames?: { root?: string; featured?: string };
}

/**
 * 对比表. 第一列粘住, 主推列用 data-state=featured 标出.
 * 原生 table, 方向键交给浏览器的表格导航.
 */
export function Compare({ caption, columns, rows, className, classNames }: CompareProps): JSX.Element {
  return (
    <div data-slot="hx-compare" className={cn(STUDIO_CLASS.scrollX, className, classNames?.root)}>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="mb-3 text-left text-sm font-medium text-foreground">{caption}</caption>
        <thead>
          <tr>
            <th scope={"col"} className="sticky left-0 bg-background px-3 py-2 font-medium text-muted-foreground">
              项目
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                scope={"col"}
                data-state={column.featured ? HX_LEAD : undefined}
                className={cn("px-3 py-2 font-medium", column.featured ? STUDIO_CLASS.ink : STUDIO_CLASS.quiet, column.featured && classNames?.featured)}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border">
              <th scope={STACK_DIRECTION.row} className={cn("sticky left-0 bg-background px-3 py-3 font-normal", STUDIO_CLASS.label)}>
                {row.label}
              </th>
              {columns.map((column) => (
                <td
                  key={column.id}
                  data-state={column.featured ? HX_LEAD : undefined}
                  className={cn("px-3 py-3", column.featured ? STUDIO_CLASS.ink : STUDIO_CLASS.quiet)}
                >
                  {row.cells[column.id] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
