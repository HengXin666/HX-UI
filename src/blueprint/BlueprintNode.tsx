"use client";

import type { JSX } from "react";
import { cn } from "../primitives/utils";
import type { BlueprintRegistry, BlueprintNode } from "./types";
import { CARD_BORDER, NodePin, PortRow, ParamField, PIN_SIZE } from "./node-parts";
import { NodeRenameInput } from "./NodeRename";
import { execOutIds, execOutLabel } from "./connect";
import { EXEC } from "./types";
import { BODY_TOP, HEADER_H, NODE_WIDTH } from "./geometry";
import { nodeKindOf, titleStyle } from "./node-style";
import { PinShape } from "./PinShape";
import { HALF_DIVISOR } from "../constants";
import { BP_COLLAPSE_GLYPH, BP_EXEC_IN, BP_PIN_SPACER_CLASS, BP_PORT_DIR } from "../constants/blueprint";

/**
 * 节点卡片  外观对齐 UE5。
 *
 * ## 与 UE5 的对应关系 (只列有据可查的)
 *
 * - **标题栏按节点类别配色**: 事件红 / 函数蓝 / 纯函数绿 / 宏灰 / 流程紫 /
 * 转换青。UE5 里这是节点语义的第一眼信息, 不是装饰。
 * - **引脚未连接 = 空心轮廓, 已连接 = 实心**。Epic 官方明文, exec 与 data
 * 同规则。
 * - **执行引脚是楔形、尖端朝右**, 数据引脚是圆点。
 * - **选中态是一圈亮黄描边**  不用 primary (紫), 因为紫在蓝图里已经是
 * class 引脚的颜色, 会撞。
 * - **引脚行高 20px / 标题栏 28px**, 与 geometry.ts 的 PORT_ROW / HEADER_H
 * 同源。差一行就是 20px, 线端点会明显偏离圆点。
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
  /** 输出列行序 = [执行出口, 数据出口], 必须与 geometry.portPos 一致 */
  const outPorts = [
    ...execOuts.map((id) => ({ id, label: execOutLabel(def, id), type: EXEC })),
    ...(def.outputs ?? []),
  ];
  const colorOf = (type: string): { color?: string } => {
    const c = registry.typeColor(type);
    return c ? { color: c } : {};
  };

  return (
    <div
      data-node-kind={kind}
      className={cn(
        // 根节点不裁剪: 引脚有一半探出外边界; 圆角由标题条 / 底条各自按 rounded-[inherit] 收边
        "relative overflow-visible border text-foreground",
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
        标题条。执行入口画在它左边  与"被触发的那一端"的语义对齐。
        高度取 UE5 源码常量 EstimatedExecutionPinHeight = 28。
      */}
      <div
        data-slot="bp-title"
        // 根节点不裁剪, 标题条底色自己按根节点的圆角收边 (折叠态它就是整张卡, 四角都要圆)
        className={cn("flex items-center gap-1.5 px-2", isCollapsed ? "rounded-[inherit]" : "rounded-t-[inherit]", tone.bg, tone.fg)}
        style={{ height: "var(--bp-title-h)" }}
      >
        {/* 引脚脱离文档流后, 标题要让出半个引脚的位置, 否则文字会压在楔形上 */}
        {def.execIn && <span aria-hidden className={BP_PIN_SPACER_CLASS} style={{ width: PIN_SIZE.exec / HALF_DIVISOR }} />}
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

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 rounded px-1 text-[11px] opacity-70 transition-opacity hover:opacity-100"
            aria-label={isCollapsed ? "展开" : "折叠"}
          >
            {isCollapsed ? BP_COLLAPSE_GLYPH.collapsed : BP_COLLAPSE_GLYPH.expanded}
          </button>
        )}
      </div>

      {/*
        pt 取 BODY_TOP - HEADER_H - CARD_BORDER: 端口行必须从 geometry.portPos 假设的
        高度开始, 差 1px 每个端口就整体偏 1px, 表现是线擦着圆点过去。
      */}
      {!isCollapsed && (
        <div className="px-2 pb-1.5" style={{ paddingTop: BODY_TOP - HEADER_H - CARD_BORDER }}>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              {(def.inputs ?? []).map((p) => (
                <PortRow key={p.id} dir="in" port={p} showPin={false} hot={dropTarget?.[p.id]} />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              {outPorts.map((p) => (
                <PortRow key={p.id} dir="out" port={p} showPin={false} hot={dropTarget?.[p.id]} />
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
        UE5 节点的底部有一条**略深于节点体**的横条  它不承载信息,
        只是给节点一个"收尾", 让卡片看起来是压在画布上的一块实体,
        而不是一个开口的框. 缺了它, 节点底部会显得散.
      */}
      {!isCollapsed && (
        <div
          aria-hidden
          className="h-[3px] w-full rounded-b-[inherit] bg-foreground/[0.07]"
          style={{ backgroundColor: "color-mix(in srgb, var(--bp-node-border) 55%, transparent)" }}
        />
      )}

      {/*
        视觉引脚挂在根节点下: 圆心压在外边界上, 一半在卡片外, 不能被裁.
        折叠态没有端口区, 但执行出口仍画在标题条中线  否则从它出去的执行线断在空气里.
      */}
      {def.execIn && <NodePin portId={BP_EXEC_IN} dir={BP_PORT_DIR.in} exec portRef={portRef} />}
      {isCollapsed && execOuts.length > 0 && (
        <NodePin portId={execOuts[execOuts.length - 1]} dir={BP_PORT_DIR.out} exec portRef={portRef} />
      )}
      {!isCollapsed && (def.inputs ?? []).map((p, i) => (
        <NodePin key={`in:${p.id}`} portId={p.id} dir={BP_PORT_DIR.in} exec={p.type === EXEC} row={i} {...colorOf(p.type)}
          invalid={portErrors?.[p.id]} portRef={portRef} />
      ))}
      {!isCollapsed && outPorts.map((p, i) => (
        <NodePin key={`out:${p.id}`} portId={p.id} dir={BP_PORT_DIR.out} exec={p.type === EXEC} row={i} {...colorOf(p.type)} portRef={portRef} />
      ))}
    </div>
  );
}
