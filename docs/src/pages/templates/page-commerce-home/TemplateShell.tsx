import { useState, type JSX } from "react";
import { PageComposer, SegmentedControl, type BlockNode, type BlockRegistry, type SkinName } from "@hx/ui";
import { TEMPLATE_SKINS } from "./compose";

export interface TemplateShellProps {
  /** 整页数据 (data.ts 导出的 BlockNode 数组, 已注入回调). */
  blocks: readonly BlockNode[];
  /** 区块名 -> 组件. */
  registry: BlockRegistry;
  /** 初始皮肤, 默认 retail (电商站的参考皮肤). */
  defaultSkin?: SkinName;
}

/**
 * 电商整页模板的公共外壳: 顶部三皮肤切换 (default / retail / mono) + PageComposer.
 * 皮肤只写到 PageComposer 根节点的 data-skin, 区块外观差异全部来自语义令牌; 本组件不写任何类名.
 * 示例图直接使用仓内 docs/src/public/demo/*.svg (B3: 商品剪影 / 场景横幅 / 界面示意图),
 * 不再用 canvas 现画的渐变占位图覆盖它们; withDemoMedia 仍从 compose 导出, 供需要时使用.
 */
export function TemplateShell({ blocks, registry, defaultSkin = "retail" }: TemplateShellProps): JSX.Element {
  const [skin, setSkin] = useState<SkinName>(defaultSkin);

  return (
    <>
      <SegmentedControl items={[...TEMPLATE_SKINS]} value={skin} onChange={setSkin} />
      <PageComposer key={skin} blocks={[...blocks]} registry={registry} skin={skin} locale="zh-CN" />
    </>
  );
}
