import { Slash } from "lucide-react";
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { DemoProps } from "../types";

/** 真实场景: 后台详情页顶部. 层级深时中间折叠进下拉 */
export default function BreadcrumbDemo({ values }: DemoProps) {
  const sep = values.separator === "slash" ? <BreadcrumbSeparator><Slash /></BreadcrumbSeparator> : <BreadcrumbSeparator />;
  const stop = (e: React.MouseEvent) => e.preventDefault();
  return (
    <div className="w-full max-w-xl rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="#" onClick={stop}>工作台</BreadcrumbLink></BreadcrumbItem>
          {sep}
          {values.collapse ? (
            <>
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" aria-label="展开中间层级">
                    <BreadcrumbEllipsis className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>订单中心</DropdownMenuItem>
                    <DropdownMenuItem>华东仓</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
              {sep}
            </>
          ) : (
            <>
              <BreadcrumbItem><BreadcrumbLink href="#" onClick={stop}>订单中心</BreadcrumbLink></BreadcrumbItem>
              {sep}
              <BreadcrumbItem><BreadcrumbLink href="#" onClick={stop}>华东仓</BreadcrumbLink></BreadcrumbItem>
              {sep}
            </>
          )}
          <BreadcrumbItem><BreadcrumbPage>TL-20518</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <p className="mt-3 text-xl font-semibold tracking-tight">订单 TL-20518</p>
      <p className="mt-1 text-sm text-muted-foreground">林晓 · ¥1,280.00 · 待发货</p>
    </div>
  );
}
