"use client";

import { useMemo, useState, type JSX } from "react";

const NAME_KEY = "name";
const VALUE_KEY = "value";

export interface GridRow {
  readonly id: string;
  readonly name: string;
  readonly value: number;
}

/**
 * 表格. 行悬停只改背景. 选中用 120ms 透明度条. 排序时行序跟着变, 不重播入场.
 */
export function CraftTable({ rows }: { readonly rows: readonly GridRow[] }): JSX.Element {
  const [sort, setSort] = useState<"name" | "value">(NAME_KEY);
  const [dir, setDir] = useState<1 | -1>(1);
  const [selected, setSelected] = useState<string | null>(null);
  const ordered = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (sort === NAME_KEY ? a.name.localeCompare(b.name) : a.value - b.value) * dir);
    return copy;
  }, [rows, sort, dir]);

  const toggle = (key: "name" | "value"): void => {
    if (sort === key) setDir((prev) => (prev === 1 ? -1 : 1));
    else {
      setSort(key);
      setDir(1);
    }
  };

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th><button type="button" className="h-8" onClick={() => toggle(NAME_KEY)}>名称</button></th>
          <th><button type="button" className="h-8" onClick={() => toggle(VALUE_KEY)}>数值</button></th>
        </tr>
      </thead>
      <tbody>
        {ordered.map((row) => (
          <tr
            key={row.id}
            aria-selected={selected === row.id}
            className="cursor-pointer border-t border-border transition-[background-color] duration-150 hover:bg-accent/40"
            onClick={() => setSelected(row.id)}
          >
            <td className="relative h-9 px-2">
              <span className="absolute inset-y-1 left-0 w-px bg-foreground transition-opacity duration-150" style={{ opacity: selected === row.id ? 1 : 0 }} />
              {row.name}
            </td>
            <td className="px-2 tabular-nums">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
