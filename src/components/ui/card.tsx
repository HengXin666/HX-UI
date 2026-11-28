"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CardProps = React.ComponentProps<"div"> & {
  /** 卡片特效: spotlight 指针光斑, beam 沿边框流动的光 (用来标出推荐项) */
  effect?: "none" | "spotlight" | "beam"
  /** 特效颜色, 任意 CSS 颜色; 光斑建议带透明度 */
  effectColor?: string
}

function Card({ className, effect = "none", effectColor, style, onPointerMove, onPointerLeave, children, ...props }: CardProps) {
  const spot = effect === "spotlight"
  const vars = effectColor ? { [spot ? "--spot-color" : "--beam-color"]: effectColor } : {}
  return (
    <div
      data-slot="card"
      data-effect={effect === "none" ? undefined : effect}
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
        effect !== "none" && "relative overflow-hidden",
        spot && "hx-spotlight [&>*]:relative",
        className
      )}
      style={{ ...vars, ...style } as React.CSSProperties}
      onPointerMove={spot ? (e) => {
        // 只写 CSS 变量, 不触发重渲染
        const el = e.currentTarget
        const r = el.getBoundingClientRect()
        el.style.setProperty("--mx", `${e.clientX - r.left}px`)
        el.style.setProperty("--my", `${e.clientY - r.top}px`)
        el.style.setProperty("--spot-opacity", "1")
        onPointerMove?.(e)
      } : onPointerMove}
      onPointerLeave={spot ? (e) => {
        e.currentTarget.style.setProperty("--spot-opacity", "0")
        onPointerLeave?.(e)
      } : onPointerLeave}
      {...props}
    >
      {children}
      {effect === "beam" && <span aria-hidden className="hx-beam animate-beam" />}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
