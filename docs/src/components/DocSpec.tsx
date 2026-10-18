import { Fragment, type JSX } from "react";
import { DOC } from "@hx/ui";
import { parseSpec } from "../spec";
import { Code, CodeBlock, H2, P, PropsTable } from "./DocKit";

/**
 * 组件页的两段固定结构: 安装与引入 (Usage), 紧凑写法的属性表 (Props).
 * 从 DocKit 拆出, 让 DocKit 留在单文件行数上限之内; 只被 docs/src/pages/parity/ 下的页面使用.
 */

/**
 * 安装与引入: 每个组件页开头的固定一节. names 是要从 @hx/ui 引入的名字,
 * deps 是这个组件额外依赖的 npm 包 (已在 @hx/ui 的 dependencies 里, 列出来只为说明来源).
 */
export function Usage({ names, deps, usage }: { names: readonly string[]; deps?: readonly string[]; usage?: string }): JSX.Element {
  const imports = `import { ${names.join(DOC.listSep)} } from "@hx/ui";`;
  return (
    <>
      <H2>安装</H2>
      <P>组件随 <Code>@hx/ui</Code> 一起提供, 不需要单独拷贝源码{deps?.length ? <>; 底层依赖 {deps.map((dep, i) => <Fragment key={dep}>{i > 0 && DOC.listSep}<Code>{dep}</Code></Fragment>)}, 已在库的依赖里</> : null}.</P>
      <CodeBlock code={imports} />
      {usage ? (
        <>
          <H2>用法</H2>
          <CodeBlock code={usage} />
        </>
      ) : null}
    </>
  );
}

/**
 * 属性表的紧凑写法: 每行 "名字 ~ 类型 ~ 默认 ~ 说明", 默认值写 - 表示无 (类型里常有 |, 所以用 ~ 分列).
 * 一张表是一段模板字符串, 比逐行写对象更好读, 也不会让 "boolean" 这类类型名到处重复.
 */
export function Props({ spec }: { spec: string }): JSX.Element {
  const rows = parseSpec(spec).map(([name, type, fallback, desc]) => ({
    name, type, default: fallback === DOC.none ? undefined : fallback, desc,
  }));
  return <PropsTable rows={rows} />;
}
