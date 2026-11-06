"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import {
  COMMERCE_TRADE_SLOT,
  SEARCH_CHANGE,
  SEARCH_STATE,
  TRADE_CLASS as C,
  TRADE_ICON,
  TRADE_SHEET_SIDE,
  tradeSlot,
  type SearchChangeKind,
  type SearchState,
  type TradeTexts,
} from "../../constants/blocks-commerce-v108";
import { useControllableState } from "../../hooks/state/useControllableState";
import { EmptyState } from "../../layout/EmptyState";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "../../primitives/sheet";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, Rich } from "../_shared/types";
import { fillText, useTradeTexts } from "./commerce-v108-parts";

const slot = (part?: string): string => tradeSlot(COMMERCE_TRADE_SLOT.searchResults, part);
type Selected = Record<string, string[]>;

export interface SearchFilterOption { value: string; label: string; count?: number; disabled?: boolean }
export interface SearchFilter {
  key: string;
  title: string;
  options: SearchFilterOption[];
  /** 多选 (复选框) 或单选 (单选钮), 默认多选. */
  multiple?: boolean;
  /** 初始展开, 默认 true. */
  open?: boolean;
}
export interface SearchSortSpec { options: { value: string; label: string }[]; value?: string; defaultValue?: string }
/** onChange 收到的完整查询状态. */
export interface SearchQueryState { query: string; filters: Selected; sort?: string }

export interface SearchResultsProps extends BlockBaseProps {
  query: string;
  filters: SearchFilter[];
  /** 已选筛选 (受控) 与初始值. */
  selected?: Selected;
  defaultSelected?: Selected;
  sort?: SearchSortSpec;
  /** 结果区: 通常是 <ProductGrid bare>, 区块不关心结果形态. */
  results: React.ReactNode;
  total: number;
  onChange?: (state: SearchQueryState, kind: SearchChangeKind) => void;
  /** 显示顶部搜索框 (提交时以 kind="query" 回调). */
  searchable?: boolean;
  title?: Rich;
  /** 数据边界: 不传时 total 为 0 即 empty. */
  dataBoundary?: SearchState;
  empty?: { text?: Rich; hint?: Rich; action?: Cta };
  onRetry?: () => void;
  texts?: Partial<TradeTexts>;
  ref?: React.Ref<HTMLElement>;
}

function Facets({ filters, selected, onToggle, idPrefix }: { filters: SearchFilter[]; selected: Selected; onToggle: (f: SearchFilter, v: string) => void; idPrefix: string }): React.JSX.Element {
  const { formatNumber } = useBlocks();
  return (
    <div data-slot={slot("facets")} className={C.facets}>
      {filters.map((f) => (
        <details key={f.key} open={f.open ?? true} className={C.facet}>
          <summary className={cn(C.facetSummary, C.focus)}>
            {f.title}
            <span aria-hidden className={cn(TRADE_ICON.chevron, C.icon, C.detailsChevron)} />
          </summary>
          <fieldset className={C.facetBody}>
            <legend className={C.srOnly}>{f.title}</legend>
            {f.options.map((o) => (
              <label key={o.value} className={C.facetOption}>
                <input
                  type={f.multiple === false ? "radio" : "checkbox"}
                  name={`${idPrefix}-${f.key}`}
                  value={o.value}
                  disabled={o.disabled}
                  checked={selected[f.key]?.includes(o.value) ?? false}
                  onChange={() => onToggle(f, o.value)}
                  className={cn(C.facetCheck, C.focus)}
                />
                {o.label}
                {o.count !== undefined && <span className={C.facetCount}>{formatNumber(o.count)}</span>}
              </label>
            ))}
          </fieldset>
        </details>
      ))}
    </div>
  );
}

/**
 * 搜索结果页 (设计稿 4.3, 审计 B16): 搜索框 + 标题与总数 (aria-live) + 已选筛选胶囊 + 排序;
 * 桌面左侧筛选栏 (粘性), 移动端筛选进 Sheet. 结果区由调用方传入, 区块只编排版式与查询状态.
 * 空结果与错误态用 layout/EmptyState. 布局走容器查询.
 */
