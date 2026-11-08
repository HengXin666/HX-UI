import { useEffect, useState, type JSX } from "react";
import { BUTTON_TYPE } from "@hx/ui";
import { ThemeToggle } from "../../src/components/ThemeToggle";
import { REPO_URL, TEMPLATE_ENTRY } from "../../src/components/site";
import { FACE_BENCH, FACE_HOME } from "../router";
import { VERSION } from "../home/site-facts";
import { BTN } from "../home/kit/layout";
import { INDEX_ID } from "../docs/constants";

/** 滚过这么多 (舞台顶碰到顶栏底) 后顶栏收成两侧内缩的浮动条. */
const FLOAT_AT = 280;
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

function useFloating(enabled: boolean): boolean {
  const [floating, setFloating] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const read = (): void => setFloating(window.scrollY > FLOAT_AT);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [enabled]);
  return enabled && floating;
}

export interface TopBarProps {
  readonly go: (id: string) => void;
  /** 首页: 贴顶全宽, 滚过首屏变浮动条. 其余页: 48 高的贴顶条. */
  readonly home: boolean;
  /** 文档页的窄屏导航按钮, 首页不传. */
  readonly onMenu?: () => void;
  readonly menuOpen?: boolean;
  readonly onSearch: () => void;
}

/** 站点顶栏: 左 logo / 文档 组件 模板 工具, 右 主题, 源码 v{VERSION}, 浏览组件. 首页与文档页共用. */
export function TopBar({ go, home, onMenu, menuOpen, onSearch }: TopBarProps): JSX.Element {
  const floating = useFloating(home);
  const outer = home
    ? `sticky top-0 z-30 flex h-24 items-center px-4 transition-[background-color] ${floating ? "pointer-events-none bg-transparent md:px-[44px]" : "bg-background md:pl-[44px] md:pr-[32px]"}`
    : "sticky top-0 z-30 flex h-12 items-center border-b border-border bg-background/85 px-3 backdrop-blur md:px-5";
  const bar = home
    ? `pointer-events-auto mx-auto flex h-14 w-full items-center gap-3 rounded-[14px] border transition-[max-width,padding,background-color,border-color,box-shadow] duration-300 ${
        floating ? "max-w-[1276px] border-border bg-card/80 pl-5 pr-2 shadow-lg backdrop-blur-xl" : "max-w-[1364px] border-transparent bg-transparent px-0"
      }`
    : "flex w-full items-center gap-3";
  return (
    <header data-topbar={floating ? "float" : "top"} className={outer}>
      <div className={bar}>
        {onMenu ? (
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
        ) : null}
        <button type={BUTTON_TYPE} onClick={() => go(FACE_HOME)} className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[15px] font-medium tracking-tight text-heading">
          <img src="./logo.svg" alt="" width={22} height={22} className="size-[22px]" />
          HX UI
        </button>
        <span aria-hidden className="hidden px-2 text-[17px] text-muted-foreground md:inline">/</span>
        <nav aria-label="站点" className="hidden items-center gap-1 md:flex">
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
        <div className="ml-auto flex items-center gap-2">
          <button type={BUTTON_TYPE} aria-label="打开搜索" onClick={onSearch} className="grid size-9 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground transition-[color] hover:text-foreground">
            <span aria-hidden className="icon-[solar--magnifier-linear] size-4 bg-current" />
          </button>
          <span className="grid size-9 place-items-center rounded-lg border border-border bg-secondary">
            <ThemeToggle />
          </span>
          <span className="hidden sm:block">
            <a href={REPO_URL} className={`${BTN.chip} whitespace-nowrap`}>
              <span aria-hidden className="icon-[mdi--github] size-4 bg-current" />
              源码 <span className="font-mono text-[12px] text-muted-foreground">v{VERSION}</span>
            </a>
          </span>
          <button type={BUTTON_TYPE} onClick={() => go(FIRST_COMPONENT)} className={`${BTN.primary} whitespace-nowrap`}>浏览组件</button>
        </div>
      </div>
    </header>
  );
}
