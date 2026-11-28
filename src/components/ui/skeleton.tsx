import { cn } from "@/lib/utils"

/** 占位块. 外层容器加 aria-busy, 读屏不会念一堆空块 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-accent motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

export { Skeleton }
