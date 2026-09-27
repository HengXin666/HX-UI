import { useState, type JSX } from "react";
import {
  Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@hx/ui";
import { H2, H3, P, Preview, PropsTable } from "../components/DocKit";

/**
 * DropdownMenu 页。
 *
 * 面板圆角是 xl (与 Select 的 lg 不同), 项是 py-2 的 13px —— 比 Select 项大一号。
 * 子菜单箭头是硬编码的 solar 图标, 由本页 import 的库源码带进来, 不用自己登记。
 */
export function DropdownMenuPage(): JSX.Element {
  const [sort, setSort] = useState("time");
  const [theme, setTheme] = useState("dark");

  return (
    <>
      <P>
        面板 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">rounded-xl</code>,
        最小宽 10rem, 项内边距 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">px-3 py-2</code>,
        键盘高亮与鼠标 hover 都落在 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-accent/60</code> 上。
      </P>

      <H2>基础</H2>
      <P>触发器几乎总是 "图标按钮 + asChild", 因为菜单项的语义由 Menu 提供, 按钮本身不需要再写文字。</P>
      <Preview
        align="start"
        code={`<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="会话操作">
      <span className="icon-[solar--menu-dots-bold] size-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start" className="w-44">
    <DropdownMenuLabel>会话</DropdownMenuLabel>
    <DropdownMenuItem>重命名</DropdownMenuItem>
    <DropdownMenuItem>导出为 Markdown</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="会话操作">
              <span className="icon-[solar--menu-dots-bold] size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>会话</DropdownMenuLabel>
            <DropdownMenuItem>重命名</DropdownMenuItem>
            <DropdownMenuItem>导出为 Markdown</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">菜单按钮</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44">
            <DropdownMenuItem disabled>禁用项</DropdownMenuItem>
            <DropdownMenuItem>可用项</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Preview>

      <H2>单选</H2>
      <P>
        用 RadioGroup 包一组 RadioItem, 对勾由 ItemIndicator 画在项内部右侧 (项自带
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> pr-8</code>)。
      </P>
      <Preview
        align="start"
        code={`const [sort, setSort] = useState("time");

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">排序: {sort === "time" ? "时间" : "名称"}</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-44">
    <DropdownMenuLabel>排序方式</DropdownMenuLabel>
    <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
      <DropdownMenuRadioItem value="time">按更新时间</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="name">按名称</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">排序: {sort === "time" ? "时间" : "名称"}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44">
            <DropdownMenuLabel>排序方式</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
              <DropdownMenuRadioItem value="time">按更新时间</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name">按名称</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Preview>

      <H2>子菜单</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">DropdownMenuSubTrigger</code> 会在末尾自动补一个向右箭头 (靠
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> ml-auto</code> 推到最右),
        所以不要在子项里再手写箭头。SubContent 是独立 portal, 默认向右展开、间距 4px。
      </P>
      <Preview
        align="start"
        code={`<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">更多</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-48">
    <DropdownMenuItem>复制链接</DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>导出格式</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-44">
        <DropdownMenuItem>Markdown</DropdownMenuItem>
        <DropdownMenuItem>JSON</DropdownMenuItem>
        <DropdownMenuItem>纯文本</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>移动到</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-44">
        <DropdownMenuItem>工作区 A</DropdownMenuItem>
        <DropdownMenuItem>工作区 B</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">更多</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem>复制链接</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>导出格式</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuItem>Markdown</DropdownMenuItem>
                <DropdownMenuItem>JSON</DropdownMenuItem>
                <DropdownMenuItem>纯文本</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>移动到</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuItem>工作区 A</DropdownMenuItem>
                <DropdownMenuItem>工作区 B</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="外观">
              <span className="icon-[solar--palette-linear] size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44">
            <DropdownMenuLabel>外观</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">浅色</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">深色</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="auto">跟随系统</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Preview>

      <H2>属性</H2>
      <H3>DropdownMenuContent / DropdownMenuSubContent</H3>
      <PropsTable
        rows={[
          { name: "sideOffset", type: "number", default: "6 (Content) / 4 (SubContent)", desc: "与触发器或父项的间距。" },
          { name: "align", type: '"start" | "center" | "end"', desc: "相对触发器的对齐。" },
          { name: "className", type: "string", desc: "常用 w-44 / w-48 定宽度, 最小宽 10rem。" },
        ]}
      />
      <H3>DropdownMenuItem / RadioItem / SubTrigger</H3>
      <PropsTable
        rows={[
          { name: "disabled", type: "boolean", default: "false", desc: "禁用; 透明度 50% 且不响应指针。" },
          { name: "inset", type: "boolean", desc: "给无图标项左侧留出与图标项对齐的缩进。" },
          { name: "value (RadioItem)", type: "string", desc: "单选组的取值。" },
          { name: "onSelect", type: "(event: Event) => void", desc: "选中时回调。用 event.preventDefault() 可以阻止菜单关闭。" },
        ]}
      />
      <H3>DropdownMenuLabel / Separator</H3>
      <PropsTable
        rows={[
          { name: "DropdownMenuLabel", type: "div props", desc: "11px 静默色分组名, 不参与键盘导航。" },
          { name: "DropdownMenuSeparator", type: "div props", desc: "1px 分隔线, 左右负边距到面板边缘。" },
        ]}
      />
    </>
  );
}
