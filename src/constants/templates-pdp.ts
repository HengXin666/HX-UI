/**
 * PDP 模板 (src/page/pdp.ts) 的常量: 拍的 id, 每拍按顺序挑的镜头偏好, 默认文案.
 */

export const PDP_BEAT = { buy: "buy", proof: "proof", more: "more" } as const;

/** 每拍的镜头偏好: 取第一个在方向白名单里的; 都不在时取白名单第一张. */
export const PDP_SHOT_PREFERENCE = {
  buy: ["spotlightHeroCard", "craneRiseReveal"],
  proof: ["scanlineAnnotate", "craneRiseReveal", "cardFlipReveal"],
  more: ["deckDeal", "cardFlipReveal", "letterspaceMaterialize"],
} as const;

export const PDP_TEXT = {
  buyLead: "所选颜色的实拍, 价格与库存",
  proofLead: "评分分布, 可按星级筛",
  moreLead: "搭配推荐",
  reviews: "评价",
  related: "一起带上",
  addToCart: "加入购物车",
  save: "收藏",
} as const;

/** 推荐商品的链接前缀. */
export const PDP_PRODUCT_HREF = "#product-";
