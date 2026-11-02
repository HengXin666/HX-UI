import { useState, type JSX, type ReactNode } from "react";
import { CtaBanner } from "../../../../../src/blocks/marketing/CtaBanner";
import { Hero } from "../../../../../src/blocks/marketing/Hero";
import { LogoWall } from "../../../../../src/blocks/marketing/LogoWall";
import { Newsletter } from "../../../../../src/blocks/marketing/Newsletter";
import { BlocksProvider, PageComposer } from "../../../../../src/blocks/_shared";
import { Button } from "../../../../../src/primitives/button";
import { H2, H3, P, Preview } from "../../../components/DocKit";
import {
  COMPOSER_BLOCKS,
  CTA_BOXED,
  CTA_FULL,
  CTA_INLINE,
  DEMO_SKINS,
  HERO_CENTERED,
  HERO_MEDIA_BG,
  HERO_PRODUCT,
  HERO_SPLIT,
  HERO_VIDEO_BG,
  LOGO_WALL_GRID,
  LOGO_WALL_MARQUEE,
  NEWSLETTER_DATA,
  json,
  type DemoSkin,
} from "./data";

const REGISTRY = { Hero, LogoWall, CtaBanner, Newsletter };
const STAGE = "w-full overflow-hidden rounded-(--radius-lg) border border-border bg-background text-foreground";
const SKIN_BAR = "flex flex-wrap gap-2";

/** 模拟订阅接口: 含 "fail" 的邮箱走 error 态, 其余 800ms 后成功. */
function fakeSubscribe(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (email.includes("fail") ? reject(new Error("demo")) : resolve()), 800);
  });
}

/** 皮肤舞台: data-skin 写在包裹层, 区块只读语义 token, 不感知皮肤名. */
function Stage({ skin, children }: { skin: DemoSkin; children: ReactNode }): JSX.Element {
  return (
    <div data-skin={skin} className={STAGE}>
      <BlocksProvider locale="zh-CN">{children}</BlocksProvider>
    </div>
  );
}

function Example({ skin, code, children }: { skin: DemoSkin; code: string; children: ReactNode }): JSX.Element {
  return (
    <Preview align="stretch" code={code}>
      <Stage skin={skin}>{children}</Stage>
    </Preview>
  );
}

/**
 * V1-02 营销区块 A 文档页: Hero (五种版式), LogoWall (grid / marquee), CtaBanner (inline / boxed / full),
 * Newsletter (状态反馈). 每节含组件示例, 数据示例 JSON 与 default / mono / retail 三皮肤切换.
 */
export function MarketingV102Page(): JSX.Element {
  const [skin, setSkin] = useState<DemoSkin>("default");
  return (
    <>
      <H2 id="marketing-v102">营销区块 A</H2>
      <P>
        四个区块都吃 BlockBaseProps (tone / pad / width / align / reveal / backdrop / slots / labels), 文案全部来自 props.
        切换下方皮肤, 所有示例同时换肤.
      </P>
      <div className={SKIN_BAR} role="group" aria-label="皮肤">
        {DEMO_SKINS.map((s) => (
          <Button key={s} type="button" size="sm" variant={s === skin ? "default" : "outline"} aria-pressed={s === skin} onClick={() => setSkin(s)}>
            {s}
          </Button>
        ))}
      </div>

      <H2 id="hero">Hero</H2>
      <P>layout: centered / split / media-bg / video-bg / product. rotate 用 RotatingText 轮换第二行; backdrop 支持 mesh / grain / beam / image 与 mask.</P>
      <H3>centered (vercel / astro)</H3>
      <Example skin={skin} code={`<Hero {...data} />\n\n// data\n${json(HERO_CENTERED)}`}>
        <Hero {...HERO_CENTERED} />
      </Example>
      <H3>split + mesh + grain (stripe)</H3>
      <Example skin={skin} code={json(HERO_SPLIT)}>
        <Hero {...HERO_SPLIT} />
      </Example>
      <H3>media-bg (shopify / resend)</H3>
      <Example skin={skin} code={json(HERO_MEDIA_BG)}>
        <Hero {...HERO_MEDIA_BG} />
      </Example>
      <H3>video-bg (framer)</H3>
      <Example skin={skin} code={json(HERO_VIDEO_BG)}>
        <Hero {...HERO_VIDEO_BG} />
      </Example>
      <H3>product (linear / apple)</H3>
      <Example skin={skin} code={json(HERO_PRODUCT)}>
        <Hero {...HERO_PRODUCT} />
      </Example>

      <H2 id="logo-wall">LogoWall</H2>
      <P>grid 静态网格 (窄容器自动转 marquee) 与 marquee 无限滚动; 默认灰度, 悬停或聚焦复色.</P>
      <Example skin={skin} code={json(LOGO_WALL_GRID)}>
        <LogoWall {...LOGO_WALL_GRID} />
      </Example>
      <Example skin={skin} code={json(LOGO_WALL_MARQUEE)}>
        <LogoWall {...LOGO_WALL_MARQUEE} />
      </Example>

      <H2 id="cta-banner">CtaBanner</H2>
      <P>variant: inline / boxed / full; fill: none / gradient / mesh; media 作背景图并自动压暗; ctas 取前两个.</P>
      <Example skin={skin} code={json(CTA_BOXED)}>
        <CtaBanner {...CTA_BOXED} />
      </Example>
      <Example skin={skin} code={json(CTA_INLINE)}>
        <CtaBanner {...CTA_INLINE} />
      </Example>
      <Example skin={skin} code={json(CTA_FULL)}>
        <CtaBanner {...CTA_FULL} />
      </Example>

      <H2 id="newsletter">Newsletter</H2>
      <P>状态 idle → submitting → success / error, 提示写进 role="status" 的 live region. 邮箱含 fail 时演示失败态.</P>
      <Example skin={skin} code={`<Newsletter {...data} onSubmit={subscribe} />\n\n// data\n${json(NEWSLETTER_DATA)}`}>
        <Newsletter {...NEWSLETTER_DATA} onSubmit={fakeSubscribe} />
      </Example>

      <H2 id="page-composer">PageComposer 用法</H2>
      <P>同一份 JSON 交给 PageComposer, registry 由调用方注入.</P>
      <Example skin={skin} code={`<PageComposer registry={{ Hero, LogoWall, CtaBanner, Newsletter }} blocks={blocks} />\n\n// blocks\n${json(COMPOSER_BLOCKS)}`}>
        <PageComposer registry={REGISTRY} blocks={COMPOSER_BLOCKS.map((b) => ({ type: b.type, props: { ...b.props } }))} />
      </Example>
    </>
  );
}

export default MarketingV102Page;