export function SearchResults(props: SearchResultsProps): React.JSX.Element {
  const {
    query, filters, selected, defaultSelected = {}, sort, results, total, onChange, searchable = true, title, dataBoundary, empty, onRetry,
    texts, ref, labels: _labels, ...shell
  } = props;
  const { formatNumber } = useBlocks();
  const t = useTradeTexts(texts);
  const idPrefix = React.useId();
  const titleId = React.useId();
  const [draft, setDraft] = React.useState(query);
  React.useEffect(() => setDraft(query), [query]);
  const [picked, setPicked] = useControllableState<Selected>({ value: selected, defaultValue: defaultSelected });
  const [order, setOrder] = useControllableState<string | undefined>({ value: sort?.value, defaultValue: sort?.defaultValue ?? sort?.options[0]?.value });
  const state = dataBoundary ?? (total === 0 ? SEARCH_STATE.empty : SEARCH_STATE.ready);
  const emit = (next: Partial<SearchQueryState>, kind: SearchChangeKind): void => onChange?.({ query, filters: picked, sort: order, ...next }, kind);

  const setFilters = (next: Selected, kind: SearchChangeKind = SEARCH_CHANGE.filter): void => {
    setPicked(next);
    emit({ filters: next }, kind);
  };
  const toggle = (f: SearchFilter, v: string): void => {
    const cur = picked[f.key] ?? [];
    const vals = cur.includes(v) ? cur.filter((x) => x !== v) : f.multiple === false ? [v] : [...cur, v];
    setFilters({ ...picked, [f.key]: vals });
  };
  const chips = filters.flatMap((f) => (picked[f.key] ?? []).map((v) => ({ f, v, label: f.options.find((o) => o.value === v)?.label ?? v })));
  const totalText = fillText(t.results, { n: formatNumber(total) });
  const facets = (where: string): React.JSX.Element => <Facets filters={filters} selected={picked} onToggle={toggle} idPrefix={`${idPrefix}${where}`} />;

  let body: React.ReactNode = results;
  if (state === SEARCH_STATE.empty || state === SEARCH_STATE.error) {
    const err = state === SEARCH_STATE.error;
    const action = empty?.action ?? (err && onRetry ? { label: t.retry, onClick: onRetry, variant: "secondary" as const } : undefined);
    body = <EmptyState kind={err ? "error" : "empty"} text={err ? t.loadError : (empty?.text ?? t.noResults)} hint={err ? undefined : (empty?.hint ?? t.noResultsHint)} action={action ? <CtaButton cta={action} /> : undefined} />;
  }

  return (
    <BlockShell {...shell} ref={ref} aria-labelledby={shell["aria-labelledby"] ?? titleId}>
      <div data-slot={slot()} data-state={state} className={C.search}>
        <div data-slot={slot("head")} className={C.searchHead}>
          {searchable && (
            <form role="search" onSubmit={(e) => { e.preventDefault(); emit({ query: draft.trim() }, SEARCH_CHANGE.query); }} className={C.searchForm}>
              <span aria-hidden className={cn(TRADE_ICON.search, C.icon, C.searchIcon)} />
              <input type="search" aria-label={t.search} value={draft} placeholder={t.searchPlaceholder} onChange={(e) => setDraft(e.currentTarget.value)} className={cn(C.input, C.searchInput, C.focus)} />
            </form>
          )}
          <h2 id={titleId} className={C.searchTitle}>{title ?? (query ? fillText(t.resultsFor, { q: query }) : t.search)}</h2>
          <div className={C.toolbar}>
            <div className={C.toolbarStart}>
              {filters.length > 0 && (
                <Sheet>
                  <SheetTrigger asChild>
                    <button type={BUTTON_TYPE} className={cn(C.filterButton, C.colors, C.focus)}>
                      <span aria-hidden className={cn(TRADE_ICON.filter, C.icon)} />
                      {t.filters}
                      {chips.length > 0 && <span className={C.filterCount}>{formatNumber(chips.length)}</span>}
                    </button>
                  </SheetTrigger>
                  <SheetContent side={TRADE_SHEET_SIDE.filters} aria-describedby={undefined} className={C.sheet}>
                    <div className={C.sheetHead}><SheetTitle>{t.filters}</SheetTitle></div>
                    <div className={C.sheetBody}>{facets("sheet")}</div>
                    <div className={C.sheetFoot}>
                      <CtaButton cta={{ label: t.clearAll, variant: "secondary", disabled: chips.length === 0, onClick: () => setFilters({}, SEARCH_CHANGE.clear) }} />
                      <SheetClose className={cn(C.sheetDone, C.colors, C.focus)}>{fillText(t.showResults, { n: formatNumber(total) })}</SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <p role="status" aria-live="polite" className={C.muted}>{totalText}</p>
            </div>
            {sort && sort.options.length > 0 && (
              <label className={C.sortWrap}>
                <span className={C.muted}>{t.sort}</span>
                <select value={order} onChange={(e) => { const v = e.currentTarget.value; setOrder(v); emit({ sort: v }, SEARCH_CHANGE.sort); }} className={cn(C.select, C.focus)}>
                  {sort.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            )}
          </div>
          {chips.length > 0 && (
            <ul data-slot={slot("chips")} className={C.chips}>
              {chips.map(({ f, v, label }) => (
                <li key={`${f.key}-${v}`} className={C.chip}>
                  {label}
                  <button type={BUTTON_TYPE} aria-label={fillText(t.removeFilter, { q: label })} onClick={() => toggle(f, v)} className={cn(C.iconButton, C.colors, C.focus)}>
                    <span aria-hidden className={cn(TRADE_ICON.clear, C.icon)} />
                  </button>
                </li>
              ))}
              <li><button type={BUTTON_TYPE} onClick={() => setFilters({}, SEARCH_CHANGE.clear)} className={cn(C.chipClear, C.focus)}>{t.clearAll}</button></li>
            </ul>
          )}
        </div>
        <div className={filters.length > 0 ? C.searchLayout : undefined}>
          {filters.length > 0 && <aside data-slot={slot("filters")} aria-label={t.filters} className={C.searchAside}>{facets("aside")}</aside>}
          <div data-slot={slot("results")} aria-busy={state === SEARCH_STATE.loading || undefined} className={C.searchMain}>{body}</div>
        </div>
      </div>
    </BlockShell>
  );
}
