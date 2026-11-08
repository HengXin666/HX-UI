import type { JSX } from "react";
import { BUTTON_TYPE, Grain, MeshGradient } from "@hx/ui";
import { REPO_URL, TEMPLATE_ENTRY } from "../../../src/components/site";
import { FACE_BENCH } from "../../router";
import { ARROW, BTN, WRAP } from "../kit/layout";
import { VERSION } from "../site-facts";
import { INDEX_ID } from "../../docs/constants";

const BOARD_COLORS = ["primary", "link", "primary", "primary"] as const;
const BOARD_INTENSITY = 1;
const YEAR = 2026;

interface FooterLink {
  readonly label: string;
  readonly id?: string;
  readonly href?: string;
}

const COLUMNS: ReadonlyArray<{ readonly title: string; readonly links: readonly FooterLink[] }> = [
  { title: "社区", links: [{ label: "GitHub", href: REPO_URL }, { label: "提交记录", href: `${REPO_URL}/commits` }, { label: "问题反馈", href: `${REPO_URL}/issues` }] },
  { title: "文档", links: [{ label: "安装", id: "install" }, { label: "组件", id: INDEX_ID }, { label: "设计令牌", id: "tokens" }, { label: "皮肤", id: "skins" }] },
  { title: "模板", links: [{ label: "整页模板", id: TEMPLATE_ENTRY }, { label: "区块", id: "blocks-hero" }, { label: "整页描述", id: "page" }, { label: "Playground", id: FACE_BENCH }] },
];

const LINK = "text-[13px] text-muted-foreground transition-[color] hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring";

/** 点阵字标: 一层安静的点阵铺底, 字形里的点亮一档. 用 SVG pattern 填字, 字仍是文字. */
const WORD_W = 1264;
/**
 * 滚到底时整块收尾板 (不止标题) 都要落在浮动顶栏 (底边 76) 下面, 再留 8.
 * 板以下的页脚固定占 253, 剩下的视口先缩字标 (150 → 40), 再缩板 (384 → 280, 标题上距跟着 104 → 32).
 * 900 高时三者都是满值, 对着实拍 rb-8100; 窄屏另走一套更矮的板, 字标不出.
 */
const WORD_H = 150;
const WORD_HEIGHT = `clamp(40px, calc(100svh - 721px), ${WORD_H}px)`;
const DOT_STEP = 9;
const DOT_R = 1.3;

function DotWordmark(): JSX.Element {
  return (
    <div aria-hidden style={{ height: WORD_HEIGHT }} className="mt-10 hidden overflow-hidden md:block [mask-image:linear-gradient(to_bottom,transparent,black_45%)]">
      <svg viewBox={`0 0 ${WORD_W} ${WORD_H}`} preserveAspectRatio="xMidYMax slice" className="size-full">
        <defs>
          <pattern id="hx-dots-base" width={DOT_STEP} height={DOT_STEP} patternUnits="userSpaceOnUse">
            <circle cx={DOT_STEP / 2} cy={DOT_STEP / 2} r={DOT_R} className="fill-border-strong" />
          </pattern>
          <pattern id="hx-dots-word" width={DOT_STEP} height={DOT_STEP} patternUnits="userSpaceOnUse">
            <circle cx={DOT_STEP / 2} cy={DOT_STEP / 2} r={DOT_R} className="fill-muted-foreground" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hx-dots-base)" />
        <text x="50%" y={WORD_H + 36} textAnchor="middle" fill="url(#hx-dots-word)" className="font-sans" fontSize={300} fontWeight={700} letterSpacing={-8}>
          HX UI
        </text>
      </svg>
    </div>
  );
}

/** 收尾: 渐变板 (库里的 MeshGradient), 页脚三列, 点阵字标, 同在一张外框里. */
export function Closing({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  const go = (link: FooterLink): JSX.Element =>
    link.href ? (
      <a key={link.label} href={link.href} className={LINK}>{link.label}</a>
    ) : (
      <button key={link.label} type={BUTTON_TYPE} onClick={() => onGo(link.id ?? "")} className={`${LINK} text-left`}>{link.label}</button>
    );
  return (
    <footer className={`${WRAP} pt-[152px]`}>
      <div className="overflow-hidden rounded-[18px] border border-border bg-card/60 p-1.5 pb-0">
        <MeshGradient colors={BOARD_COLORS} intensity={BOARD_INTENSITY} animated className="rounded-[13px] border border-border-muted bg-background">
          <span aria-hidden className="pointer-events-none absolute inset-0 -z-[1] bg-gradient-to-b from-background via-background/40 to-transparent" />
          <Grain opacity={0.12} />
          <div className="flex h-[248px] md:h-[clamp(280px,calc(100svh-377px),384px)] flex-col items-center justify-start px-6 pt-[32px] md:pt-[clamp(32px,calc(100svh-657px),104px)] text-center">
            <h2 className="m-0 text-[30px] font-medium tracking-[-0.03em] text-heading md:text-[40px]">做一页让人记住的.</h2>
            <p className="mt-4 max-w-[26rem] text-[15px] leading-[22px] text-muted-foreground">从组件开始. 要整页的时候, 模板, 区块和整页描述都在这里.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <button type={BUTTON_TYPE} className={`${BTN.light} h-[43px]`} onClick={() => onGo(INDEX_ID)}>
                浏览组件 <span aria-hidden>{ARROW}</span>
              </button>
              <button type={BUTTON_TYPE} className={`${BTN.primary} h-[43px] px-5 text-[14px]`} onClick={() => onGo(TEMPLATE_ENTRY)}>看整页模板</button>
            </div>
          </div>
        </MeshGradient>
        <div className="flex flex-wrap justify-between gap-8 px-5 pb-6 pt-8 md:gap-10 md:px-8 md:pb-0 md:pt-10">
          <div>
            <p className="m-0 flex items-center gap-3 text-[26px] font-medium tracking-tight text-heading">
              <img src="./logo.svg" alt="" width={32} height={32} />
              HX UI
            </p>
            <p className="mt-4 hidden text-[13px] leading-5 text-muted-foreground md:block">
              按得下去的 React 组件.
              <br />
              开源, 语义令牌, 一键换肤.
            </p>
            <p className="mt-6 flex flex-wrap gap-x-3 md:mt-12 text-[12px] text-muted-foreground">
              <span>&copy; {YEAR} HX UI</span>
              <span aria-hidden>&middot;</span>
              <span>v{VERSION}</span>
              <span aria-hidden>&middot;</span>
              <a href={`${REPO_URL}/blob/main/LICENSE`} className={LINK}>Apache-2.0</a>
            </p>
          </div>
          <nav aria-label="页脚" className="flex gap-8 md:gap-16">
            {COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-3">
                <p className="m-0 mb-1.5 text-[13px] font-medium text-heading">{column.title}</p>
                {column.links.map(go)}
              </div>
            ))}
          </nav>
        </div>
        <DotWordmark />
      </div>
    </footer>
  );
}
