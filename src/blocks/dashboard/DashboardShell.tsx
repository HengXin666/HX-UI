"use client";

import * as React from "react";
import { DASH_CLASS, DASH_DEFAULT, DASH_ICON, DASH_SLOT, dashText, type DASH_SHELL_SLOTS, type DashText } from "../../constants/blocks-dashboard-v110";
import { BLOCK_ATTR } from "../../constants/blocks";
import { IconSlot } from "../../layout/Icon";
import { Button } from "../../primitives/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../../primitives/sheet";
import { cn } from "../../primitives/utils";
import { resolveSlots } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import type { BlockBaseProps, BlockDensity, LinkGroup, Rich, SlotClassNames } from "../_shared/types";

export type DashboardShellSlot = (typeof DASH_SHELL_SLOTS)[number];

export interface DashboardShellState {
  collapsed: boolean;
}

export interface DashboardShellProps extends Omit<BlockBaseProps, "classNames" | "labels" | "tone" | "pad" | "width" | "align" | "backdrop" | "as" | "reveal"> {
  /** 侧栏导航分组 (LinkItem.icon 在折叠态作为唯一可见内容, 建议都给). */
  sidebar: ReadonlyArray<LinkGroup>;
  /** 完整顶栏节点; 给了就替换内置顶栏. */
  header?: React.ReactNode;
  /** 侧栏顶部品牌位. */
  brand?: React.ReactNode;
  /** 内置顶栏标题 (当前页名). */
  title?: Rich;
  /** 内置顶栏右侧动作 (搜索, 通知, 账号菜单). */
  actions?: React.ReactNode;
  /** 侧栏底部 (账号卡, 用量). */
  sidebarFooter?: React.ReactNode;
  /** 当前路径, 用于 aria-current (item.current 优先). */
  currentHref?: string;
  /** 侧栏折叠到图标: 受控 / 非受控 / 回调 (component-contract 2.1). */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 区块密度; 默认 compact (设计文档 3.4), 写到根节点 data-density. */
  density?: BlockDensity;
  mainId?: string;
  classNames?: SlotClassNames<DashboardShellSlot, DashboardShellState>;
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLDivElement>;
  children?: React.ReactNode;
}

