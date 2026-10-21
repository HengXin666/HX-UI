import type { JSX } from "react";
import { TemplateChatPage } from "./chat";
import { TemplateSettingsPage } from "./settings";
import { TemplateDashboardPage } from "./dashboard";
import { TemplateConsolePage } from "./console";

/**
 * 现成实例页面模板, 按导航 id 查表.
 *
 * 模板页与组件页的区别只在**读者要什么**: 组件页回答"这个 props 怎么用",
 * 模板页回答"整页怎么搭, 抄哪一段"。所以模板页固定给出三步套用说明,
 * 再按真实窗口尺寸画框, 并提供一份可以直接粘进项目的代码。
 */
export { TemplateChatPage, TemplateConsolePage, TemplateDashboardPage, TemplateSettingsPage };

/**
 * .agents/notes/implemented/feature/2026-10-22-docs-nav-groups-and-templates.md
 */
export const TEMPLATE_PAGES: Readonly<Record<string, () => JSX.Element>> = {
  "templates-chat": TemplateChatPage,
  "templates-settings": TemplateSettingsPage,
  "templates-dashboard": TemplateDashboardPage,
  "templates-console": TemplateConsolePage,
};
