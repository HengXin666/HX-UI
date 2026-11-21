/**
 * 假数据工厂 (src/commerce/fixtures.ts) 的数据表. 放常量目录是因为整表都是字面量, 工厂只负责拼装.
 */

export const FIXTURE_PIC = "https://picsum.photos/seed/";
export const FIXTURE_PIC_SIZE = "/1200/1500";
export const FIXTURE_CURRENCY = "CNY";
export const FIXTURE_BRAND = "Northfold";
export const FIXTURE_AXIS = { color: "颜色", size: "尺码" } as const;

/** 颜色: 色值是商品数据, 用 CSS 命名色; media 是该色实拍在画廊里的序号. */
export const FIXTURE_COLORS = [
  { value: "sand", label: "沙色", color: "tan", media: [0, 1] },
  { value: "ink", label: "墨蓝", color: "midnightblue", media: [2, 3] },
  { value: "moss", label: "苔绿", color: "darkolivegreen", media: [4] },
] as const;

export const FIXTURE_SIZES = ["38", "39", "40", "41", "42", "43", "44"] as const;

/** 不生产的组合. */
export const FIXTURE_NONE = -1;

/** 库存表: 行是颜色, 列是尺码; FIXTURE_NONE 表示这个组合不生产. */
export const FIXTURE_STOCK: Record<string, readonly number[]> = {
  sand: [3, 11, 24, 17, 9, 0, 2],
  ink: [0, 6, 13, 21, 14, 7, 0],
  moss: [FIXTURE_NONE, FIXTURE_NONE, 4, 8, 0, 3, FIXTURE_NONE],
};

/** 价格: 苔绿限量款打折. */
export const FIXTURE_PRICE = { regular: 1349, sale: 1189, saleColor: "moss" } as const;

export const FIXTURE_MEDIA = [
  { seed: "fell-sand-side", alt: "沙色款侧面" },
  { seed: "fell-sand-sole", alt: "沙色款外底纹路" },
  { seed: "fell-ink-side", alt: "墨蓝款侧面" },
  { seed: "fell-ink-top", alt: "墨蓝款俯视" },
  { seed: "fell-moss-side", alt: "苔绿款侧面" },
  { seed: "fell-trail", alt: "在湿滑木栈道上的实穿" },
] as const;

export const FIXTURE_RATING = { value: 4.6, count: 1317 } as const;

export const FIXTURE_REVIEW = {
  authors: ["林舟", "Mia K.", "老周", "阿遥", "Daniel", "苏苏", "Hiro", "陈默"],
  bodies: [
    "下雨天走了 23km 的石阶, 抓地比上一双好太多.",
    "42 码偏小一点, 换了 42.5 刚好.",
    "鞋面透气, 但泥地之后不太好刷.",
    "缓震偏硬, 适合中短距离.",
    "沙色很耐看, 实物比图片暖一点.",
  ],
  /** 18 条评价的星级, 分布偏右但有差评. */
  stars: [5, 5, 4, 5, 3, 4, 5, 2, 5, 4, 5, 1, 4, 5, 5, 3, 5, 4],
  /** 评价日期的年月前缀与月内天数. */
  month: "2026-10-",
  days: 28,
  /** 评价里尺码取样的步长. */
  sizeStep: 3,
} as const;

export const FIXTURE_RELATED = [
  { id: "merino-crew", title: "美利奴中筒跑袜", price: 89, stock: 214, alt: "灰色中筒袜" },
  { id: "trail-gaiter", title: "防碎石短绑腿", price: 159, compareAt: 199, stock: 37, alt: "黑色短绑腿套在鞋口" },
  { id: "arch-insole", title: "足弓支撑鞋垫", price: 239, stock: 0, alt: "橙色鞋垫侧面" },
  { id: "shell-vest", title: "Packlite 防风背心", price: 699, stock: 12, alt: "折叠进胸袋的防风背心" },
] as const;
