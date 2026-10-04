"use client";

import type { JSX } from "react";
import { cn } from "../primitives/utils";
import { Input } from "../primitives/input";
import { Switch } from "../primitives/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../primitives/select";
import type { BlueprintRegistry, BlueprintNode, ParamDef } from "./types";
import { execOutIds, execOutLabel } from "./connect";
import { EXEC } from "./types";

/**
 * 节点卡片。
 *
 * 三段: 标题条 / 端口区 / 参数区。
 * 端口一律竖排 (理由见 geometry.ts), 输入左、输出右, 行高固定 20px
 * —— 那个数值必须和 geometry.PORT_ROW 对齐, 否则连线端点会偏离圆点。
 *
 * 卡片本身**不处理拖拽**: 位置由画布用 transform 摆, 这里只负责画自己。
 * 这样同一份卡片在缩略图 / 导出图里也能复用。
 */

export interface BlueprintNodeCardProps {
  readonly registry: BlueprintRegistry;
  readonly node: BlueprintNode;
  readonly selected?: boolean;
  /** 输入口 -> 是否已有连线。决定圆点是实心还是空心。 */
  readonly connected?: Readonly<Record<string, boolean>>;
  /** 输入口 -> 是否有错。画成红点。 */
  readonly portErrors?: Readonly<Record<string, boolean>>;
  readonly collapsed?: boolean;
  readonly onToggleCollapse?: () => void;
  readonly onParamChange?: (key: string, value: unknown) => void;
  readonly className?: string;
  /** 让外部拿到端口元素的锚点。 */
  readonly portRef?: (portId: string, dir: "in" | "out", el: HTMLElement | null) => void;
}

export function BlueprintNodeCard({
  registry, node, selected, connected, portErrors, collapsed,
  onToggleCollapse, onParamChange, className, portRef,
}: BlueprintNodeCardProps): JSX.Element {
  const def = registry.nodeTypes.get(node.type);
  const isCollapsed = collapsed ?? node.collapsed ?? def?.collapsed ?? false;
  const execOuts = execOutIds(def);
  const title = node.title ?? def?.label ?? node.type;
  const hasError = !!portErrors && Object.keys(portErrors).length > 0;

  if (!def) {
    return (
      <div className={cn("rounded-lg border border-destructive/60 bg-card px-2.5 py-2", className)}>
        <div className="text-[12px] font-medium text-destructive">未知节点</div>
        <div className="text-[11px] text-muted-foreground">{node.type}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-foreground transition-colors",
        selected ? "border-primary/70" : hasError ? "border-destructive/50" : "border-border",
        className
      )}
    >
      {/* 标题条。执行入口画在它左边 —— 与"被触发的那一端"的语义对齐。 */}
      <div className="flex h-[30px] items-center gap-1.5 rounded-t-lg border-b border-border/60 bg-muted/40 px-2">
        {def.execIn && (
          <span
            ref={(el) => portRef?.("exec-in", "in", el)}
            data-port="exec-in"
            data-dir="in"
            className="block size-[9px] shrink-0 rounded-full border border-foreground bg-background"
          />
        )}
        {def.icon ? <span className="shrink-0 opacity-70">{def.icon}</span> : null}
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{title}</span>

        {/*
          折叠态没有端口区, 但执行出口必须有落点 —— 否则一折叠,
          从它出去的执行线就断在空气里、再也抓不回来。
          portPos 在折叠时把所有出口放到标题条中线, 这里画在同一条线上。
        */}
        {isCollapsed && execOuts.length > 0 && (
          <span
            ref={(el) => portRef?.(execOuts[execOuts.length - 1], "out", el)}
            data-port={execOuts[execOuts.length - 1]}
            data-dir="out"
            className="block size-[9px] shrink-0 rounded-full border border-foreground bg-background"
          />
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 rounded px-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            aria-label={isCollapsed ? "展开" : "折叠"}
          >
            {isCollapsed ? "+" : "−"}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="px-2 py-1.5">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              {(def.inputs ?? []).map((p) => (
                <PortRow
                  key={p.id}
                  dir="in"
                  port={p}
                  registry={registry}
                  filled={connected?.[p.id]}
                  invalid={portErrors?.[p.id]}
                  portRef={portRef}
                />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              {/* 行序 = [执行出口, 数据出口], 必须与 geometry.portPos 一致 */}
              {execOuts.map((id) => (
                <PortRow
                  key={id}
                  dir="out"
                  port={{ id, label: execOutLabel(def, id), type: EXEC }}
                  registry={registry}
                  filled
                  portRef={portRef}
                />
              ))}
              {(def.outputs ?? []).map((p) => (
                <PortRow key={p.id} dir="out" port={p} registry={registry} filled portRef={portRef} />
              ))}
            </div>
          </div>

          {(def.params ?? []).length > 0 && (
            <div className="mt-1.5 space-y-1.5 border-t border-border/50 pt-1.5">
              {(def.params ?? []).map((p) => (
                <ParamField
                  key={p.id}
                  def={p}
                  value={node.params?.[p.id] ?? p.default}
                  onChange={(v) => onParamChange?.(p.id, v)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PortRow({
  dir, port, registry, filled, invalid, portRef,
}: {
  readonly dir: "in" | "out";
  readonly port: { readonly id: string; readonly label?: string; readonly type: string };
  readonly registry: BlueprintRegistry;
  readonly filled?: boolean;
  readonly invalid?: boolean;
  readonly portRef?: BlueprintNodeCardProps["portRef"];
}): JSX.Element {
  const color = registry.typeColor(port.type);
  return (
    <div className={cn("flex h-5 items-center gap-1.5", dir === "out" && "flex-row-reverse")}>
      <span
        ref={(el) => portRef?.(port.id, dir, el)}
        data-port={port.id}
        data-dir={dir}
        className={cn(
          "block size-[9px] shrink-0 rounded-full border transition-colors",
          invalid ? "border-destructive bg-destructive" : "border-foreground/40",
          !invalid && (filled ? cn(color ?? "bg-foreground") : "bg-background")
        )}
      />
      <span className={cn("min-w-0 truncate text-[11px] text-muted-foreground", dir === "out" && "text-right")}>
        {port.label ?? port.id}
      </span>
    </div>
  );
}

function ParamField({
  def, value, onChange,
}: {
  readonly def: ParamDef;
  readonly value: unknown;
  readonly onChange: (v: unknown) => void;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{def.label ?? def.id}</span>
      <div className="w-[86px] shrink-0">
        {def.kind === "switch" ? (
          <Switch checked={!!value} onCheckedChange={onChange} />
        ) : def.kind === "select" ? (
          <Select value={String(value ?? "")} onValueChange={onChange}>
            <SelectTrigger className="h-6 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(def.options ?? []).map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-[11px]">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : def.kind === "number" ? (
          <Input
            type="number"
            className="h-6 text-[11px]"
            value={String(value ?? def.default ?? 0)}
            min={def.min}
            max={def.max}
            step={def.step}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        ) : (
          <Input className="h-6 text-[11px]" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        )}
      </div>
    </div>
  );
}
