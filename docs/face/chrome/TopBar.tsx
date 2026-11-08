import type { JSX } from "react";
import { BUTTON_TYPE, Button, SiteHeader } from "@hx/ui";
import { ThemeToggle } from "../../src/components/ThemeToggle";
import { REPO_URL, TEMPLATE_ENTRY } from "../../src/components/site";
import { FACE_BENCH, FACE_HOME } from "../router";
import { VERSION } from "../home/site-facts";
import { BTN } from "../home/kit/layout";
import { INDEX_ID } from "../docs/constants";

/** 滚过这么多 (舞台顶碰到顶栏底) 后顶栏收成两侧内缩的浮动条; 交给库 SiteHeader 的 scrollThreshold. */
const FLOAT_AT = 280;
/** 文档页不浮动: 阈值放到够不着. */
const NEVER = Number.POSITIVE_INFINITY;
/** 首页顶栏占位高: 浮动条 56 高, 上下各留 20. */
export const TOPBAR_PX = 96;
/** 顶栏 "组件" 与 CTA "浏览组件" 都落在组件索引页. */
const FIRST_COMPONENT = INDEX_ID;

const LINKS: ReadonlyArray<{ readonly label: string; readonly id: string }> = [
  { label: "文档", id: "install" },
  { label: "组件", id: FIRST_COMPONENT },
  { label: "模板", id: TEMPLATE_ENTRY },
  { label: "工具", id: FACE_BENCH },
];

/** 库 SiteHeader 根节点自带的底边, 底色与滚动后的模糊阴影, 门面一律自己给, 先清掉. */
const ROOT_RESET =
  "z-30 border-b-0 data-scrolled:bg-transparent data-scrolled:shadow-none data-scrolled:supports-backdrop-filter:backdrop-blur-none";
/** 容器: 去掉库的内容宽, 内边距与高度档, 间距回到 12. */
const BAR_RESET = "mx-0 gap-3 px-0";
/** 首页: 贴顶全宽, 滚过 FLOAT_AT 变浮动条. */
const HOME_ROOT = `${ROOT_RESET} flex h-24 items-center px-4 transition-[background-color]`;
const HOME_TOP = "bg-background md:pl-[44px] md:pr-[32px]";
const HOME_FLOAT = "pointer-events-none bg-transparent md:px-[44px]";
const HOME_BAR = `${BAR_RESET} pointer-events-auto mx-auto h-14 w-full rounded-[14px] border transition-[max-width,padding,background-color,border-color,box-shadow] duration-300`;
const BAR_TOP = "max-w-[1364px] border-transparent bg-transparent px-0";
const BAR_FLOAT = "max-w-[1276px] border-border bg-card/80 pl-5 pr-2 shadow-lg backdrop-blur-xl";
/** 其余页: 48 高的贴顶条. */
const DOC_ROOT = `${ROOT_RESET} flex h-12 items-center border-b border-border bg-background/85 px-3 backdrop-blur md:px-5`;
const DOC_BAR = `${BAR_RESET} h-auto max-w-none`;
/** 库把 actions 收到 md 以上, 把 mobileNav 放在最右; 门面右侧操作窄屏也在, 菜单键在最左. */
const ACTIONS = "flex";
const MOBILE = "order-first ml-0 gap-0";
const NAV = "flex-none";

export interface TopBarProps {
  readonly go: (id: string) => void;
  /** 首页: 贴顶全宽, 滚过首屏变浮动条. 其余页: 48 高的贴顶条. */
  readonly home: boolean;
  /** 文档页的窄屏导航按钮, 首页不传. */
  readonly onMenu?: () => void;
  readonly menuOpen?: boolean;
  readonly onSearch: () => void;
}

/** 站点顶栏 (库里的 SiteHeader): 左 logo / 文档 组件 模板 工具, 右 主题, 源码 v{VERSION}, 浏览组件. 首页与文档页共用. */
export function TopBar({ go, home, onMenu, menuOpen, onSearch }: TopBarProps): JSX.Element {
  const brand = (
    <>
      <button type={BUTTON_TYPE} onClick={() => go(FACE_HOME)} className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[15px] font-medium tracking-tight text-heading">
        <img src="./logo.svg" alt="" width={22} height={22} className="size-[22px]" />
        HX UI
      </button>
      <span aria-hidden className="hidden px-2 text-[17px] text-muted-foreground md:inline">/</span>
    </>
  );
  const nav = (
    <nav aria-label="站点" className="flex items-center gap-1">
      {LINKS.map((link) => (
        <button
          key={link.id}
          type={BUTTON_TYPE}
          onClick={() => go(link.id)}
          className="rounded-md px-3 py-1.5 text-[13px] font-medium tracking-wide text-foreground transition-[color] hover:text-heading focus-visible:outline-1 focus-visible:outline-ring"
        >
          {link.label}
        </button>
      ))}
    </nav>
  );
  const actions = (
    <>
      <button type={BUTTON_TYPE} aria-label="打开搜索" onClick={onSearch} className="grid size-9 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground transition-[color] hover:text-foreground">
        <span aria-hidden className="icon-[solar--magnifier-linear] size-4 bg-current" />
      </button>
      <span className="grid size-9 place-items-center rounded-lg border border-border bg-secondary">
        <ThemeToggle />
      </span>
      <span className="hidden sm:block">
        <Button asChild {...BTN.chip}>
          <a href={REPO_URL}>
            <span aria-hidden className="icon-[mdi--github] size-4 bg-current" />
            源码 <span className="font-mono text-[12px] text-muted-foreground">v{VERSION}</span>
          </a>
        </Button>
      </span>
      <Button asChild {...BTN.primary}>
        <button type={BUTTON_TYPE} onClick={() => go(FIRST_COMPONENT)}>浏览组件</button>
      </Button>
    </>
  );
  const menu = onMenu ? (
    <button
      type={BUTTON_TYPE}
      aria-label="打开导航"
      aria-controls="docs-navigation"
      aria-expanded={menuOpen}
      className="grid size-8 place-items-center rounded-md border border-border md:hidden"
      onClick={onMenu}
    >
      <span aria-hidden className="icon-[solar--hamburger-menu-linear] size-4 bg-current" />
    </button>
  ) : undefined;
  return (
    <SiteHeader
      brand={brand}
      nav={nav}
      actions={actions}
      mobileNav={menu}
      scrollThreshold={home ? FLOAT_AT : NEVER}
      classNames={({ scrolled }) => ({
        root: home ? `${HOME_ROOT} ${scrolled ? HOME_FLOAT : HOME_TOP}` : DOC_ROOT,
        container: home ? `${HOME_BAR} ${scrolled ? BAR_FLOAT : BAR_TOP}` : DOC_BAR,
        brand: "gap-3",
        nav: NAV,
        actions: ACTIONS,
        mobile: MOBILE,
      })}
    />
  );
}
