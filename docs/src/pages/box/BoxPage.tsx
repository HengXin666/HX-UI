import type { JSX, ReactNode } from "react";
import { ALIGN, Badge, Button, TONE_VARIANT, VARIANT } from "@hx/ui";
import { AutoGrid, Center, Container, Grid, HStack, Section, Spacer, SplitView, Stack, VStack } from "../../../../src/box";
import { BOX_CLASS, BOX_DOC, BOX_FILL, BOX_STEP, BOX_PAGE_PROPS } from "../../../../src/constants/box";
import { DEMO_OVERVIEW_LABEL } from "../../../../src/constants/docs-demos";
import { H2, P, Preview, PropsTable, Callout, Code } from "../../components/DocKit";

/** 演示用的占位块. 只为让间距看得见, 不是产品样式. */
function Tile({ children }: { children: ReactNode }): JSX.Element {
  return <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{children}</div>;
}

/** 演示里循环出的条目. */
const ITEMS = ["构建", "测试", "部署", "监控", "回滚", "归档"] as const;
/** 间距档, 从小到大. */
const GAP_STEPS = [BOX_STEP.xs, BOX_STEP.sm, BOX_STEP.md, BOX_STEP.lg, BOX_STEP.xl] as const;
/** 预览框撑满. */
const FULL = BOX_CLASS.fullWidth;
/** 演示里的说明文字. */
const MUTED = BOX_CLASS.mutedText;
/** 小号描边按钮. */
const OUTLINE = { size: VARIANT.sm, variant: TONE_VARIANT.outline } as const;

/**
 * 布局原语文档页: Stack / Grid / Container / SplitView. Bento 单独一页 (BentoPage).
 *
 * .agents/notes/implemented/feature/2026-11-01-layout-box-primitives.md
 */
