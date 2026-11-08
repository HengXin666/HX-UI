import { PRICE_PERIOD } from "../../constants/commerce";
import { LOCALE_ZH_CN } from "../../constants/locale";
import { HX_SCOPE_COLOR } from "../../constants/provider";
import { TEXT_TONE } from "../../constants/typography";

/** 整页模板的语言. 价格, 标题判定与读屏共用这一处. */
export const STUDIO_LOCALE = LOCALE_ZH_CN;

export const STUDIO_CURRENCY = "CNY";

export const FIELD_PLAN = { solo: "solo", studio: "studio", org: "org" } as const;

export const FIELD_PRICE = { studio: 36, org: 96 } as const;

export const KILN_PRICE = 268;

export const FIELD_METRICS = [
  {
    label: "决定落地的中位天数",
    value: 6.4,
    from: 0,
    delta: "上个季度是 11 天",
    tone: TEXT_TONE.success,
    series: [11, 10.4, 9.1, 8.6, 7.8, 7.2, 6.9, 6.4],
  },
  {
    label: "周记按时写完",
    value: 0.92,
    from: 0,
    format: { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 0 } as const,
    delta: "按已关闭的周计算",
    tone: TEXT_TONE.neutral,
    series: [0.71, 0.74, 0.8, 0.83, 0.86, 0.88, 0.9, 0.92],
  },
  {
    label: "仍未拍板的事项",
    value: 18,
    from: 40,
    delta: "其中 4 条超过两周",
    tone: TEXT_TONE.danger,
    series: [40, 36, 33, 29, 27, 24, 21, 18],
  },
] as const;

export const FIELD_LOG = [
  { time: "周四 16:40", title: "定价页不放年付开关", note: "林可拍板. 先看月付有没有人留下." },
  { time: "周四 11:05", title: "导出保留批注", note: "还差法务一句. 挂在未决." },
  { time: "周三 19:12", title: "空状态改成一条未写完的句子", note: "不再放插画. 王澍记." },
] as const;

export const FIELD_CHAPTERS = [
  {
    kicker: "01  记录",
    title: "会议结束时, 句子已经在时间线上.",
    body: "不把录音再转成另一份文档. 发言人, 原句和当时的屏幕停在同一行, 之后改一句就能看出改过.",
  },
  {
    kicker: "02  拍板",
    title: "没有主人的事项, 不会假装已经决定.",
    body: "每一条要么有人署名, 要么停在未决. 周会打开的是这份名单, 不是又一张新的看板.",
  },
] as const;

export const FIELD_STEPS = [
  { id: "jot", title: "记下", detail: "会中或会后, 一句话进时间线. 先不分类." },
  { id: "sort", title: "归并", detail: "同一件事的重复句子收成一条, 留下最早的出处." },
  { id: "decide", title: "署名", detail: "拍板的人写上名字. 写不上名字的, 继续停在未决." },
  { id: "review", title: "复盘", detail: "两周后回到这一条, 看它有没有真的发生." },
] as const;

export const FIELD_PLANS = [
  { id: FIELD_PLAN.solo, name: "个人", price: 0, period: undefined, points: ["一本田野", "无限记录", "导出纯文本"] },
  { id: FIELD_PLAN.studio, name: "工作室", price: FIELD_PRICE.studio, period: PRICE_PERIOD.month, points: ["十二个席位", "未决清单", "按周复盘"] },
  { id: FIELD_PLAN.org, name: "机构", price: FIELD_PRICE.org, period: PRICE_PERIOD.month, points: ["单点登录", "保留策略", "审计导出"] },
] as const;

export const FIELD_QUOTE = {
  text: "我们不再另开一份纪要. 会上说了什么, 周五还能指着那一行问.",
  by: "陈宁, 产品负责人, 岸本设计",
} as const;

export const KILN_GLAZE = [
  { value: "ash", label: "灰釉", color: "var(--muted)" },
  { value: "iron", label: "铁釉", color: HX_SCOPE_COLOR },
  { value: "grit", label: "砂釉", color: "var(--secondary)" },
] as const;

export const KILN_SIZE = [
  { value: "01", label: "01", stock: 12 },
  { value: "02", label: "02", stock: 4 },
] as const;

export const KILN_STEP = { glaze: "glaze", count: "how-many", ship: "ship" } as const;

export const KILN_STEPS = [
  { id: KILN_STEP.glaze, title: "釉色", detail: "灰釉偏哑光, 铁釉会把肋线收得很深, 砂釉留有颗粒." },
  { id: KILN_STEP.count, title: "数量", detail: "01 适合一人份, 02 适合两人. 同一窑次的杯子可以成对发货." },
  { id: KILN_STEP.ship, title: "配送", detail: "素烧易碎, 默认木盒. 上海仓 3 日内发出, 不与其他器物混装." },
] as const;

export const KILN_COLUMNS = [
  { id: "four", title: "窑四号", featured: true },
  { id: "two", title: "窑二号" },
] as const;

export const KILN_ROWS = [
  { label: "容量", cells: { four: "240 ml / 360 ml", two: "180 ml" } },
  { label: "肋", cells: { four: "内壁三条, 控流速", two: "没有肋" } },
  { label: "底", cells: { four: "无釉圈足, 可入烘箱", two: "满釉" } },
  { label: "产地", cells: { four: "景德镇, 柴窑", two: "景德镇, 气窑" } },
] as const;

export const KILN_NOTES = [
  { title: "手", body: "杯口略外翻, 嘴唇碰到的是一圈薄边, 不是釉的最厚处." },
  { title: "水", body: "肋只做在内壁. 水流被切成三股, 粉层不会在中心挖出一个洞." },
  { title: "火", body: "这一窑落灰偏少. 铁釉的杯子肩上会有一块更深的影, 没有两只相同." },
] as const;
