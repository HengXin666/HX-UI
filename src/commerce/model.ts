/**
 * 内容模型入口 (src/commerce/model.ts): 类型, 选择与库存的纯函数, 校验, 适配, 假数据.
 */
export type { ModelMedia, OptionAxis, OptionKind, OptionValueModel, ProductModel, RatingModel, ReviewModel, Selection, ValueState, VariantModel } from "./catalog";
export { axisAvailability, candidates, defaultSelection, describeSelection, findVariant, priceRange, selectValue, type PriceRange, type ValueAvailability } from "./variant";
export { filterReviews, summarizeReviews, type ReviewSummary, type StarBucket } from "./review";
export { validateProduct, type ProductIssue, type ProductIssueCode } from "./validate";
export { detailOptions, galleryOrder, productLdInput, stockOf, toProductCard, toProductDetail } from "./adapt";
export { sampleProduct, sampleRelated, sampleReviews } from "./fixtures";
export { MODEL_LOW_STOCK, OPTION_KIND, PRODUCT_ISSUE, VALUE_STATE } from "../constants/model-commerce";
