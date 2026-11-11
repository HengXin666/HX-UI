import { CtaBanner, Hero, LogoWall, Newsletter, SKIN, type HeroProps } from "@hx/ui";
import heroRaw from "../../../../../../src/blocks/marketing/Hero.tsx?raw";
import { CTA_BOXED, HERO_CENTERED, HERO_PRODUCT, LOGO_WALL_GRID, NEWSLETTER_DATA, json } from "../../../../../src/pages/blocks/marketing-v102/data";
import { BLOCK_HOOKS, HOOKS_NOTE, SKINS, Skinned } from "../../block-stage";
import { select, type PageSpec, type Values } from "../../types";

/**
 * 首屏区块页: Hero 为主件, 同组的 LogoWall, CtaBanner, Newsletter 作部件.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

/** 模拟订阅: 含 fail 的邮箱走失败态, 其余 800ms 后成功. */
function fakeSubscribe(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (email.includes("fail") ? reject(new Error("demo")) : resolve()), 800);
  });
}

const HERO_KEYS = ["tone", "pad", "align", "titleSize", "reveal"] as const;

function heroUsage(values: Values): string {
  const changed = HERO_KEYS.filter((key) => values[key] !== HERO_BASE[key]).map((key) => `  ${key}=${JSON.stringify(values[key] === "false" ? false : values[key])}`);
  const skin = values.skin === SKIN.default ? "" : ` data-skin=${JSON.stringify(values.skin)}`;
  const props = changed.length > 0 ? `\n  {...data}\n${changed.join("\n")}\n` : " {...data} ";
  return `import { BlocksProvider, Hero, type HeroProps } from "@hx/ui";\n\nconst data: HeroProps = ${json(HERO_CENTERED)};\n\nexport function Demo() {\n  return (\n    <div${skin}>\n      <BlocksProvider locale="zh-CN">\n        <Hero${props}/>\n      </BlocksProvider>\n    </div>\n  );\n}`;
}

const HERO_BASE: Values = { tone: "plain", pad: "lg", align: "center", titleSize: "xl", reveal: "rise" };

export const BLOCKS_HERO: PageSpec = {
  id: "blocks-hero",
  kind: "block",
  importName: "Hero",
  parts: ["LogoWall", "CtaBanner", "Newsletter"],
  source: "src/blocks/marketing/Hero.tsx",
  raw: heroRaw,
  deps: ["motion"],
  height: 560,
  controls: [
    select("skin", "皮肤", SKINS, SKIN.default, "", "舞台包裹层的 data-skin, 区块本身不感知皮肤名."),
    select("tone", "底色", ["plain", "muted", "card", "brand", "inverted"], "plain", "", "区块底色档."),
    select("pad", "上下留白", ["sm", "md", "lg", "xl"], "lg", "", "区块的上下节奏档."),
    select("align", "对齐", ["center", "start"], "center", "", "标题组对齐."),
    select("titleSize", "标题字号", ["md", "lg", "xl", "2xl"], "xl", "", "标题字号档."),
    select("reveal", "入场", ["rise", "fade", "stagger", "false"], "rise", "", "进入视口时的入场方式; false 不做入场."),
  ],
  hideProps: BLOCK_HOOKS,
  propsNote: HOOKS_NOTE,
  propDesc: {
    eyebrow: "标题上方的一行小字.",
    title: "主标题, 支持富文本片段.",
    lead: "导语.",
    trust: "按钮下的信任行 (头像组, 评分).",
    titleSize: "标题字号档.",
    titleLevel: "标题层级, 默认 h1.",
    tone: "区块底色档.",
    pad: "区块的上下节奏档.",
    width: "内容最大宽度档.",
    align: "标题组对齐.",
    reveal: "进入视口时的入场方式, false 不做入场.",
    heading: "完整标题组 (含动作), 给了就以它为准.",
    eyebrowTone: "眉标的语气色.",
  },
  toProps: (values) => ({ ...values, reveal: values.reveal === "false" ? false : values.reveal }),
  render: (props) => {
    const { skin, ...rest } = props;
    return (
      <Skinned skin={skin}>
        {/* 演示里降成 h2: 页面自己的 h1 是组件名, 区块默认的 h1 留给真实页面 */}
        <Hero {...HERO_CENTERED} {...(rest as Partial<HeroProps>)} titleLevel={2} />
      </Skinned>
    );
  },
  usage: heroUsage,
  examples: [
    {
      id: "product",
      title: "产品图 (linear / apple 型)",
      align: "stretch",
      code: `<Hero {...data} />\n\n// data\n${json(HERO_PRODUCT)}`,
      render: () => (
        <Skinned skin={SKIN.default}>
          <Hero {...HERO_PRODUCT} titleLevel={2} />
        </Skinned>
      ),
    },
    {
      id: "logo-wall",
      title: "LogoWall 标志墙",
      desc: "静态网格, 窄容器自动转横滚; 默认灰度, 悬停或聚焦复色.",
      align: "stretch",
      code: `<LogoWall {...data} />\n\n// data\n${json(LOGO_WALL_GRID)}`,
      render: () => (
        <Skinned skin={SKIN.default}>
          <LogoWall {...LOGO_WALL_GRID} />
        </Skinned>
      ),
    },
    {
      id: "cta",
      title: "CtaBanner 行动条",
      align: "stretch",
      code: `<CtaBanner {...data} />\n\n// data\n${json(CTA_BOXED)}`,
      render: () => (
        <Skinned skin={SKIN.default}>
          <CtaBanner {...CTA_BOXED} />
        </Skinned>
      ),
    },
    {
      id: "newsletter",
      title: "Newsletter 邮件订阅",
      desc: "idle, submitting, success, error 四态, 提示写进 role=\"status\". 邮箱里带 fail 演示失败态.",
      align: "stretch",
      code: `<Newsletter {...data} onSubmit={subscribe} />\n\n// data\n${json(NEWSLETTER_DATA)}`,
      render: () => (
        <Skinned skin={SKIN.default}>
          <Newsletter {...NEWSLETTER_DATA} onSubmit={fakeSubscribe} />
        </Skinned>
      ),
    },
  ],
};