interface NavProps {
  groups: ReadonlyArray<LinkGroup>;
  label: string;
  currentHref?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

/** 侧栏导航: 分组标题 + 链接; 折叠态只留图标, 文字转为 title 与读屏文本. 桌面栏与移动 Sheet 共用. */
function DashboardNav({ groups, label, currentHref, collapsed = false, onNavigate, className }: NavProps): React.JSX.Element {
  return (
    <nav aria-label={label} data-slot={DASH_SLOT.nav} className={cn(DASH_CLASS.nav, className)}>
      {groups.map((group, gi) => (
        <div key={typeof group.title === "string" ? group.title : gi} data-slot={DASH_SLOT.navGroup} className={DASH_CLASS.navGroup}>
          <p className={collapsed ? DASH_CLASS.srOnly : DASH_CLASS.navGroupTitle}>{group.title}</p>
          <ul className={DASH_CLASS.navGroup}>
            {group.items.map((item) => {
              const current = item.current ?? (currentHref !== undefined && item.href === currentHref);
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    data-slot={DASH_SLOT.navLink}
                    aria-current={current ? "page" : undefined}
                    title={collapsed && typeof item.label === "string" ? item.label : undefined}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer noopener" : undefined}
                    onClick={onNavigate}
                    className={cn(DASH_CLASS.navLink, DASH_CLASS.focus, collapsed && DASH_CLASS.navCollapsed)}
                  >
                    <IconSlot source={item.icon} className={DASH_CLASS.navIcon} />
                    <span className={collapsed ? DASH_CLASS.srOnly : DASH_CLASS.navLabel}>{item.label}</span>
                    {item.badge !== undefined && !collapsed && <span className={DASH_CLASS.navBadge}>{item.badge}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

interface TopbarProps {
  title?: Rich;
  actions?: React.ReactNode;
  sidebar: ReadonlyArray<LinkGroup>;
  currentHref?: string;
  collapsed: boolean;
  onToggle: () => void;
  text: DashText;
  className?: string;
}

/** 内置顶栏: 窄容器显示菜单按钮 (侧栏进 Sheet), 宽容器显示折叠按钮. */
function DashboardTopbar({ title, actions, sidebar, currentHref, collapsed, onToggle, text, className }: TopbarProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  return (
    <header data-slot={DASH_SLOT.topbar} className={cn(DASH_CLASS.topbar, className)}>
      {sidebar.length > 0 && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className={DASH_CLASS.menuButton} aria-label={text.openSidebar}>
              <IconSlot source={DASH_ICON.menu} className={DASH_CLASS.navIcon} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className={DASH_CLASS.sheet}>
            <SheetTitle className={DASH_CLASS.srOnly}>{text.sidebar}</SheetTitle>
            <DashboardNav groups={sidebar} label={text.sidebar} currentHref={currentHref} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={DASH_CLASS.collapseButton}
        aria-label={collapsed ? text.expandSidebar : text.collapseSidebar}
        aria-pressed={collapsed}
        onClick={onToggle}
      >
        <IconSlot source={DASH_ICON.collapse} className={cn(DASH_CLASS.navIcon, DASH_CLASS.flipRtl)} />
      </Button>
      <div className={DASH_CLASS.topbarTitle}>{title}</div>
      {actions !== undefined && <div className={DASH_CLASS.topbarActions}>{actions}</div>}
    </header>
  );
}

/**
 * 仪表盘外壳 (设计文档 4.5): 侧栏 (分组, 当前项高亮, 可折叠到图标) + 顶栏 + 主区.
 * 容器 ≥ @4xl 显示固定侧栏, 以下侧栏进左侧 Sheet; 默认 data-density="compact", 可被 density 或祖先覆盖.
 * 侧栏宽度由 --dash-sidebar-width / --dash-sidebar-collapsed 控制.
 */
export function DashboardShell({
  sidebar,
  header,
  brand,
  title,
  actions,
  sidebarFooter,
  currentHref,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  density,
  mainId,
  classNames,
  labels,
  slots,
  className,
  style,
  id,
  ref,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: DashboardShellProps): React.JSX.Element {
  const { locale } = useBlocks();
  const text = dashText(locale, labels);
  const [innerCollapsed, setInnerCollapsed] = React.useState(defaultCollapsed);
  const collapsed = collapsedProp ?? innerCollapsed;
  const toggle = (): void => {
    if (collapsedProp === undefined) setInnerCollapsed(!collapsed);
    onCollapsedChange?.(!collapsed);
  };
  const generatedId = React.useId();
  const contentId = mainId ?? `${generatedId}-main`;
  const cls = resolveSlots<DashboardShellSlot, DashboardShellState, string>(classNames, { collapsed });
  const attrs = { [BLOCK_ATTR.density]: density ?? DASH_DEFAULT.density };
  return (
    <div
      ref={ref}
      id={id}
      style={style}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-slot={DASH_SLOT.shell}
      data-collapsed={collapsed ? "true" : undefined}
      {...attrs}
      className={cn(DASH_CLASS.shellRoot, cls.root, className)}
    >
      <a href={`#${contentId}`} className={DASH_CLASS.skip}>
        {text.skipToContent}
      </a>
      <aside data-slot={DASH_SLOT.sidebar} data-collapsed={collapsed ? "true" : "false"} className={cn(DASH_CLASS.sidebarCol, cls.sidebar)}>
        {brand !== undefined && <div className={DASH_CLASS.sidebarHead}>{collapsed ? null : <div className={DASH_CLASS.sidebarBrand}>{brand}</div>}</div>}
        <div className={DASH_CLASS.sidebarScroll}>
          <DashboardNav groups={sidebar} label={text.sidebar} currentHref={currentHref} collapsed={collapsed} className={cls.nav} />
        </div>
        {sidebarFooter !== undefined && !collapsed && <div className={DASH_CLASS.sidebarFoot}>{sidebarFooter}</div>}
      </aside>
      <div className={DASH_CLASS.main}>
        {header ?? (
          <DashboardTopbar
            title={title}
            actions={actions}
            sidebar={sidebar}
            currentHref={currentHref}
            collapsed={collapsed}
            onToggle={toggle}
            text={text}
            className={cls.topbar}
          />
        )}
        <main id={contentId} tabIndex={-1} data-slot={DASH_SLOT.main} className={cn(DASH_CLASS.content, cls.main)}>
          {slots?.before}
          {children}
          {slots?.after}
        </main>
      </div>
    </div>
  );
}
