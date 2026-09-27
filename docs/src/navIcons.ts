/**
 * 每个文档页的导航图标。
 *
 * 单独一张表而不是写进 nav.ts —— 让"加一个组件"这件事在两处都很直白:
 * nav.ts 加一行元数据, 这里加一个图标 (忘了加也有默认值兜底)。
 */
export const NAV_ICONS: Record<string, string> = {
  // 基础
  install: "icon-[solar--download-minimalistic-linear]",
  tokens: "icon-[solar--palette-linear]",
  // 示例
  "settings-demo": "icon-[solar--settings-linear]",
  // 基础件
  button: "icon-[solar--cursor-square-linear]",
  input: "icon-[solar--text-field-linear]",
  switch: "icon-[solar--tuning-linear]",
  select: "icon-[solar--alt-arrow-down-linear]",
  dialog: "icon-[solar--window-frame-linear]",
  drawer: "icon-[solar--sidebar-code-linear]",
  "dropdown-menu": "icon-[solar--hamburger-menu-linear]",
  popover: "icon-[solar--chat-square-linear]",
  calendar: "icon-[solar--calendar-linear]",
  slider: "icon-[solar--slider-vertical-linear]",
  spin: "icon-[solar--refresh-linear]",
  // 版式件
  charts: "icon-[solar--chart-2-linear]",
  stepper: "icon-[solar--checklist-minimalistic-linear]",
  toast: "icon-[solar--bell-linear]",
  "code-block": "icon-[solar--code-square-linear]",
  card: "icon-[solar--card-linear]",
  badge: "icon-[solar--tag-linear]",
  "sidebar-nav": "icon-[solar--widget-2-linear]",
  "segmented-control": "icon-[solar--widget-add-linear]",
  "collapse-panel": "icon-[solar--archive-minimalistic-outline]",
  "setting-chrome": "icon-[solar--list-check-linear]",
  "app-frame": "icon-[solar--layers-minimalistic-linear]",
};

export const DEFAULT_NAV_ICON = "icon-[solar--widget-2-linear]";