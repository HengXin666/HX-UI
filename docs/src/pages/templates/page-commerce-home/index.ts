/**
 * 电商首页模板 (V2-02) 的出口. 导航与路由接线由集成任务处理, 这里只导出页面, 数据与共用外壳.
 */
export { CommerceHomePage, HOME_REGISTRY } from "./CommerceHomePage";
export { TemplateShell, type TemplateShellProps } from "./TemplateShell";
export { HOME_BLOCKS, TRENDING, GRID, type HomeBlockProps } from "./data";
export { BRAND, NAV, HEADER_ACTIONS, HOME_HEADER, FOOTER, CHECKOUT_FOOTER } from "./site-data";
export { TEMPLATE_SKINS, DEMO_CDN, demoImg, blockFactory, collectDemoKeys, withDemoMedia, injectProps } from "./compose";
