/**
 * 商品详情页与结账页模板 (V2-02) 的出口. 导航与路由接线由集成任务处理, 这里只导出页面与数据.
 */
export { ProductPage, PRODUCT_REGISTRY } from "./ProductPage";
export { CheckoutPage, CHECKOUT_REGISTRY } from "./checkout";
export { PRODUCT_BLOCKS, type ProductBlockProps } from "./data";
export { CHECKOUT_HEADER, CHECKOUT_STEPS, CHECKOUT_SUMMARY, type CheckoutField, type CheckoutChoice, type CheckoutStepMeta } from "./checkout-data";
