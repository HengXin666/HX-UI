"use client";

import type { JSX } from "react";
import { Handle, Position, type NodeProps, type EdgeProps, getBezierPath } from "@xyflow/react";
import { cn } from "../primitives/utils";
import { PinShape } from "./PinShape";
import { PortRow, ParamField } from "./node-parts";
import { NODE_KIND_TITLE } from "./types";
import type { RfNode } from "./rf-adapter";
import { handleId } from "./rf-adapter";

/**
 * React Flow 的自定义节点 / 连线 —— **UE5 外观在这一层**, 不在别处。
 *
 * ## 这一层负责什么
 *
 * 只负责"长什么样": 标题栏分类色、引脚形状与配色、端口行、参数控件。
 * **所有交互 (拖拽/缩放/框选/连线/选中) 都由 React Flow 提供**, 我们一行
 * 都不写 —— 那正是这次换库要买的东西。
 *
 * ## Handle 的位置约定
 *
 * React Flow 的 Handle 是**绝对定位在节点边缘**的。要让线端点对准我们画
 * 的引脚圆点, 必须让两者的位置一致: 输入在左边界、输出在右边界,
 * 纵向按 PORT_ROW 排。所以这里用 inline style 精确摆, 不用 CSS 类 ——
 * 差 1px 线就会离开圆点。
 */

const PORT_ROW = 20;
const HEADER_H = 30;
const BODY_TOP = HEADER_H + 8;

/** 端口在图坐标里相对节点顶部的 y —— 必须与 geometry.portPos 的公式一致。 */
function portY(index: number): number {
  return BODY_TOP + index * PORT_ROW + PORT_ROW / 2;
}

export function BpNode({ data, selected }: NodeProps<RfNode>): JSX.Element {
  const tone = NODE_KIND_TITLE[data.kind] ?? NODE_KIND_TITLE.default;
  const title = data.title;

  return (
    <div
      data-node-kind={data.kind}
      className={cn("overflow-hidden border border-bp-node-border bg-bp-node-bg text-foreground")}
      style={{
        borderRadius: "var(--bp-node-radius)",
        boxShadow: selected
          ? "var(--bp-node-shadow), 0 0 0 2px var(--bp-selected)"
          : "var(--bp-node-shadow)",
        width: data.width ?? 176,
      }}
    >
      {/* 标题栏: 按节点类别配色 */}
      <div
        className={cn("flex items-center gap-1.5 px-2", tone.bg, tone.fg)}
        style={{ height: HEADER_H }}
      >
        {/* 执行入口: 楔形, 画在标题栏左边 */}
        {/*
          执行入口。Handle 必须有**真实尺寸**才可被拖、被点 ——
          尺寸为 0 时它不可交互, 拖不出线也连不上。
          这里给 11px 的命中区域并设为透明, 视觉由 PinShape 决定。
        */}
        <Handle
          type="target"
          id={handleId("exec-in", "in")}
          position={Position.Left}
          style={{ top: HEADER_H / 2, left: -3, width: 11, height: 11 }}
          className="!border-0 !bg-transparent !opacity-0"
        />
        <span className="pointer-events-none">
          <PinShape kind="exec" filled color="text-bp-title-foreground" size={11} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{title}</span>
      </div>

      {!data.collapsed && (
        <div className="px-2 py-1.5">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              {(data.inputs ?? []).map((p, i) => (
                <div key={p.id} className="relative">
                  <Handle
                    type="target"
                    id={handleId(p.id, "in")}
                    position={Position.Left}
                    style={{ top: portY(i), left: -7, width: 12, height: 12 }}
                    className="!border-0 !bg-transparent !opacity-0"
                  />
                  <PortRow
                    dir="in"
                    port={p}
                    {...(p.color ? { color: p.color } : {})}
                    filled={data.filled?.[p.id]}
                    invalid={data.portErrors?.[p.id]}
                  />
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              {(data.outputs ?? []).map((p, i) => (
                <div key={p.id} className="relative">
                  <Handle
                    type="source"
                    id={handleId(p.id, "out")}
                    position={Position.Right}
                    style={{ top: portY(i), right: -7, width: 12, height: 12 }}
                    className="!border-0 !bg-transparent !opacity-0"
                  />
                  <PortRow dir="out" port={p} {...(p.color ? { color: p.color } : {})} filled />
                </div>
              ))}
            </div>
          </div>

          {(data.params ?? []).length > 0 && (
            <div className="mt-1.5 space-y-1.5 border-t border-border/50 pt-1.5">
              {(data.params ?? []).map((p) => (
                <ParamField
                  key={p.id}
                  def={p}
                  value={data.values?.[p.id] ?? p.default}
                  onChange={(v) => data.onParamChange?.(p.id, v)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 执行连线: 白色粗线 + 箭头 (UE5 官方: "white arrows")。
 *
 * 用 getBezierPath 拿 React Flow 自己算的路径 —— 不自己算, 否则缩放/平移
 * 时端点会漂。
 */
export function BpExecEdge({
  sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected,
}: EdgeProps): JSX.Element {
  const [path] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });
  const w = selected ? 3 : 2.2;
  return (
    <path
      d={path}
      fill="none"
      strokeWidth={w}
      className="stroke-foreground"
      markerEnd="url(#bp-exec-arrow)"
    />
  );
}

/** 数据连线: 细、按类型着色。 */
export function BpDataEdge({
  sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected,
}: EdgeProps): JSX.Element {
  const [path] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });
  const tint = (data as { tint?: string } | undefined)?.tint ?? "stroke-muted-foreground/70";
  return (
    <path d={path} fill="none" strokeWidth={selected ? 2.2 : 1.4} className={tint} />
  );
}

/**
 * 执行线箭头的 marker 定义。
 *
 * ⚠️ marker/defs/path 只能在 **<svg> 内部** —— 放到别处会被当成 HTML
 *    未知标签, 箭头不生效。所以这里渲染一个 0 尺寸的 svg 专门装 defs。
 *
 * 所以这里渲染一个自己的 <svg> (0 尺寸、绝对定位、不挡事), 只用来装 defs。
 */
export function ExecArrowMarker(): JSX.Element {
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      focusable="false"
    >
      <defs>
        <marker
          id="bp-exec-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L8,4 L0,8 z" className="fill-foreground" />
        </marker>
      </defs>
    </svg>
  );
}
