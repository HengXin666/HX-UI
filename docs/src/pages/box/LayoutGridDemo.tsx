import type { JSX, ReactNode } from "react";
import { ALIGN, Button, TONE_VARIANT, VARIANT } from "@hx/ui";
import { Container, Grid, GridItem, Section, VStack } from "../../../../src/box";
import { BOX_BLEED, BOX_CLASS, BOX_STEP, GRID_COLUMNS, GRID_DOC, GRID_PAGE_PROPS, SECTION_ALIGN } from "../../../../src/constants/box";
import { H2, P, Preview, PropsTable, Code } from "../../components/DocKit";

/** 演示占位块: 只为让列宽看得见. */
function Cell({ children }: { children: ReactNode }): JSX.Element {
  return <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{children}</div>;
}

/** 预览框撑满. */
const FULL = BOX_CLASS.fullWidth;
/** 演示里的不对称双栏: 7/5 与 8/4, 手机单列, lg 起分栏. */
const SPLITS = [GRID_DOC.split75, GRID_DOC.split84] as const;
/** 12 列刻度尺. */
const RULER = Array.from({ length: GRID_DOC.ruler }, (_, i) => i + 1);
/** 小号描边按钮. */
const OUTLINE = { size: VARIANT.sm, variant: TONE_VARIANT.outline } as const;

/**
 * V0-04 示例: 宽屏 / 出血容器, Section 的 align / titleSize / rhythm / tone, 12 列栅格与 span / offset / start.
 * 由 BoxPage 引入渲染.
 */
export function LayoutGridDemo(): JSX.Element {
  return (
    <>
      <H2>12 列栅格</H2>
      <P>
        <Code>{"<Grid cols={12}>"}</Code> 配 <Code>GridItem</Code>: <Code>span</Code> 跨列, <Code>start</Code> 起始列线,
        <Code>offset</Code> 行首偏移 (= start - 1). 三者都可按 base / sm / md / lg / xl 给值, 等宽列的旧用法不变.
      </P>
      <Preview
        align={ALIGN.stretch}
        code={`<Grid cols={12} gap="sm">
  <GridItem span={{ base: 12, lg: 7 }}>主栏</GridItem>
  <GridItem span={{ base: 12, lg: 5 }}>侧栏</GridItem>
</Grid>
<Grid cols={12}>
  <GridItem span={{ base: 12, md: 8 }} offset={{ md: 2 }}>居中 8 列</GridItem>
</Grid>`}
      >
        <VStack gap={BOX_STEP.md} className={FULL}>
          <Grid cols={GRID_COLUMNS} gap={BOX_STEP.xs}>
            {RULER.map((n) => (
              <Cell key={n}>{n}</Cell>
            ))}
          </Grid>
          {SPLITS.map(([main, side]) => (
            <Grid key={main} cols={GRID_COLUMNS} gap={BOX_STEP.sm}>
              <GridItem span={{ base: GRID_COLUMNS, lg: main }}>
                <Cell>主栏 span {main}</Cell>
              </GridItem>
              <GridItem span={{ base: GRID_COLUMNS, lg: side }}>
                <Cell>侧栏 span {side}</Cell>
              </GridItem>
            </Grid>
          ))}
          <Grid cols={GRID_COLUMNS} gap={BOX_STEP.sm}>
            <GridItem span={{ base: GRID_COLUMNS, md: GRID_DOC.centered.span }} offset={{ md: GRID_DOC.centered.offset }}>
              <Cell>span 8 + offset 2: 12 列中居中</Cell>
            </GridItem>
          </Grid>
        </VStack>
      </Preview>

      <H2>宽屏档与全出血</H2>
      <P>
        Container 新增 <Code>content</Code> / <Code>wide</Code> / <Code>max</Code> 三档 (1280 / 1440 / 1536, 读
        <Code>--container-*</Code>). <Code>bleed="full"</Code> 时外层铺满可上底色, 内层按 size 回中;
        <Code>bleed="breakout"</Code> 冲出父级限宽直到视口两侧.
      </P>
      <Preview align={ALIGN.stretch} code={`<Container bleed="full" size="wide" className="bg-muted">…</Container>`}>
        <Container bleed={BOX_BLEED.full} size="wide" className="rounded-lg border border-border bg-muted">
          <div className="py-6">
            <Cell>外层全宽底色, 内容限宽 wide 并回中.</Cell>
          </div>
        </Container>
      </Preview>

      <H2>Section: 对齐, 标题尺度, 节奏, 底色</H2>
      <P>
        <Code>align="center"</Code> 让眉标, 标题, 描述与操作居中; <Code>titleSize</Code> 从 sm 到 display;
        <Code>rhythm</Code> 读 <Code>--section-pad-*</Code>; tone 新增 inverted / brand / image. 不传新 props 时外观与旧版一致.
      </P>
      <Preview
        align={ALIGN.stretch}
        code={`<Section tone="brand" align="center" titleSize="display" rhythm="md" eyebrow="新品" title="…" actions={…} />
<Section tone="inverted" titleSize="lg" rhythm="sm" title="…" />`}
      >
        <VStack gap={BOX_STEP.md} className={FULL}>
          <Section
            tone="brand"
            align={SECTION_ALIGN.center}
            titleSize="display"
            rhythm={BOX_STEP.md}
            className="rounded-lg"
            eyebrow="新品"
            title="把复杂留给我们"
            description="居中的标题区用于落地页首屏与转化区, 描述自动 text-balance."
            actions={<Button size={VARIANT.sm}>立即开始</Button>}
          />
          <Section
            tone="inverted"
            titleSize="lg"
            rhythm={BOX_STEP.sm}
            className="rounded-lg"
            title="深底分区"
            description="inverted 用 foreground / background 互换, 文字跟随 currentColor."
            actions={<Button {...OUTLINE}>了解</Button>}
          />
        </VStack>
      </Preview>

      <H2>扩展属性</H2>
      <PropsTable rows={[...GRID_PAGE_PROPS]} />
    </>
  );
}