export function BoxPage(): JSX.Element {
  return (
    <>
      <P>
        页面里反复手写的 <Code>flex flex-col gap-*</Code>, <Code>mx-auto max-w-*</Code> 收成几个原语. 它们只接受档名,
        不接受任意值: 间距一套 (none / xs / sm / md / lg / xl / 2xl), 宽度一套 (prose / sm / md / lg / xl / full),
        整站的节奏因此只有一份.
      </P>
      <Callout title="档位从哪来">
        间距与 Section 留白档在 <Code>src/constants/box.ts</Code>, 宽度档是 Container 导出的 <Code>BOX_WIDTH</Code>.
        Stack, Grid, AutoGrid, Bento 用同一个 gap 档, Container, Section, Center 用同一个宽度档.
      </Callout>

      <H2>Stack / HStack / VStack</H2>
      <P>VStack 竖排并默认撑满宽度; HStack 横排并默认纵向居中. Spacer 把后面的子项推到另一端.</P>
      <Preview
        align={ALIGN.stretch}
        code={`<VStack gap="sm">
  <HStack gap="sm">
    <Badge>v0.5</Badge>
    <span>发布说明</span>
    <Spacer />
    <Button size="sm" variant="outline">查看</Button>
  </HStack>
  <Stack direction="row" gap="xs" wrap>{tags}</Stack>
</VStack>`}
      >
        <VStack gap={BOX_STEP.sm} className={FULL}>
          <HStack gap={BOX_STEP.sm}>
            <Badge>v0.5</Badge>
            <span className="text-sm text-foreground">发布说明</span>
            <Spacer />
            <Button {...OUTLINE}>查看</Button>
          </HStack>
          <Stack direction="row" gap={BOX_STEP.xs} wrap>
            {ITEMS.map((item) => (
              <Tile key={item}>{item}</Tile>
            ))}
          </Stack>
        </VStack>
      </Preview>

      <H2>同一套间距档</H2>
      <P>每一行是同样三个块, 只换 gap 档. 档位按 4px 基数递增, 不提供 gap-[13px] 这类逃生口.</P>
      <Preview align={ALIGN.stretch}>
        <VStack gap={BOX_STEP.md} className={FULL}>
          {GAP_STEPS.map((step) => (
            <HStack key={step} gap={step}>
              <Code>{step}</Code>
              <Tile>A</Tile>
              <Tile>B</Tile>
              <Tile>C</Tile>
            </HStack>
          ))}
        </VStack>
      </Preview>

      <H2>分隔线与小屏折叠</H2>
      <P>
        <Code>divided</Code> 用 1px 的 divide 线隔开子项; <Code>stackBelow="md"</Code> 让横排在 md 断点以下折成竖排.
      </P>
      <Preview align={ALIGN.stretch} code={`<HStack divided stackBelow="md" gap="md">…</HStack>`}>
        <HStack divided stackBelow={BOX_STEP.md} gap={BOX_STEP.md} className={FULL}>
          {ITEMS.slice(0, BOX_DOC.cols).map((item) => (
            <div key={item} className="flex-1 px-2 text-sm text-muted-foreground">{item}</div>
          ))}
        </HStack>
      </Preview>

      <H2>Grid 与 AutoGrid</H2>
      <P>
        Grid 按断点给列数 (<Code>{"cols={{ base: 1, md: 3 }}"}</Code>); AutoGrid 只声明每列最小宽度, 浏览器用
        <Code>repeat(auto-fill, minmax())</Code> 排出列数, 放进侧栏或弹窗也能正确换列.
      </P>
      <Preview
        align={ALIGN.stretch}
        code={`<Grid cols={{ base: 1, md: BOX_DOC.cols }} gap={BOX_STEP.sm}>…</Grid>
<AutoGrid min={BOX_STEP.xs} gap={BOX_STEP.sm}>…</AutoGrid>
<AutoGrid min="14rem" fit>…</AutoGrid>`}
      >
        <VStack gap={BOX_STEP.lg} className={FULL}>
          <Grid cols={{ base: 1, md: BOX_DOC.cols }} gap={BOX_STEP.sm}>
            {ITEMS.map((item) => (
              <Tile key={item}>{item}</Tile>
            ))}
          </Grid>
          <AutoGrid min={BOX_STEP.xs} gap={BOX_STEP.sm}>
            {ITEMS.map((item) => (
              <Tile key={item}>{item}</Tile>
            ))}
          </AutoGrid>
        </VStack>
      </Preview>

      <H2>Container / Section / Center</H2>
      <P>
        Section 自带纵向留白档与内层 Container; 给了 title 就以标题作区域名称 (aria-labelledby). Center 用同一套宽度档限宽.
      </P>
      <Preview
        align={ALIGN.stretch}
        code={`<Section pad="sm" tone="muted" size="md" eyebrow="概览" title="本周部署" description="…" actions={<Button />}>
  <Container size={BOX_STEP.sm} gutter={false}>…</Container>
</Section>
<Center fill="parent" maxWidth="prose" text>…</Center>`}
      >
        <VStack gap={BOX_STEP.md} className={FULL}>
          <Section
            pad={BOX_STEP.sm}
            tone={TONE_VARIANT.muted}
            size={BOX_STEP.md}
            className="rounded-lg border border-border"
            eyebrow={DEMO_OVERVIEW_LABEL}
            title="本周部署"
            description="Section 统一了分区的纵向留白与标题头, 页面里不必再各写 py-* 与 h2 的样式."
            actions={<Button {...OUTLINE}>全部</Button>}
          >
            <Container size={BOX_STEP.sm} gutter={false}>
              <Tile>Container size="sm" 限宽 max-w-2xl, 水平居中.</Tile>
            </Container>
          </Section>
          <Center fill={BOX_FILL.parent} maxWidth="prose" text className="h-28 rounded-lg border border-dashed border-border">
            <p className={MUTED}>Center 横纵双向居中, 内容限宽到 prose 档.</p>
          </Center>
        </VStack>
      </Preview>

      <H2>SplitView</H2>
      <P>
        包一层 resizable. 给 <Code>autoSaveId</Code> 就把拖出的尺寸存进 localStorage, 刷新后恢复; 只有用户拖动或键盘调整才写回,
        窗口缩放不会覆盖. 拖拽条可 Tab 聚焦, 方向键微调, Home / End 到上下限.
      </P>
      <Preview align={ALIGN.stretch} code={`<SplitView autoSaveId="docs-box-demo" startLabel="文件" endLabel="编辑区" start={…} end={…} withHandle />`}>
        <div className="h-48 w-full overflow-hidden rounded-lg border border-border">
          <SplitView
            autoSaveId={BOX_DOC.splitId}
            startLabel="文件"
            endLabel="编辑区"
            withHandle
            start={<Center fill={BOX_FILL.parent} className={MUTED}>拖我右侧的线, 然后刷新</Center>}
            end={<Center fill={BOX_FILL.parent} className={MUTED}>尺寸会被记住</Center>}
          />
        </div>
      </Preview>

      <H2>属性</H2>
      <PropsTable rows={[...BOX_PAGE_PROPS]} />
    </>
  );
}
