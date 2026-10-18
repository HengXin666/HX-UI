import { type JSX } from "react";
import {
  AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BadgeCheckIcon, BoldIcon, ChevronDownIcon, ChevronRightIcon,
  ItalicIcon, MinusIcon, PlusIcon, UnderlineIcon,
} from "lucide-react";
import { ALIGN, AspectRatio, Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, Badge, Button, ButtonGroup, ButtonGroupSeparator, ButtonGroupText, DOC, DOC_SAMPLE, Input, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle, ORIENTATION, SELECT_MODE, SIDE, SIZE, TONE_VARIANT, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, Toggle, ToggleGroup, ToggleGroupItem, VARIANT } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 展示与布局类文档页: AspectRatio, Avatar, ButtonGroup, Toggle, ToggleGroup, Item, Table. */
export function AspectRatioPage(): JSX.Element {
  return (
    <>
      <P>固定宽高比容器: ratio 取宽 / 高. 子元素铺满容器, 图片配 object-cover 即可裁切而不变形.</P>
      <Usage names={["AspectRatio"]} />
      <H2>示例</H2>
      <Preview code={`<AspectRatio ratio={16 / 9} className="overflow-hidden rounded-xl border">
  <div className="grid size-full place-items-center bg-muted">16 : 9</div>
</AspectRatio>`}>
        <div className={DOC.widthMd}>
          <AspectRatio ratio={DOC_SAMPLE.wideRatio} className="overflow-hidden rounded-xl border border-border/60">
            <div className="grid size-full place-items-center bg-[linear-gradient(135deg,var(--muted),var(--secondary))] text-[13px] text-muted-foreground">16 : 9</div>
          </AspectRatio>
        </div>
      </Preview>
    </>
  );
}

