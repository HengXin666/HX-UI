import type { JSX } from "react";
import { cn } from "@hx/ui";
import { CATALOG, GROUPS, type CatalogEntry } from "../catalog";
import { CARD, SECTION_DESC, SECTION_TITLE } from "../constants";
import { PageHead } from "../page/Extras";
import { THUMB_PX, thumbUrl, useThumbs } from "./thumbs";

/** 普通左键单击才走站内路由, 带修饰键时交给浏览器开新标签. */
function plainClick(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** 一张件卡: 构建期截图 (scripts/docs-thumbs.ts 真跑组件拍的) 有就放, 没有就只有名字, 不放占位图. */
function PieceCard({ entry, shot, onGo }: { readonly entry: CatalogEntry; readonly shot: boolean; readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <a
      href={`#/${entry.id}`}
      onClick={(event) => {
        if (!plainClick(event)) return;
        event.preventDefault();
        onGo(entry.id);
      }}
      className={cn(CARD, "group flex min-w-0 flex-col overflow-hidden p-1.5 transition-colors hover:border-primary/40")}
    >
      {shot ? (
        <img
          src={thumbUrl(entry.id)}
          alt=""
          loading="lazy"
          width={THUMB_PX.width}
          height={THUMB_PX.height}
          className="aspect-[8/5] w-full rounded-xl border border-border/60 bg-background object-cover"
        />
      ) : null}
      <span className="truncate px-2 pt-2.5 pb-1 text-[14px] font-medium text-foreground">{entry.label}</span>
      <span className="truncate px-2 pb-2 text-[11.5px] text-muted-foreground">{entry.exports.length > 1 ? `${entry.exports.length} 个导出` : entry.exports[0]}</span>
    </a>
  );
}

/**
 * 层总览 (Surface / Kits / Controls 各一页): 按组列出这一层的每一件, 卡片缩略图是构建时用 playwright
 * 真跑组件拍的截图 (scripts/docs-thumbs.ts), 开发时没有截图就只列名字.
 */
export function OverviewPage({ entry, onGo }: { readonly entry: CatalogEntry; readonly onGo: (id: string) => void }): JSX.Element {
  const shots = useThumbs();
  const groups = GROUPS.filter((group) => group.layer === entry.layer && group.id !== entry.groupId)
    .map((group) => ({ group, items: CATALOG.filter((item) => item.groupId === group.id) }))
    .filter((section) => section.items.length > 0);
  const total = groups.reduce((sum, section) => sum + section.items.length, 0);
  return (
    <div className="flex flex-col gap-10">
      <PageHead entry={entry} />
      <p className={SECTION_DESC}>
        {groups.length} 组, {total} 件.
      </p>
      {groups.map(({ group, items }) => (
        <section key={group.id} aria-labelledby={`overview-${group.id}`} className="flex flex-col gap-3">
          <h2 id={`overview-${group.id}`} className={SECTION_TITLE}>
            {group.label}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <PieceCard key={item.id} entry={item} shot={shots.has(item.id)} onGo={onGo} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
