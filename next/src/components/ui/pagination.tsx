import * as React from "react"
import { cn } from "@/lib/utils"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { buttonVariants, type Button } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="分页"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="上一页"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">上一页</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="下一页"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">下一页</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">更多页</span>
    </span>
  )
}

/**
 * 算出要显示的页码: 首尾常驻, 当前页左右各 siblings 个, 其余折成省略号.
 * 返回如 [1, "…", 4, 5, 6, "…", 20]
 */
export function getPageItems(page: number, pageCount: number, siblings = 1): (number | "…")[] {
  const total = siblings * 2 + 5
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const left = Math.max(page - siblings, 1)
  const right = Math.min(page + siblings, pageCount)
  const showL = left > 3
  const showR = right < pageCount - 2
  if (!showL) return [...Array.from({ length: 3 + siblings * 2 }, (_, i) => i + 1), "…", pageCount]
  if (!showR) return [1, "…", ...Array.from({ length: 3 + siblings * 2 }, (_, i) => pageCount - (2 + siblings * 2) + i)]
  return [1, "…", ...Array.from({ length: right - left + 1 }, (_, i) => left + i), "…", pageCount]
}

export interface PaginationBarProps extends Omit<React.ComponentProps<"nav">, "onChange"> {
  page: number
  /** 总条数 */
  total: number
  pageSize?: number
  onPageChange: (page: number) => void
  siblings?: number
  /** 左侧显示 "第 21–40 条, 共 386 条" */
  showRange?: boolean
}

/** 一行搞定的分页: 传页码和总数, 省略号, 首尾页, 上下页都算好 */
function PaginationBar({ page, total, pageSize = 20, onPageChange, siblings = 1, showRange = true, className, ...props }: PaginationBarProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const go = (p: number) => (e: React.MouseEvent) => { e.preventDefault(); if (p >= 1 && p <= pageCount && p !== page) onPageChange(p) }
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <div data-slot="pagination-bar" className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {showRange && <p className="text-sm text-muted-foreground tabular-nums">第 {from}–{to} 条，共 {total.toLocaleString("zh-CN")} 条</p>}
      <Pagination className="mx-0 w-auto" {...props}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={go(page - 1)} aria-disabled={page <= 1 || undefined} className={cn(page <= 1 && "pointer-events-none opacity-50")} tabIndex={page <= 1 ? -1 : undefined} />
          </PaginationItem>
          {getPageItems(page, pageCount, siblings).map((it, i) => (
            <PaginationItem key={i} className={cn(it !== page && "max-sm:hidden")}>
              {it === "…" ? <PaginationEllipsis /> : <PaginationLink href="#" isActive={it === page} onClick={go(it)} aria-label={`第 ${it} 页`} className="tabular-nums">{it}</PaginationLink>}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="#" onClick={go(page + 1)} aria-disabled={page >= pageCount || undefined} className={cn(page >= pageCount && "pointer-events-none opacity-50")} tabIndex={page >= pageCount ? -1 : undefined} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export {
  PaginationBar,
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
