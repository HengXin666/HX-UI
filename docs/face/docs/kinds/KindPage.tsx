import type { JSX } from "react";
import { BUTTON_TYPE, DocsPager, cn } from "@hx/ui";
import { renderDoc } from "../../render-doc";
import { COMPONENTS, relatedOf, type CatalogEntry } from "../catalog";
import { ICON, ICON_XS, PAGER_CLASS, PKG, TOOL_GROUP } from "../constants";
import { Thumb } from "../index/Thumb";
import { copyText } from "../page/copy";
import { PageHead, Related } from "../page/Extras";
import { BlockStage } from "./BlockStage";
import { ExportProps, ImportCode, PendingSection } from "./KindSections";

const RELATED_COUNT = 4;
/** 页型: 与 catalog.src.json 的 kind 同一闭集. */
const KIND = { single: "single", composite: "composite", block: "block", control: "control" } as const;

/**
 * 页型模板: 还没有组件页定义 (specs) 的条目都走这里, 按页型摆同一套段落顺序:
 * 页头, 预览与代码, 调参, 示例, Props, 键盘与无障碍, 依赖, 相关, 上下页. 模板只摆目录与源码类型能给出的东西,
 * 不替任何组件写新内容: 预览与代码沿用原有文档页 (组件层的件给出 import 用法), Props 来自 props.gen.json,
 * 调参, 示例与依赖要组件页定义才有, 这里不出. 页型差异: composite 必有键盘段, control 必有减少动效对照段,
 * block 的预览放进可切 1440 / 390 宽与皮肤的舞台.
 */
export function KindPage({ entry, onGo }: { readonly entry: CatalogEntry; readonly onGo: (id: string) => void }): JSX.Element {
  const index = COMPONENTS.findIndex((item) => item.id === entry.id);
  const prev = index > 0 ? COMPONENTS[index - 1] : undefined;
  const next = COMPONENTS[index + 1];
  const markdown = `# ${entry.label} (${PKG})\n\n${entry.desc}\n\n分组: ${entry.group}\n\n\`\`\`bash\nnpm i ${PKG}\n\`\`\``;
  const body = entry.page ? renderDoc(entry) : <ImportCode entry={entry} />;
  return (
    <div className="flex flex-col gap-8">
      <PageHead entry={entry}>
        <button
          type={BUTTON_TYPE}
          onClick={() => copyText(markdown, "页面说明 Markdown")}
          className={cn(TOOL_GROUP, "mt-3 shrink-0 gap-2 px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground")}
        >
          <span aria-hidden className={cn(ICON.copy, ICON_XS)} />
          复制给 AI
        </button>
      </PageHead>
      <section aria-label="预览与代码" className="min-w-0">
        {entry.kind === KIND.block ? <BlockStage>{body}</BlockStage> : body}
      </section>
      {entry.page ? null : <ExportProps names={entry.exports} />}
      {entry.kind === KIND.composite ? <PendingSection id="keyboard" title="Keyboard 键盘与无障碍" what="键盘操作与读屏说明" /> : null}
      {entry.kind === KIND.control ? <PendingSection id="reduced-motion" title="Reduced motion 减少动效对照" what="同一演示在 prefers-reduced-motion 下的对照" /> : null}
      <Related items={relatedOf(entry, RELATED_COUNT)} onGo={onGo} preview={(item) => <Thumb entry={item} />} />
      <DocsPager
        aria-label="页面导航"
        className="mt-14"
        labels={{ prev: "上一页", next: "下一页" }}
        prev={prev ? { label: prev.label, href: `#/${prev.id}` } : undefined}
        next={next ? { label: next.label, href: `#/${next.id}` } : undefined}
        classNames={PAGER_CLASS}
      />
    </div>
  );
}
