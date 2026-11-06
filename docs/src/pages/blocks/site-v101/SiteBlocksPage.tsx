import { useState, type JSX } from "react";
import { PageComposer } from "../../../../../src/blocks/_shared/PageComposer";
import { BlocksProvider } from "../../../../../src/blocks/_shared/BlocksProvider";
import { siteBlockRegistry, MegaMenuPanel } from "../../../../../src/blocks/site";
import { SKIN_ATTR } from "../../../../../src/skins";
import { SITE_SHELL_PAGE, SITE_SHELL_SKINS, SITE_SHELL_HEADER } from "./site-shell-data";

const JSON_INDENT = 2;

/**
 * 站点区块 (V1-01) 文档页: 完整站点外壳 (公告 + 顶栏 + 大菜单 + 移动导航 + 页脚) 由 PageComposer 按 JSON 渲染,
 * 下方是同一份 JSON 数据示例与独立的 MegaMenuPanel 区块. 顶部按钮切换三皮肤 (预览容器写 data-skin).
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-site-v101.md
 */
export function SiteBlocksPage(): JSX.Element {
  const [skin, setSkin] = useState<string>(SITE_SHELL_SKINS[0]);
  const skinAttr = { [SKIN_ATTR.skin]: skin };
  const mega = SITE_SHELL_HEADER.nav[0];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">站点区块 (site)</h1>
        <p className="text-sm text-muted-foreground">顶栏, 大菜单面板, 移动导航, 公告条, 页脚. 全部数据驱动, 可整页拼装.</p>
      </header>

      <div role="group" aria-label="皮肤预览" className="flex flex-wrap gap-2">
        {SITE_SHELL_SKINS.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={skin === name}
            onClick={() => setSkin(name)}
            className="rounded-(--radius-md) border border-border px-3 py-1 text-sm aria-pressed:bg-accent"
          >
            {name}
          </button>
        ))}
      </div>

      <section aria-label="站点外壳演示" {...skinAttr} className="relative overflow-hidden rounded-(--radius-lg) border border-border bg-background text-foreground">
        <BlocksProvider locale="zh-CN">
          <PageComposer blocks={SITE_SHELL_PAGE} registry={siteBlockRegistry} skin={skin} />
        </BlocksProvider>
      </section>

      <section aria-label="大菜单面板区块" {...skinAttr} className="rounded-(--radius-lg) border border-border bg-background text-foreground">
        {"mega" in mega ? <MegaMenuPanel {...mega.mega} aria-label={mega.label} /> : null}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">JSON 数据示例</h2>
        <pre className="max-h-96 overflow-auto rounded-(--radius-md) bg-muted p-4 text-xs">
          <code>{JSON.stringify(SITE_SHELL_PAGE, null, JSON_INDENT)}</code>
        </pre>
      </section>
    </div>
  );
}

export default SiteBlocksPage;
