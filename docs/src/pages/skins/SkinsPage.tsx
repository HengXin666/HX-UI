import { useEffect, useState, type JSX } from "react";
import { SegmentedControl } from "@hx/ui";
import {
  DENSITY_LIST,
  SKIN,
  SKIN_LIST,
  SKIN_VARIANT,
  SKINS_DOC,
  type DensityName,
  type SkinName,
  type SkinVariant,
} from "../../../../src/constants/skins";
import { applyDensity, applySkin, readDensity, readSkin, readSkinVariant } from "../../../../src/skins";
import { Callout, Code, H2, P } from "../../components/DocKit";
import { SkinShowcase } from "./SkinShowcase";

const SKIN_ITEMS = SKIN_LIST.map((s) => ({ key: s.name, label: s.label }));
const DENSITY_ITEMS = DENSITY_LIST.map((d) => ({ key: d.name, label: d.label }));
const VARIANT_ITEMS = Object.values(SKIN_VARIANT).map((v) => ({ key: v, label: SKINS_DOC.variantLabel[v] }));

/**
 * 皮肤与密度演示页: 一键切换六套皮肤与三档密度, 作用于整个文档站的根元素,
 * 离开本页时还原 (移除 data-skin / data-skin-variant / data-density), 其他页面保持默认外观.
 * 明暗仍由顶栏的主题开关控制, 每套皮肤都带亮暗两份值.
 *
 * .agents/notes/implemented/feature/2026-11-02-skins-density.md
 */
export function SkinsPage(): JSX.Element {
  const [skin, setSkin] = useState<SkinName>(readSkin);
  const [variant, setVariant] = useState<SkinVariant>(() => readSkinVariant() ?? SKIN_VARIANT.sharp);
  const [density, setDensity] = useState<DensityName>(readDensity);

  const variants = SKIN_LIST.find((s) => s.name === skin)?.variants;
  const current = SKIN_LIST.find((s) => s.name === skin);

  useEffect(() => {
    applySkin(skin, { variant });
  }, [skin, variant]);

  useEffect(() => {
    applyDensity(density);
  }, [density]);

  useEffect(
    () => () => {
      applySkin(SKIN.default);
      applyDensity(null);
    },
    [],
  );

  return (
    <>
      <P>
        皮肤只覆盖语义令牌: 颜色, <Code>--radius</Code>, <Code>--font-display</Code>, <Code>--shadow-*</Code>,
        <Code>--gradient-*</Code> 与效果强度 <Code>--effect-intensity</Code>. 组件类名一行不动,
        不写 <Code>data-skin</Code> 时与现状逐字节一致.
      </P>

      <H2>切换</H2>
      <div className={SKINS_DOC.switchRow}>
        <SegmentedControl items={SKIN_ITEMS} value={skin} onChange={setSkin} />
      </div>
      {variants ? (
        <div className={SKINS_DOC.switchRow}>
          <SegmentedControl items={VARIANT_ITEMS} value={variant} onChange={setVariant} />
        </div>
      ) : null}
      <div className={SKINS_DOC.switchRow}>
        <SegmentedControl items={DENSITY_ITEMS} value={density} onChange={setDensity} />
      </div>
      <P>{current?.desc}</P>

      <SkinShowcase skin={skin} density={density} />

      <H2>接入</H2>
      <P>
        样式入口是 <Code>src/skins/index.css</Code>, 在 tokens.css 之后引入. 运行时用桶文件里的辅助函数写根元素属性:
      </P>
      <Callout title="用法">
        <Code>applySkin("fintech")</Code>, <Code>applySkin("retail", {"{ variant: \"round\" }"})</Code>,
        <Code>applyDensity("compact")</Code>. 也可以直接在任意容器上写 <Code>data-skin</Code> 做局部换肤.
      </Callout>

      <H2>密度</H2>
      <P>
        <Code>data-density</Code> 设定倍率 <Code>--density</Code> (0.875 / 1 / 1.25), 由它改写 Tailwind 间距单位
        <Code>--spacing</Code>, 现有组件的高度, 内边距与间隙一起收放; 另给出 <Code>--density-space</Code>,
        控件高度档 <Code>--control-h-xs..xl</Code> 与间距档 <Code>--space-2xs..2xl</Code> 供新组件取用.
      </P>
    </>
  );
}
