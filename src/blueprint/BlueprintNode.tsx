"use client";

import type { JSX } from "react";
import { cn } from "../primitives/utils";
import type { BlueprintRegistry, BlueprintNode } from "./types";
import { PortRow, ParamField } from "./node-parts";
import { NodeRenameInput } from "./NodeRename";
import { execOutIds, execOutLabel } from "./connect";
import { EXEC } from "./types";
import { NODE_WIDTH } from "./geometry";
import { nodeKindOf, titleStyle } from "./node-style";
import { PinShape } from "./PinShape";

/**
 * 节点卡片 —— 外观对齐 UE5。
 *
 * ## 与 UE5 的对应关系 (只列有据可查的)
 *
 *   - **标题栏按节点类别配色**: 事件红 / 函数蓝 / 纯函数绿 / 宏灰 / 流程紫 /
 *     转换青。UE5 里这是节点语义的第一眼信息, 不是装饰。
 *   - **引脚未连接 = 空心轮廓, 已连接 = 实心**。Epic 官方明文, exec 与 data
 *     同规则。
 *   - **执行引脚是楔形、尖端朝右**, 数据引脚是圆点。
 *   - **选中态是一圈亮黄描边** —— 不用 primary (紫), 因为紫在蓝图里已经是
 *     class 引脚的颜色, 会撞。
 *   - **引脚行高 20px / 标题栏 28px**, 与 geometry.ts 的 PORT_ROW / HEADER_H
 *     同源。差一行就是 20px, 线端点会明显偏离圆点。
 *
 * ## 一条硬约定
 *
 * 卡片**不处理拖拽**: 位置由画布用 transform 摆。这样同一份卡片在缩略图、
 * 导出图里也能复用, 而不用重新实现一遍交互。
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
  /** 拖线预览中: 这个端口是不是当前悬停的合法目标。 */
  readonly dropTarget?: Readonly<Record<string, boolean>>;
  /** F2 重命名中。给了就渲染成输入框。 */
  readonly renaming?: boolean;
  readonly onRenameCommit?: (next: string) => void;
  readonly onRenameCancel?: () => void;
}

export function BlueprintNodeCard({
  registry, node, selected, connected, portErrors, collapsed,
  onToggleCollapse, onParamChange, className, portRef, dropTarget,
  renaming, onRenameCommit, onRenameCancel,
}: BlueprintNodeCardProps): JSX.Element {
  const def = registry.nodeTypes.get(node.type);
  const isCollapsed = collapsed ?? node.collapsed ?? def?.collapsed ?? false;
  const execOuts = execOutIds(def);
  const title = node.title ?? def?.label ?? node.type;
  const hasError = !!portErrors && Object.keys(portErrors).length > 0;

  // 未注册类型: 画一个明确的"未知"卡片, 而不是崩溃或留白
  if (!def) {
    return (
      <div
        className={cn(
          "rounded-md border border-destructive/60 bg-card px-2.5 py-2 shadow-sm",
          className
        )}
      >
        <div className="text-[12px] font-medium text-destructive">未知节点</div>
        <div className="text-[11px] text-muted-foreground">{node.type}</div>
      </div>
    );
  }

  const kind = nodeKindOf(def, node);
  const tone = titleStyle(kind);
  const width = node.width ?? def.width ?? NODE_WIDTH;

  return (
    <div
      data-node-kind={kind}
      className={cn(
        "overflow-hidden border text-foreground",
        // UE5 的节点体是深色块 + 近黑描边 + 阴影; 圆角比卡片小 (6px)
        "border-bp-node-border bg-bp-node-bg",
        hasError && "border-destructive/70",
        className
      )}
      style={{
        borderRadius: "var(--bp-node-radius)",
        boxShadow: selected ? "var(--bp-node-shadow), 0 0 0 2px var(--bp-selected)" : "var(--bp-node-shadow)",
        width,
      }}
    >
      {/*
        标题条。执行入口画在它左边 —— 与"被触发的那一端"的语义对齐。
        高度取 UE5 源码常量 EstimatedExecutionPinHeight = 28。
      */}
      <div
        className={cn("flex items-center gap-1.5 px-2", tone.bg, tone.fg)}
        style={{ height: "var(--bp-title-h)" }}
      >
        {def.execIn && (
          <span
            ref={(el) => portRef?.("exec-in", "in", el)}
            data-port="exec-in"
            data-dir="in"
            className="flex shrink-0 items-center"
          >
            <PinShape kind="exec" filled color="text-bp-title-foreground" size={11} />
          </span>
        )}
        {def.icon ? <span className="shrink-0 opacity-80">{def.icon}</span> : null}
        {renaming ? (
          <NodeRenameInput
            value={title}
            onCommit={(v) => onRenameCommit?.(v)}
            onCancel={() => onRenameCancel?.()}
          />
        ) : (
          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{title}</span>
        )}

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
            className="flex shrink-0 items-center"
          >
            <PinShape kind="exec" filled color="text-bp-title-foreground" size={11} />
          </span>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 rounded px-1 text-[11px] opacity-70 transition-opacity hover:opacity-100"
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
                  {...(registry.typeColor(p.type) ? { color: registry.typeColor(p.type) } : {})}
                  filled={connected?.[p.id]}
                  invalid={portErrors?.[p.id]}
                  portRef={portRef}
                  hot={dropTarget?.[p.id]}
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
                  filled
                  portRef={portRef}
                  hot={dropTarget?.[id]}
                />
              ))}
              {(def.outputs ?? []).map((p) => (
                <PortRow
                  key={p.id}
                  dir="out"
                  port={p}
                  {...(registry.typeColor(p.type) ? { color: registry.typeColor(p.type) } : {})}
                  filled
                  portRef={portRef}
                  hot={dropTarget?.[p.id]}
                />
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

      {/*
        UE5 节点的底部有一条**略深于节点体**的横条 —— 它不承载信息,
        只是给节点一个"收尾", 让卡片看起来是压在画布上的一块实体,
        而不是一个开口的框。缺了它, 节点底部会显得散。
      */}
      {!isCollapsed && (
        <div
          aria-hidden
          className="h-[3px] w-full bg-foreground/[0.07]"
          style={{ backgroundColor: "color-mix(in srgb, var(--bp-node-border) 55%, transparent)" }}
        />
      )}
    </div>
  );
}
