import type { JSX } from "react";
import { BUTTON_TYPE, DocsPager, cn } from "@hx/ui";
import type { DocEntry } from "../../../src/nav";
import { renderDoc } from "../../render-doc";
import { COMPONENTS, relatedOf, type CatalogEntry } from "../catalog";
import { ICON, ICON_XS, PAGER_CLASS, PKG, TOOL_GROUP } from "../constants";
import { Thumb } from "../index/Thumb";
import { copyText } from "../page/copy";
import { PageHead, Related } from "../page/Extras";

const RELATED_COUNT = 4;

/**
 * 通用回退: 还没有 Customize 定义的文档页. 页头与相关组件同组件页一致,
 * 正文仍是原来的文档页 (各示例自带预览 | 代码), 不为对齐外观删减内容.
 */
export function GenericPage({ entry, onGo }: { readonly entry: CatalogEntry; readonly onGo: (id: string) => void }): JSX.Element {
  const index = COMPONENTS.findIndex((item) => item.id === entry.id);
  const prev = index > 0 ? COMPONENTS[index - 1] : undefined;
  const next = COMPONENTS[index + 1];
  const markdown = `# ${entry.label} (${PKG})\n\n${entry.desc}\n\n分组: ${entry.group}\n\n\`\`\`bash\nnpm i ${PKG}\n\`\`\``;
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
      <div className="min-w-0">{renderDoc(entry as DocEntry)}</div>
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
