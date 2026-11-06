import type { JSX } from "react";
import { SKIN_ATTR } from "../../../../../src/constants/skins";
import { CodeShowcase } from "../../../../../src/blocks/marketing/CodeShowcase";
import { InstallBlock } from "../../../../../src/blocks/marketing/InstallBlock";
import { Callout, CodeBlock, Code, H2, H3, P, Preview } from "../../../components/DocKit";
import { CODE_SHOWCASE_JSON, COUNTER_SAMPLE, INSTALL_JSON, INSTALL_PLATFORMS_JSON, V106_SKINS } from "./data";

const JSON_INDENT = 2;
const STRETCH = "stretch";

/** 并排模式的实时预览节点 (预览是 ReactNode, 不进 JSON). */
function CounterPreview(): JSX.Element {
  return <button type="button">点了 0 次</button>;
}

/**
 * 营销区块 E (开发者) 文档页: CodeShowcase 与 InstallBlock 的示例, JSON 数据示例, 三皮肤演示.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-marketing-developer.md
 */
export function MarketingV106Page(): JSX.Element {
  return (
    <>
      <P>
        开发者落地页的两个核心区块. 代码与命令全部来自 props (字符串), 高亮复用 <Code>CodeBlock</Code> (shiki),
        复制在非 HTTPS 下自动降级并经 aria-live 播报.
      </P>

      <H2>CodeShowcase</H2>
      <H3>两级 tabs + 尾部动作 (纯代码)</H3>
      <Preview align={STRETCH} code={`<CodeShowcase {...data} pad="sm" />`}>
        <CodeShowcase {...CODE_SHOWCASE_JSON} pad="sm" width="full" />
      </Preview>
      <H3>左代码右预览 (并排)</H3>
      <Preview align={STRETCH} code={`<CodeShowcase layout="split" tabs={[{ ...sample, preview: <Counter /> }]} />`}>
        <CodeShowcase layout="split" pad="sm" width="full" tabs={[{ ...COUNTER_SAMPLE, preview: <CounterPreview /> }]} />
      </Preview>
      <H3>JSON 数据</H3>
      <CodeBlock lang="json" code={JSON.stringify(CODE_SHOWCASE_JSON, null, JSON_INDENT)} />

      <H2>InstallBlock</H2>
      <H3>多包管理器 + 备用方式 (卡片)</H3>
      <Preview align={STRETCH} code={`<InstallBlock {...data} />`}>
        <InstallBlock {...INSTALL_JSON} pad="sm" width="full" />
      </Preview>
      <H3>多操作系统 tabs</H3>
      <Preview align={STRETCH} code={`<InstallBlock platforms={platforms} />`}>
        <InstallBlock {...INSTALL_PLATFORMS_JSON} pad="sm" width="full" />
      </Preview>
      <H3>轻量版 (嵌进 Hero)</H3>
      <Preview code={`<InstallBlock embedded variant="pill" commands={[{ command: "npm i @hx/ui" }]} />`}>
        <InstallBlock embedded variant="pill" commands={[INSTALL_JSON.commands[0]]} />
      </Preview>
      <H3>JSON 数据</H3>
      <CodeBlock lang="json" code={JSON.stringify({ ...INSTALL_JSON, ...INSTALL_PLATFORMS_JSON }, null, JSON_INDENT)} />

      <H2>三皮肤演示</H2>
      <Callout title="只读语义 token">区块不感知皮肤名; 外层写 data-skin 即换气质.</Callout>
      {V106_SKINS.map((skin) => (
        <div key={skin} {...{ [SKIN_ATTR.skin]: skin }}>
          <H3>{skin}</H3>
          <InstallBlock {...INSTALL_JSON} tone="muted" pad="sm" width="full" />
          <CodeShowcase layout="split" pad="sm" width="full" tabs={[{ ...COUNTER_SAMPLE, preview: <CounterPreview /> }]} />
        </div>
      ))}
    </>
  );
}
