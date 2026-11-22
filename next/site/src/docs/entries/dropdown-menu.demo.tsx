import * as React from "react";
import { Copy, MoreHorizontal, Pencil, Share2, Trash2, Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DemoProps } from "../types";

/** 真实场景: 文件列表一行末尾的 "更多" 菜单 */
export default function DropdownDemo({ values }: DemoProps) {
  const [pinned, setPinned] = React.useState(true);
  const [perm, setPerm] = React.useState("view");
  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border bg-background/85 p-4 shadow-float backdrop-blur">
      <span className="grid size-10 place-items-center rounded-lg bg-accent font-mono text-xs">PDF</span>
      <div className="flex-1">
        <p className="text-sm font-medium">2026Q4 对账单.pdf</p>
        <p className="text-[13px] text-muted-foreground">2.4 MB · 林晓 编辑于 17:20</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="更多操作"><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={values.align as "end"} className="w-52">
          {values.label ? <DropdownMenuLabel>文件</DropdownMenuLabel> : null}
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => toast("开始重命名")}><Pencil />重命名{values.shortcuts ? <DropdownMenuShortcut>F2</DropdownMenuShortcut> : null}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("已复制链接")}><Copy />复制链接{values.shortcuts ? <DropdownMenuShortcut>⌘C</DropdownMenuShortcut> : null}</DropdownMenuItem>
            {values.sub ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Share2 />共享权限</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={perm} onValueChange={setPerm}>
                    <DropdownMenuRadioItem value="view">可查看</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="comment">可评论</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="edit">可编辑</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : null}
            <DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>置顶</DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => toast("已归档")}><Archive />归档</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => toast.error("已删除")}><Trash2 />删除{values.shortcuts ? <DropdownMenuShortcut>⌫</DropdownMenuShortcut> : null}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
