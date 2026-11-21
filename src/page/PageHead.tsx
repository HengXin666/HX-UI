import type { JSX } from "react";
import { LD_SCRIPT_TYPE, META_NAME, OG_DEFAULT_TYPE, OG_KEY } from "../constants/page-meta";
import { ldList, serializeLd, type PageMeta } from "./meta";

export interface PageHeadProps {
  meta: PageMeta;
}

/**
 * 按 PageMeta 输出 head 元素. title / meta / link 靠 React 19 的 head 提升进 document.head, 不引 react-helmet;
 * JSON-LD 的 script 不会被提升, 留在页面内联, 搜索引擎在 body 里同样读取.
 * .agents/notes/implemented/architecture/2026-11-19-page-meta-jsonld.md
 */
export function PageHead({ meta }: PageHeadProps): JSX.Element {
  const og = meta.og ?? {};
  const ogPairs: ReadonlyArray<readonly [string, string | undefined]> = [
    [OG_KEY.title, og.title ?? meta.title],
    [OG_KEY.description, og.description ?? meta.description],
    [OG_KEY.image, og.image],
    [OG_KEY.type, og.type ?? OG_DEFAULT_TYPE],
    [OG_KEY.url, og.url ?? meta.canonical],
  ];
  return (
    <>
      <title>{meta.title}</title>
      {meta.description ? <meta name={META_NAME.description} content={meta.description} /> : null}
      {meta.canonical ? <link rel="canonical" href={meta.canonical} /> : null}
      {ogPairs.map(([property, content]) => (content ? <meta key={property} property={property} content={content} /> : null))}
      {og.card ? <meta name={OG_KEY.card} content={og.card} /> : null}
      {ldList(meta.jsonLd).map((value, i) => (
        <script key={`${value["@type"]}-${i}`} type={LD_SCRIPT_TYPE} dangerouslySetInnerHTML={{ __html: serializeLd(value) }} />
      ))}
    </>
  );
}
