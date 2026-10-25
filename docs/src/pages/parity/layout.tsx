import { type JSX } from "react";
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ChevronDownIcon, ItalicIcon, MinusIcon, PlusIcon, UnderlineIcon } from "lucide-react";
import { ALIGN, AspectRatio, Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, Button, ButtonGroup, ButtonGroupSeparator, ButtonGroupText, DOC, DOC_SAMPLE, Input, Item, ORIENTATION, SELECT_MODE, SIDE, SIZE, TONE_VARIANT, Table, Toggle, ToggleGroup, ToggleGroupItem, VARIANT } from "@hx/ui";
import { H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 展示与布局类文档页: AspectRatio, Avatar, ButtonGroup, Toggle, ToggleGroup (Item / Table 在 listing.tsx). */
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

export function ToggleGroupPage(): JSX.Element {
  return (
    <>
      <P>
        单个两态按钮 Toggle 与一组两态按钮 ToggleGroup 同页. 组: type=single 单选 (可取消), type=multiple 多选. variant / size 由组下发. spacing 为 0 时贴合成一条.
        与 SegmentedControl 的区别: 那个是 "切视图" 且必有一项选中, 这个是 "开关若干个状态".
      </P>
      <Usage names={["Toggle", "ToggleGroup", "ToggleGroupItem"]} />
      <H2>单个: Toggle</H2>
      <P>按下态用 accent 底 + 前景文字, 不用主色实底, 工具条里一排按下的蓝块太抢眼. 默认带点按水波纹.</P>
      <Preview align={ALIGN.center} code={`<Toggle aria-label="加粗"><BoldIcon /></Toggle>
<Toggle variant="outline" aria-label="斜体"><ItalicIcon /></Toggle>
<Toggle defaultPressed><UnderlineIcon /> 下划线</Toggle>`}>
        <Toggle aria-label="加粗"><BoldIcon /></Toggle>
        <Toggle variant={TONE_VARIANT.outline} aria-label="斜体"><ItalicIcon /></Toggle>
        <Toggle defaultPressed><UnderlineIcon /> 下划线</Toggle>
        <Toggle size={VARIANT.sm} disabled>不可用</Toggle>
      </Preview>
      <H2>一组: ToggleGroup</H2>
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
      <P>Toggle</P>
      <Props spec={`
pressed / defaultPressed ~ boolean ~ - ~ 受控 / 非受控按下态
onPressedChange ~ (pressed) => void ~ - ~ 切换回调
variant ~ "default" | "outline" ~ "default" ~ 外观
size ~ "sm" | "default" | "lg" ~ "default" ~ 尺寸
ripple ~ boolean ~ true ~ 点按水波纹
`} />
      <P>ToggleGroup</P>
      <Props spec={`
type ~ "single" | "multiple" ~ - ~ 单选或多选 (必填)
value / defaultValue ~ string | string[] ~ - ~ 受控 / 非受控
variant / size ~ 同 Toggle ~ "default" ~ 下发给每一项
spacing ~ number ~ 0 ~ 项间距 (Tailwind 间距档), 0 时贴合
`} />
    </>
  );
}
