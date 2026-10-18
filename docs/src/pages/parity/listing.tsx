import { type JSX } from "react";
import { BadgeCheckIcon, ChevronRightIcon } from "lucide-react";
import { Badge, Button, DOC_SAMPLE, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle, TONE_VARIANT, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, VARIANT } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 列表与表格类文档页: Item, Table (从 layout.tsx 拆出, 守住单文件行数上限). */
export function ItemPage(): JSX.Element {
  return (
    <>
      <P>列表条目: 左侧媒体, 中间标题与说明, 右侧操作. 多行放进 ItemGroup; 整行可点时用 asChild 包一个 a 或 button, 悬停底色由 Item 自己给.</P>
      <Usage names={["Item", "ItemGroup", "ItemMedia", "ItemContent", "ItemTitle", "ItemDescription", "ItemActions", "ItemSeparator"]} />
      <H2>示例</H2>
      <Preview code={`<Item variant="outline">
  <ItemMedia variant="icon"><BadgeCheckIcon /></ItemMedia>
  <ItemContent>
    <ItemTitle>邮箱已验证</ItemTitle>
    <ItemDescription>你可以接收通知了。</ItemDescription>
  </ItemContent>
  <ItemActions><Button size="sm">管理</Button></ItemActions>
</Item>`}>
        <div className="flex w-full max-w-md flex-col gap-4">
          <Item variant={TONE_VARIANT.outline}>
            <ItemMedia variant={VARIANT.icon}><BadgeCheckIcon /></ItemMedia>
            <ItemContent>
              <ItemTitle>邮箱已验证</ItemTitle>
              <ItemDescription>你可以接收部署与评审通知了.</ItemDescription>
            </ItemContent>
            <ItemActions><Button size={VARIANT.sm}>管理</Button></ItemActions>
          </Item>
          <ItemGroup className="rounded-xl border border-border">
            {[["HX-UI", "组件库"], ["HX-Jungle", "Agent 服务"]].map(([name, desc], index) => (
              <div key={name}>
                {index > 0 && <ItemSeparator />}
                <Item asChild size={VARIANT.sm}>
                  <a href="#/item">
                    <ItemContent>
                      <ItemTitle>{name} <Badge>{desc}</Badge></ItemTitle>
                    </ItemContent>
                    <ItemActions><ChevronRightIcon className="size-4 text-muted-foreground" /></ItemActions>
                  </a>
                </Item>
              </div>
            ))}
          </ItemGroup>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
variant ~ "default" | "outline" | "muted" ~ "default" ~ 外观
size ~ "default" | "sm" ~ "default" ~ 内边距
ItemMedia.variant ~ "default" | "icon" | "image" ~ "default" ~ 媒体位外观
asChild ~ boolean ~ false ~ 整行渲染为子元素 (链接 / 按钮)
`} />
    </>
  );
}

const INVOICES = [
  { id: "INV001", status: "已支付", method: "信用卡", amount: 250 },
  { id: "INV002", status: "待支付", method: "PayPal", amount: 150 },
  { id: "INV003", status: "未支付", method: "银行转账", amount: 350 },
];

/** 金额列: 右对齐, 等宽数字. */
const AMOUNT = "text-right tabular-nums";

export function TablePage(): JSX.Element {
  const total = INVOICES.reduce((sum, row) => sum + row.amount, 0);
  return (
    <>
      <P>表格原语: 只给语义元素加样式, 排序, 分页, 空态由调用方组合. 需要粘性表头, 空 / 加载态与行点击的完整数据表时用 DataTable.</P>
      <Usage names={["Table", "TableHeader", "TableBody", "TableFooter", "TableRow", "TableHead", "TableCell", "TableCaption"]} />
      <H2>示例</H2>
      <Preview code={`<Table>
  <TableCaption>最近的账单</TableCaption>
  <TableHeader>
    <TableRow><TableHead>编号</TableHead>...</TableRow>
  </TableHeader>
  <TableBody>
    {rows.map((row) => <TableRow key={row.id}>...</TableRow>)}
  </TableBody>
  <TableFooter>...</TableFooter>
</Table>`}>
        <Table>
          <TableCaption>最近的账单</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>编号</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>方式</TableHead>
              <TableHead className={AMOUNT}>金额</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-[12px]">{row.id}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.method}</TableCell>
                <TableCell className={AMOUNT}>${row.amount}.00</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={DOC_SAMPLE.invoiceLabelSpan}>合计</TableCell>
              <TableCell className={AMOUNT}>${total}.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Preview>
      <Callout title="与 DataTable 的分工">Table 是原语, DataTable 是成品; DataTable 内部同样是原生 table, 视觉一致.</Callout>
    </>
  );
}
