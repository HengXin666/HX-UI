# Agent Note: PageSpec 带 meta, head 靠 React 19 提升, JSON-LD 用四个纯函数帮手

Status: implemented

Decision-ID: omni-page-meta

## Code

- `src/page/meta.ts`
- `src/page/PageHead.tsx`
- `src/constants/page-meta.ts`

## Problem

标杆页 A (PDP) 与 B (软件产品页) 要求结构化数据与分享卡片, 现在每个使用方都要自己拼 `<title>`, og 标签和 schema.org JSON, 字段名靠记忆, 漏写 offers 或写出 null 都只能等搜索引擎报错才发现.

## Decision

- `PageSpec` 加 `meta?: PageMeta` (title, description, canonical, og, jsonLd). `Page` 在 sections 与 story 两条路径前都输出 `PageHead`; 不写 meta 时渲染结果与以前一致.
- `PageHead` 直接渲染 `<title>`, `<meta>`, `<link rel="canonical">`, 由 React 19 提升进 document.head. og 标题, 描述, url 缺省取 title, description, canonical, 不让调用方写两遍.
- JSON-LD 帮手 `productLd`, `softwareLd`, `faqLd`, `breadcrumbLd` 是纯函数: 只收业务字段, 输出 schema.org 形状, undefined 字段不输出, 零评价不出 aggregateRating, 空列表返回 undefined 由 `ldList` 过滤. 库存态只收四个键, 拼错编译期报.
- JSON-LD 的 script 不会被 React 提升, 留在页面内联; `serializeLd` 把 `<` 转成 `\u003c`, 内容里的 `</script>` 不能提前闭合标签.
- schema.org 类型名, og 键名, 转义规则收在 `src/constants/page-meta.ts`.

## Alternatives considered

- react-helmet / react-helmet-async: 最强理由是 SSR 与旧 React 都成熟. 否决: 库已要求 React 19, 原生提升够用, 多一个依赖与 Provider.
- 在 effect 里直接改 document.head: 最强理由是不依赖 React 版本. 否决: SSR 首屏拿不到, 卸载时还要自己清理.
- 让使用方直接写 schema.org 对象, 库只负责输出: 最强理由是覆盖面无限. 否决: 字段名与必填项正是最常出错的地方; `PageMeta.jsonLd` 仍接受任意 `JsonLd`, 帮手之外的类型照样能写.

## Consequences

`@hx/ui/page` 新增 `PageMeta`, `OgMeta`, `JsonLd`, 四个帮手, `serializeLd`, `ldList`, `PageHead` 导出, api 快照需要更新. 富结果的人工验收 (Rich Results Test) 放到 P7 标杆页阶段.
