import { getMarkdown, parseMarkdownToStructure } from 'stream-markdown-parser';
const ANSWER = [
  '## 已完成的改动',
  '',
  '- 把 `SettingsPageDemo` 的三级布局收成两栏',
  '',
  '| 区域 | 改动 |',
  '| --- | --- |',
  '| 左栏 | 分组标题 + 条目 |',
  '',
  '```ts',
  'export const layout = "two-column" as const;',
  '```',
].join('\n');
const md = getMarkdown('probe');
const nodes = parseMarkdownToStructure(ANSWER, md, { final: true });
const dump = (n, depth = 0) => {
  const pad = '  '.repeat(depth);
  console.log(pad + n.type + ' ' + JSON.stringify({ content: n.content?.slice?.(0, 40), code: n.code?.slice?.(0, 40), language: n.language, raw: n.raw?.slice?.(0, 30) }));
  (n.children || []).forEach((c) => dump(c, depth + 1));
};
nodes.forEach((n) => dump(n));