export function AvatarPage(): JSX.Element {
  return (
    <>
      <P>头像: 图片加载成功前显示 AvatarFallback, 图片到达后淡入. 三档尺寸; AvatarGroup 叠放并在悬停时轻微上浮; AvatarBadge 是右下角状态点.</P>
      <Usage names={["Avatar", "AvatarImage", "AvatarFallback", "AvatarBadge", "AvatarGroup", "AvatarGroupCount"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<Avatar>
  <AvatarImage src="https://github.com/HengXin666.png" alt="@HengXin666" />
  <AvatarFallback>HX</AvatarFallback>
</Avatar>
<Avatar size="lg"><AvatarFallback>LH</AvatarFallback><AvatarBadge /></Avatar>
<AvatarGroup>
  <Avatar>...</Avatar>
  <AvatarGroupCount>+3</AvatarGroupCount>
</AvatarGroup>`}>
        <Avatar>
          <AvatarImage src="https://github.com/HengXin666.png" alt="@HengXin666" />
          <AvatarFallback>HX</AvatarFallback>
        </Avatar>
        <Avatar size={VARIANT.sm}>
          <AvatarFallback>S</AvatarFallback>
        </Avatar>
        <Avatar size={SIZE.lg}>
          <AvatarFallback>LH</AvatarFallback>
          <AvatarBadge />
        </Avatar>
        <AvatarGroup>
          {["A", "B", "C"].map((name) => (
            <Avatar key={name}>
              <AvatarFallback>{name}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
size ~ "sm" | "default" | "lg" ~ "default" ~ 24 / 32 / 40 px
AvatarBadge.className ~ string ~ bg-success ~ 状态点颜色用语义类传入
`} />
    </>
  );
}

export function ButtonGroupPage(): JSX.Element {
  return (
    <>
      <P>把相关的按钮, 输入框, 下拉触发器拼成一条, 相邻边框合并成一条 1px. 支持纵向; 嵌套 ButtonGroup 时组与组之间留间距.</P>
      <Usage names={["ButtonGroup", "ButtonGroupText", "ButtonGroupSeparator"]} />
      <H2>示例</H2>
      <Preview code={`<ButtonGroup>
  <Button>归档</Button>
  <Button>报告</Button>
  <Button size="icon"><ChevronDownIcon /></Button>
</ButtonGroup>
<ButtonGroup>
  <ButtonGroupText>https://</ButtonGroupText>
  <Input placeholder="example.com" />
</ButtonGroup>`}>
        <ButtonGroup>
          <Button>归档</Button>
          <Button>报告</Button>
          <Button size={VARIANT.icon} aria-label="更多">
            <ChevronDownIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroup>
            <Button size={VARIANT.icon} aria-label="减少"><MinusIcon /></Button>
            <Button size={VARIANT.icon} aria-label="增加"><PlusIcon /></Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button variant={VARIANT.primary}>保存</Button>
            <ButtonGroupSeparator />
            <Button variant={VARIANT.primary} size={VARIANT.icon} aria-label="保存选项"><ChevronDownIcon /></Button>
          </ButtonGroup>
        </ButtonGroup>
        <ButtonGroup className="w-full max-w-sm">
          <ButtonGroupText>https://</ButtonGroupText>
          <Input placeholder="example.com" />
          <Button>访问</Button>
        </ButtonGroup>
        <ButtonGroup orientation={ORIENTATION.vertical}>
          <Button>上</Button>
          <Button>中</Button>
          <Button>下</Button>
        </ButtonGroup>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
orientation ~ "horizontal" | "vertical" ~ "horizontal" ~ 排列方向
ButtonGroupSeparator ~ - ~ - ~ 两个无边框按钮之间的分隔线
`} />
    </>
  );
}

export function TogglePage(): JSX.Element {
  return (
    <>
      <P>两态按钮 (按下 / 弹起). 按下态用 accent 底 + 前景文字, 不用主色实底, 工具条里一排按下的蓝块太抢眼. 默认带点按水波纹.</P>
      <Usage names={["Toggle"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<Toggle aria-label="加粗"><BoldIcon /></Toggle>
<Toggle variant="outline" aria-label="斜体"><ItalicIcon /></Toggle>
<Toggle defaultPressed><UnderlineIcon /> 下划线</Toggle>`}>
        <Toggle aria-label="加粗"><BoldIcon /></Toggle>
        <Toggle variant={TONE_VARIANT.outline} aria-label="斜体"><ItalicIcon /></Toggle>
        <Toggle defaultPressed><UnderlineIcon /> 下划线</Toggle>
        <Toggle size={VARIANT.sm} disabled>不可用</Toggle>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
pressed / defaultPressed ~ boolean ~ - ~ 受控 / 非受控按下态
onPressedChange ~ (pressed) => void ~ - ~ 切换回调
variant ~ "default" | "outline" ~ "default" ~ 外观
size ~ "sm" | "default" | "lg" ~ "default" ~ 尺寸
ripple ~ boolean ~ true ~ 点按水波纹
`} />
    </>
  );
}

export function ToggleGroupPage(): JSX.Element {
  return (
    <>
      <P>
        一组两态按钮: type=single 单选 (可取消), type=multiple 多选. variant / size 由组下发. spacing 为 0 时贴合成一条.
        与 SegmentedControl 的区别: 那个是 "切视图" 且必有一项选中, 这个是 "开关若干个状态".
      </P>
      <Usage names={["ToggleGroup", "ToggleGroupItem"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<ToggleGroup type="multiple" variant="outline">
  <ToggleGroupItem value="bold"><BoldIcon /></ToggleGroupItem>
  <ToggleGroupItem value="italic"><ItalicIcon /></ToggleGroupItem>
</ToggleGroup>
<ToggleGroup type="single" defaultValue="left" spacing={1}>...</ToggleGroup>`}>
        <ToggleGroup type={SELECT_MODE.multiple} variant={TONE_VARIANT.outline} defaultValue={["bold"]}>
          <ToggleGroupItem value="bold" aria-label="加粗"><BoldIcon /></ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="斜体"><ItalicIcon /></ToggleGroupItem>
          <ToggleGroupItem value="under" aria-label="下划线"><UnderlineIcon /></ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type={SELECT_MODE.single} defaultValue={SIDE.left} spacing={1}>
          <ToggleGroupItem value={SIDE.left} aria-label="左对齐"><AlignLeftIcon /></ToggleGroupItem>
          <ToggleGroupItem value={ALIGN.center} aria-label="居中"><AlignCenterIcon /></ToggleGroupItem>
          <ToggleGroupItem value={SIDE.right} aria-label="右对齐"><AlignRightIcon /></ToggleGroupItem>
        </ToggleGroup>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
type ~ "single" | "multiple" ~ - ~ 单选或多选 (必填)
value / defaultValue ~ string | string[] ~ - ~ 受控 / 非受控
variant / size ~ 同 Toggle ~ "default" ~ 下发给每一项
spacing ~ number ~ 0 ~ 项间距 (Tailwind 间距档), 0 时贴合
`} />
    </>
  );
}

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
