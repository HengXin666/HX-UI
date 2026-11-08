import { useState, type JSX } from "react";
import { BUTTON_TYPE, GridLines, Slider, Switch, VARIANT } from "@hx/ui";
import { TONE_VARIANT } from "../../../src/constants/ui";
import { Button } from "../../../src/primitives/button";
import { Follow, SegmentedThumb } from "../../../src/craft";
import { CARD_AT_MS, SHOT1_END_MS, cardPose, titlePose } from "./shot-hero";
import { useShotClock } from "./use-clock";
import { FACTS, VERSION } from "./site-facts";

const INSTALL = "npm i @hx/ui";
const COPIED_MS = 1600;
const SLIDER_START = 64;

const PROOF = [
  { name: "语义令牌", line: "颜色只来自 token, 亮暗与每套皮肤共用一份" },
  { name: "1px 线条", line: "边, 分隔, 焦点环都是一像素, 不靠阴影撑层次" },
  { name: "可中断弹簧", line: "按下 90ms, 松开带着当前速度继续, 不从 0 重播" },
] as const;

const PAGES = [
  { value: "field" as const, label: "田野" },
  { value: "kiln" as const, label: "窑四号" },
];

/** 右栏画框: 真组件, 不是截图. */
function LiveFrame(): JSX.Element {
  const [page, setPage] = useState<"field" | "kiln">("field");
  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex justify-between border-b border-border px-4 py-3 font-mono text-[0.65rem] tracking-[0.12em] text-muted-foreground">
        <span>HX UI / LIVE</span>
        <span>v{VERSION}</span>
      </div>
      <div className="grid gap-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-foreground">整页</span>
          <SegmentedThumb
            ariaLabel="整页"
            options={PAGES}
            value={page}
            onChange={(next) => {
              if (next === "field" || next === "kiln") setPage(next);
            }}
          />
        </div>
        <label className="flex items-center justify-between gap-4 text-sm text-foreground">
          跟随系统主题
          <Switch defaultChecked aria-label="跟随系统主题" />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm text-foreground">
          紧凑密度
          <Switch aria-label="紧凑密度" />
        </label>
        <div className="grid gap-2">
          <span className="text-sm text-foreground">圆角</span>
          <Slider defaultValue={[SLIDER_START]} aria-label="圆角" />
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type={BUTTON_TYPE} variant={TONE_VARIANT.outline}>取消</Button>
          <Button type={BUTTON_TYPE} variant={VARIANT.primary}>保存</Button>
        </div>
      </div>
      <figcaption className="border-t border-border px-4 py-3 text-xs leading-normal text-muted-foreground">
        这不是截图. 按住保存再松开, 拖一下拇指, 速度还在.
      </figcaption>
    </figure>
  );
}

/** 镜 0 与镜 1: 首屏. 主角是那一句, 其余文字和画框在它静止之后一组进入. */
export function HeroShot({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  const ms = useShotClock(SHOT1_END_MS);
  const title = titlePose(ms);
  const card = cardPose(ms);
  const [copied, setCopied] = useState(false);
  const group = { opacity: card.opacity, transform: `translate3d(${card.x}px, 0, 0)` };
  const copy = (): void => {
    void navigator.clipboard?.writeText(INSTALL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <GridLines className="border-b border-border text-border">
      <section
        data-shot="1"
        data-card-at={CARD_AT_MS}
        className="relative mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-[78rem] grid-cols-1 items-center gap-12 px-5 py-16 md:grid-cols-[minmax(20rem,0.9fr)_minmax(26rem,1.1fr)] md:px-8 lg:gap-16 lg:px-14"
      >
        <div className="max-w-[40rem]">
          <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground" style={group}>HX UI / v{VERSION}</p>
          <h1
            data-shot-part="title"
            className="mt-5 text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
            style={{ opacity: title.opacity, transform: `translate3d(0, ${title.y}px, 0) scale(${title.scale})`, transformOrigin: "left center" }}
          >
            先把一页排完.
          </h1>
          <div style={group}>
            <p className="mt-7 max-w-[35rem] text-base leading-[1.85] text-muted-foreground">
              React 19 与 Tailwind 4 的组件库. {FACTS.pages} 页文档, 从按钮到整页模板, 每个控件的按下, 松开, 聚焦都按同一份分态合同打磨.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button type={BUTTON_TYPE} variant={VARIANT.primary} onClick={() => onGo("install")}>开始使用 →</Button>
              <Button type={BUTTON_TYPE} variant={TONE_VARIANT.outline} onClick={() => onGo("button")}>浏览组件</Button>
            </div>
            <div className="mt-6 flex max-w-sm items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm">
              <span className="text-foreground"><span className="text-muted-foreground">$ </span>{INSTALL}</span>
              <button type={BUTTON_TYPE} className="text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" onClick={copy}>
                {copied ? "已复制" : "复制"}
              </button>
            </div>
            <ul aria-label="三条硬约束" className="mt-10 grid list-none border-t border-border p-0">
              {PROOF.map((item) => (
                <li key={item.name} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-border py-3 text-xs">
                  <strong className="font-semibold text-foreground">{item.name}</strong>
                  <span className="text-muted-foreground">{item.line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div data-shot-part="card" style={group}>
          <Follow>
            <LiveFrame />
          </Follow>
        </div>
      </section>
    </GridLines>
  );
}
