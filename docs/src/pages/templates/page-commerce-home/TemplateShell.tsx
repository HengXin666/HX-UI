import { useMemo, useState, type JSX } from "react";
import { PageComposer, SegmentedControl, type BlockNode, type BlockRegistry, type SkinName } from "@hx/ui";
import { useDemoImages } from "../../../components/MediaDemo";
import { TEMPLATE_SKINS, collectDemoKeys, withDemoMedia } from "./compose";

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
 * 文档预览时把 data.ts 里的示例图地址换成 canvas 现画的图, 不请求外部地址.
 */
export function TemplateShell({ blocks, registry, defaultSkin = "retail" }: TemplateShellProps): JSX.Element {
  const [skin, setSkin] = useState<SkinName>(defaultSkin);
  const keys = useMemo(() => collectDemoKeys(blocks), [blocks]);
  const images = useDemoImages(keys);
  const resolved = useMemo(() => withDemoMedia([...blocks], keys, images), [blocks, keys, images]);

  return (
    <>
      <SegmentedControl items={[...TEMPLATE_SKINS]} value={skin} onChange={setSkin} />
      <PageComposer key={skin} blocks={resolved} registry={registry} skin={skin} locale="zh-CN" />
    </>
  );
}
