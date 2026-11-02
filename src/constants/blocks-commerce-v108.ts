/**
 * 电商交易与搜索区块 (V1-08: ProductDetail / CartSummary / CheckoutSteps / SearchResults) 的取值, 类名与兜底文案.
 * 区块文件只从这里取档, 不写颜色 / 字号 / 间距字面量. 类名写全字面量, Tailwind 才扫得到.
 * 契约: docs/reference/2026-ui-library-blocks-design.md 4.3; 审计: 2026-ui-library-visual-audit.md B14 到 B16.
 */

/** data-slot 根名. 子部件为 <根名>-<slot>. */
export const COMMERCE_TRADE_SLOT = {
  productDetail: "product-detail",
  cartSummary: "cart-summary",
  checkoutSteps: "checkout-steps",
  searchResults: "search-results",
} as const;

/** 拼 data-slot: cart-summary + line -> cart-summary-line. */
export const tradeSlot = (root: string, part?: string): string => (part ? `${root}-${part}` : root);

/** ProductDetail 选项类型. */
export const DETAIL_OPTION_TYPE = { swatch: "swatch", size: "size", select: "select" } as const;
export type DetailOptionType = (typeof DETAIL_OPTION_TYPE)[keyof typeof DETAIL_OPTION_TYPE];

/** 库存状态. */
export const STOCK_STATE = { inStock: "in-stock", low: "low", out: "out", preorder: "preorder" } as const;
export type StockState = (typeof STOCK_STATE)[keyof typeof STOCK_STATE];
export const STOCK_TONE_CLASS: Readonly<Record<StockState, string>> = {
  "in-stock": "text-success",
  low: "text-warning",
  out: "text-destructive",
  preorder: "text-muted-foreground",
};

/** CartSummary 形态: 页面版 / 抽屉版. */
export const CART_VARIANT = { page: "page", drawer: "drawer" } as const;
export type CartVariant = (typeof CART_VARIANT)[keyof typeof CART_VARIANT];

/** 合计行语气: 普通 / 优惠 (负数) / 总计 (加粗分隔). */
export const TOTAL_KIND = { normal: "normal", discount: "discount", grand: "grand" } as const;
export type TotalKind = (typeof TOTAL_KIND)[keyof typeof TOTAL_KIND];

/** 优惠码提交状态. */
export const PROMO_STATUS = { idle: "idle", pending: "pending", applied: "applied", error: "error" } as const;
export type PromoStatus = (typeof PROMO_STATUS)[keyof typeof PROMO_STATUS];

/** 搜索结果数据边界 (判序 loading > error > empty > ready, 与 V1-07 一致). */
export const SEARCH_STATE = { ready: "ready", loading: "loading", empty: "empty", error: "error" } as const;
export type SearchState = (typeof SEARCH_STATE)[keyof typeof SEARCH_STATE];

/** SearchResults.onChange 的变更来源. */
export const SEARCH_CHANGE = { query: "query", filter: "filter", sort: "sort", clear: "clear" } as const;
export type SearchChangeKind = (typeof SEARCH_CHANGE)[keyof typeof SEARCH_CHANGE];

/** Sheet 方向 (与 primitives/sheet 的 SIDE 同值). */
export const TRADE_SHEET_SIDE = { cart: "right", filters: "left" } as const;

/** 数值. */
export const TRADE_NUMBERS = {
  galleryRatio: 1,
  thumbRatio: 1,
  lineRatio: 1,
  qtyMin: 1,
  qtyMax: 99,
  qtyStep: 1,
  lowStock: 5,
  first: 0,
} as const;

/** 默认值. */
export const TRADE_DEFAULT = {
  cartVariant: "page",
  detailHeadingLevel: 1,
  searchFilterSide: "left",
  /** 缩略图的 sizes 提示. */
  thumbSizes: "96px",
  lineSizes: "80px",
} as const;

