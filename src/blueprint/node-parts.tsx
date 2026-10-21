"use client";

import type { CSSProperties, JSX } from "react";
import { cn } from "../primitives/utils";
import { Input } from "../primitives/input";
import { Switch } from "../primitives/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../primitives/select";
import type { BlueprintRegistry, ParamDef, PortDef } from "./types";
import { EXEC } from "./types";
import { HEADER_H, PORT_ROW } from "./geometry";
import { PinShape } from "./PinShape";

/**
 * 节点卡片的零件: 引脚行 + 参数字段。
 *
 * 单独成文件是为了行预算 (BlueprintNode.tsx 上限 250), 但拆得也合理 
 * 这两块各自内聚, 与"卡片整体怎么摆"没有纠缠。
 */

/**
 * 引脚行高  **从 geometry 导入, 不重新声明**。
 *
 * 之前这里写死字面量 20, 与 geometry.PORT_ROW 构成两份真相。连线端点由
 * portPos 按 PORT_ROW 算, 卡片按 PORT_ROW_H 画, 两者一旦不等, 表现就是
 * "每根线都偏出圆点"  而且不报错、tsc 全绿。
 *
 * 现在从同一处导出, 改一处两边同时变; 另有 check-blueprint 的一条断言
 * 守着 CSS 变量与常量的相等关系。
 */
export const PORT_ROW_H = PORT_ROW;

/**
 * 引脚尺寸与"半个引脚在节点外"的落点。
 *
 * 连线端点由 geometry.portPos 算, 它把端点放在**节点边界上**(输入 x = node.x,
 * 输出 x = node.x + width)。要让线真的落进圆点, 圆点的**圆心**就必须正好在边界上,
 * 也就是引脚有一半探出卡片。
 *
 * 所以引脚不能当流内元素排: 流内位置取决于 px-2 内边距与前一兄弟的宽度, 任何一处
 * 调整都会让圆心离开边界几个像素, 表现是线从圆点旁边擦过去。这里改成绝对定位,
 * 偏移量只由引脚尺寸推出。
 *
 * CARD_BORDER 是卡片那 1px 边框: 绝对定位的参照是内边距盒, 比外边界往里缩了一个
 * 边框宽, 要额外补回来。
 */
export const PIN_SIZE = { exec: 10, data: 9 } as const;
export const CARD_BORDER = 1;
/**
 * 卡片体的左右内边距 (对应卡片上的 px-2)。
 *
 * 端口行自己是一个相对定位的盒子, 引脚再相对它绝对定位; 而圆心要落在**卡片**
 * 边界上, 所以偏移量里必须先扣掉卡片内边距这一段。改卡片内边距时必须同步这里,
 * 否则线会整体偏若干像素 -- 与 --bp-pin-row 那类常量是同一类陷阱。
 */
export const BODY_PAD_X = 8;

/**
 * 引脚圆心落在边界上时的水平偏移 (向内为负)。
 * .agents/notes/implemented/feature/2026-10-22-blueprint-pin-alignment.md
 */
export function pinOffset(size: number): number {
  return -(size / 2) - CARD_BORDER;
}

/**
 * 标题条中线上引脚的 top (相对卡片内边距盒)。
 *
 * geometry.portPos 把执行入口放在 node.y + HEADER_H / 2, 也就是离卡片**外边**
 * 半个标题条; 绝对定位的参照是内边距盒, 少了一个边框宽, 这里补回来。
 */
export function headerPinTop(size: number): number {
  return HEADER_H / 2 - CARD_BORDER - size / 2;
}

export function PortRow({
  dir, port, color, filled, invalid, portRef, hot, edgeInset = BODY_PAD_X,
}: {
  readonly dir: "in" | "out";
  readonly port: Pick<PortDef, "id" | "label" | "type">;
  /**
   * 引脚颜色类名 (bg-*)。
   *
   * 改成直接收颜色而不是收 registry: 节点组件拿不到 registry (它含函数,
   * 塞进 React Flow 的 data 会让节点 data 不可序列化且每帧换引用)。
   * 颜色在适配层预先算好带过来。
   */
  readonly color?: string;
  readonly filled?: boolean;
  readonly invalid?: boolean;
  readonly portRef?: (portId: string, dir: "in" | "out", el: HTMLElement | null) => void;
  /** 拖线悬停在这个口上且合法。 */
  readonly hot?: boolean;
  /** 行左/右边缘到卡片边界的距离, 默认等于卡片内边距。 */
  readonly edgeInset?: number;
}): JSX.Element {
  const isExec = port.type === EXEC;
  const size = isExec ? PIN_SIZE.exec : PIN_SIZE.data;
  const offset = pinOffset(size);
  return (
    <div
      className={cn("relative flex items-center gap-1.5", dir === "out" && "flex-row-reverse", hot && "bg-primary/10")}
      style={{ height: PORT_ROW_H }}
    >
      <span
        ref={(el) => portRef?.(port.id, dir, el)}
        data-port={port.id}
        data-dir={dir}
        className="absolute top-1/2 flex -translate-y-1/2 items-center justify-center"
        style={{ [dir === "in" ? "left" : "right"]: offset - edgeInset } as CSSProperties}
      >
        {isExec ? (
          <PinShape kind="exec" filled invalid={invalid} color="text-bp-title-foreground" size={size} />
        ) : (
          <PinShape kind="data" filled invalid={invalid} color={color} size={size} />
        )}
      </span>
      {/* 执行引脚不带文字  UE5 里它靠形状与位置自解释, 加标签反而挤 */}
      {!isExec && (
        <span className={cn("min-w-0 truncate text-[11px] text-muted-foreground", dir === "out" && "text-right")}>
          {port.label ?? port.id}
        </span>
      )}
    </div>
  );
}

/** 节点内的一个可编辑字段。声明式: 照 ParamDef.kind 渲染对应控件。 */
export function ParamField({
  def, value, onChange,
}: {
  readonly def: ParamDef;
  readonly value: unknown;
  readonly onChange: (v: unknown) => void;
}): JSX.Element {
  return (
    /**
     * 参数区**必须恢复文本选中**。
     *
     * 画布为了拖节点时不选中文字, 整体设了 user-select: none。但这个输入框
     * 就在画布里面  继承下来之后, 用户没法用鼠标选/拖选里面的数值,
     * 改参数变成只能靠键盘。所以这里显式恢复。
     *
     * 放在蓝图侧而不是改 primitives 的 Input: 那个组件全库共用,
     * 不该为画布这一个场景背上 select-text。
     */
    <div className="flex select-text items-center gap-2">
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