/** 图标 (solar, 与 commerce 层同族). */
export const TRADE_ICON = {
  minus: "icon-[solar--minus-circle-linear]",
  plus: "icon-[solar--add-circle-linear]",
  remove: "icon-[solar--trash-bin-minimalistic-linear]",
  cart: "icon-[solar--bag-4-linear]",
  zoom: "icon-[magnifer-zoom-in-linear]",
  search: "icon-[magnifer-linear]",
  filter: "icon-[solar--tuning-2-linear]",
  clear: "icon-[solar--close-circle-linear]",
  chevron: "icon-[solar--alt-arrow-down-linear]",
  check: "icon-[solar--check-circle-linear]",
  previous: "icon-[solar--alt-arrow-left-linear]",
  next: "icon-[solar--alt-arrow-right-linear]",
  tag: "icon-[solar--tag-price-linear]",
} as const;

/** 区块内置的 aria 兜底与少量默认可见文案; 全部可经各区块的 texts prop 覆盖. {n} / {q} 为占位. */
export const TRADE_TEXT_ZH = {
  gallery: "商品图片",
  thumbnail: "查看第 {n} 张图",
  zoom: "放大查看",
  quantity: "数量",
  decrease: "减少数量",
  increase: "增加数量",
  inStock: "有货",
  lowStock: "仅剩 {n} 件",
  outOfStock: "缺货",
  preorder: "预售",
  details: "商品详情",
  cart: "购物袋",
  cartEmpty: "购物袋是空的",
  remove: "移除",
  subtotal: "小计",
  promo: "优惠码",
  promoPlaceholder: "输入优惠码",
  promoApply: "使用",
  promoApplied: "已使用优惠码",
  promoError: "优惠码无效",
  orderSummary: "订单摘要",
  showSummary: "显示订单摘要",
  hideSummary: "收起订单摘要",
  steps: "结账步骤",
  stepOf: "第 {n} 步",
  back: "上一步",
  continue: "继续",
  search: "搜索",
  searchPlaceholder: "搜索商品",
  results: "共 {n} 件商品",
  resultsFor: "“{q}” 的搜索结果",
  filters: "筛选",
  sort: "排序",
  clearAll: "清除全部",
  removeFilter: "移除筛选 {q}",
  showResults: "查看 {n} 件商品",
  noResults: "没有找到相关商品",
  noResultsHint: "换个关键词或减少筛选条件试试",
  loadError: "加载失败",
  retry: "重试",
} as const;
export const TRADE_TEXT_EN = {
  gallery: "Product images",
  thumbnail: "View image {n}",
  zoom: "Zoom",
  quantity: "Quantity",
  decrease: "Decrease quantity",
  increase: "Increase quantity",
  inStock: "In stock",
  lowStock: "Only {n} left",
  outOfStock: "Out of stock",
  preorder: "Pre-order",
  details: "Product details",
  cart: "Bag",
  cartEmpty: "Your bag is empty",
  remove: "Remove",
  subtotal: "Subtotal",
  promo: "Promo code",
  promoPlaceholder: "Enter promo code",
  promoApply: "Apply",
  promoApplied: "Promo code applied",
  promoError: "Invalid promo code",
  orderSummary: "Order summary",
  showSummary: "Show order summary",
  hideSummary: "Hide order summary",
  steps: "Checkout steps",
  stepOf: "Step {n}",
  back: "Back",
  continue: "Continue",
  search: "Search",
  searchPlaceholder: "Search products",
  results: "{n} results",
  resultsFor: "Results for “{q}”",
  filters: "Filters",
  sort: "Sort by",
  clearAll: "Clear all",
  removeFilter: "Remove filter {q}",
  showResults: "Show {n} results",
  noResults: "No products found",
  noResultsHint: "Try another keyword or fewer filters",
  loadError: "Failed to load",
  retry: "Retry",
} as const satisfies Record<keyof typeof TRADE_TEXT_ZH, string>;
export type TradeTexts = { [K in keyof typeof TRADE_TEXT_ZH]: string };
export const TRADE_TEXT_PACKS = { zh: TRADE_TEXT_ZH, en: TRADE_TEXT_EN } as const;
export const TRADE_TEXT_FALLBACK = "zh";
export const TRADE_PLACEHOLDER = { n: "{n}", q: "{q}" } as const;
export const TRADE_LANG_SEPARATOR = "-";

/** 类名组合. */
export const TRADE_CLASS = {
  focus: "outline-none focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-offset-2",
  colors: "transition-[color,background-color,border-color,opacity] duration-(--duration-fast) ease-out motion-reduce:transition-none",
  icon: "size-4 bg-current",
  iconFlip: "rtl:-scale-x-100",
  srOnly: "sr-only",
  iconButton:
    "inline-flex size-(--control-h-sm,calc(var(--spacing)*8)) shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
  input:
    "h-(--control-h-md,calc(var(--spacing)*9)) w-full min-w-0 rounded-(--radius-md) border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground",
  select:
    "h-(--control-h-md,calc(var(--spacing)*9)) min-w-0 rounded-(--radius-md) border border-input bg-background px-3 text-sm text-foreground",
  label: "text-sm font-medium text-foreground",
  muted: "text-sm text-muted-foreground",
  divider: "border-t border-border",
  /* 数量 */
  qty: "inline-flex items-center gap-1 rounded-full border border-border p-0.5",
  qtyValue: "w-8 bg-transparent text-center text-sm tabular-nums text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
  /* ProductDetail */
  detail: "grid items-start gap-8 @3xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] @3xl:gap-12",
  gallery: "flex min-w-0 flex-col gap-3",
  galleryMain: "relative overflow-hidden rounded-(--radius-lg) bg-muted",
  galleryTrack:
    "flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden @3xl:hidden",
  gallerySlide: "w-full shrink-0 snap-start",
  galleryStage: "hidden @3xl:block",
  galleryZoom: "absolute end-3 bottom-3 z-10 inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm hover:bg-background",
  galleryOpen: "block w-full cursor-zoom-in",
  galleryDots: "flex items-center justify-center gap-1.5 @3xl:hidden",
  galleryDot: "size-1.5 rounded-full bg-muted-foreground/30 data-[state=active]:bg-foreground",
  thumbs: "hidden grid-cols-6 gap-2 @3xl:grid",
  thumb: "overflow-hidden rounded-(--radius-md) border border-transparent bg-muted opacity-70 hover:opacity-100 data-[state=active]:border-foreground data-[state=active]:opacity-100",
  info: "flex min-w-0 flex-col gap-6 @3xl:sticky @3xl:top-(--sticky-offset,calc(var(--spacing)*24))",
  infoHead: "flex flex-col gap-2",
  eyebrow: "text-sm font-medium text-muted-foreground",
  title: "text-[length:var(--fs-display-sm,var(--text-3xl))] font-semibold leading-tight text-balance text-foreground [&:lang(zh)]:tracking-[var(--tracking-display-cjk,0)]",
  option: "flex flex-col gap-2",
  optionHead: "flex items-baseline justify-between gap-2",
  optionValue: "text-sm text-muted-foreground",
  stock: "inline-flex items-center gap-1.5 text-sm font-medium",
  stockDot: "size-2 rounded-full bg-current",
  actions: "flex flex-col gap-3 @md:flex-row @md:flex-wrap @md:items-center",
  action: "@md:flex-1",
  detailsList: "flex flex-col",
  detailsItem: "group/details border-b border-border",
  detailsSummary: "flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden",
  detailsChevron: "transition-transform duration-(--duration-fast) group-open/details:rotate-180 motion-reduce:transition-none",
  chevronOpen: "rotate-180",
  detailsBody: "pb-4 text-sm text-muted-foreground text-pretty",
  /* CartSummary */
  cart: "flex min-w-0 flex-col gap-6",
  cartCard: "rounded-(--radius-lg) border border-border bg-card p-6 text-card-foreground",
  cartHead: "flex items-baseline justify-between gap-4",
  cartTitle: "text-lg font-semibold text-foreground",
  lines: "flex flex-col divide-y divide-border",
  line: "grid grid-cols-[calc(var(--spacing)*20)_minmax(0,1fr)] gap-4 py-4 first:pt-0",
  lineMedia: "overflow-hidden rounded-(--radius-md) bg-muted",
  lineBody: "flex min-w-0 flex-col gap-1",
  lineTop: "flex items-start justify-between gap-3",
  lineTitle: "text-sm font-medium text-foreground text-pretty",
  lineLink: "hover:underline underline-offset-4",
  lineOptions: "text-xs text-muted-foreground",
  lineBottom: "mt-auto flex items-center justify-between gap-3 pt-2",
  promo: "flex flex-col gap-2",
  promoRow: "flex gap-2",
  promoButton:
    "inline-flex h-(--control-h-md,calc(var(--spacing)*9)) shrink-0 items-center justify-center rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
  promoMsgOk: "text-xs text-success",
  promoMsgError: "text-xs text-destructive",
  totals: "flex flex-col gap-2",
  totalRow: "flex items-baseline justify-between gap-4 text-sm",
  totalLabel: "text-muted-foreground",
  totalValue: "tabular-nums text-foreground",
  totalDiscount: "tabular-nums text-success",
  totalGrand: "border-t border-border pt-3 text-base font-semibold [&>*]:text-foreground",
  checkout: "flex flex-col gap-2 [&>*]:w-full",
  drawer: "flex w-full flex-col gap-0 p-0 @container sm:max-w-md",
  drawerHead: "border-b border-border p-4 pe-12",
  drawerBody: "flex-1 overflow-y-auto p-4",
  drawerFoot: "border-t border-border p-4",
  /* CheckoutSteps */
  checkoutRoot: "grid items-start gap-8 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] @4xl:gap-12",
  checkoutMain: "flex min-w-0 flex-col gap-8",
  checkoutStepper: "w-full overflow-x-auto",
  checkoutPanel: "flex flex-col gap-6",
  checkoutStepTitle: "text-xl font-semibold text-foreground",
  checkoutNav: "flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6",
  checkoutAside: "hidden min-w-0 @4xl:sticky @4xl:top-(--sticky-offset,calc(var(--spacing)*24)) @4xl:block",
  checkoutMobile: "rounded-(--radius-lg) border border-border bg-muted/40 @4xl:hidden",
  checkoutToggle: "flex w-full items-center justify-between gap-3 p-4 text-sm font-medium text-foreground",
  checkoutToggleBody: "border-t border-border p-4",
  /* SearchResults */
  search: "flex min-w-0 flex-col gap-6",
  searchHead: "flex flex-col gap-4",
  searchForm: "relative flex w-full max-w-2xl items-center",
  searchIcon: "pointer-events-none absolute start-3 text-muted-foreground",
  searchInput: "ps-9",
  searchTitle: "text-2xl font-semibold text-foreground text-balance",
  toolbar: "flex flex-wrap items-center justify-between gap-3",
  toolbarStart: "flex flex-wrap items-center gap-3",
  filterButton:
    "inline-flex h-(--control-h-md,calc(var(--spacing)*9)) items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-muted @4xl:hidden",
  filterCount: "inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-xs text-background tabular-nums",
  sortWrap: "flex items-center gap-2",
  chips: "flex flex-wrap items-center gap-2",
  chip: "inline-flex items-center gap-1 rounded-full bg-muted py-1 ps-3 pe-1 text-xs text-foreground",
  chipClear: "text-xs font-medium text-foreground underline underline-offset-4",
  searchLayout: "grid items-start gap-8 @4xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]",
  searchAside: "hidden @4xl:sticky @4xl:top-(--sticky-offset,calc(var(--spacing)*24)) @4xl:block",
  searchMain: "min-w-0",
  facets: "flex flex-col",
  facet: "group/facet border-b border-border",
  facetSummary: "flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden",
  facetBody: "flex flex-col gap-2 pb-4",
  facetOption: "flex cursor-pointer items-center gap-2 text-sm text-foreground",
  facetCheck: "size-4 shrink-0 accent-foreground",
  facetCount: "ms-auto text-xs text-muted-foreground tabular-nums",
  sheet: "flex w-full flex-col gap-0 p-0 sm:max-w-sm",
  sheetHead: "border-b border-border p-4 pe-12",
  sheetBody: "flex-1 overflow-y-auto px-4",
  sheetDone:
    "inline-flex h-(--control-h-md,calc(var(--spacing)*9)) items-center justify-center rounded-(--radius-md) bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90",
  sheetFoot: "flex gap-2 border-t border-border p-4 [&>*]:flex-1",
} as const;
