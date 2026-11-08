import { useState, type JSX } from "react";
import { BUTTON_TYPE, Backdrop, Beam, Button, Grain, MeshGradient } from "@hx/ui";
import { REPO_URL } from "../../../src/components/site";
import { FACE_BENCH } from "../../router";
import { Terminal } from "../kit/Code";
import { ARROW, BTN, TYPE, WRAP_WIDE } from "../kit/layout";
import { FACTS } from "../site-facts";
import { HeroCode } from "./HeroCode";
import { Presets } from "./Presets";
import { PRESETS, START_PRESET, type HeroParams, type ParamKey } from "./hero-model";
import { INDEX_ID } from "../../docs/constants";

export const INSTALL = "npm i @hx/ui";
/** 装完之后的下一步, 与安装页一致. */
export const INSTALL_NEXT = ["# 入口 CSS 里引一次完整样式", "@import \"@hx/ui/styles.css\";"] as const;
/** 首页标题旁的徽章: 最新一次提交上线的页面. */
const NEW_ID = "viz";
/** 首屏右上那块点阵的点距 (px), 交给库 Backdrop 的 dots. */
const DOT_GAP = 14;

function presetParams(id: string): HeroParams {
  return (PRESETS.find((preset) => preset.id === id) ?? PRESETS[0]).params;
}

/** 舞台背景: 库里的真效果件, 参数来自代码窗. */
function StageBackdrop({ params }: { readonly params: HeroParams }): JSX.Element {
  return (
    <MeshGradient colors={params.colors} intensity={params.intensity} animated className="absolute inset-0">
      <Beam angle={params.angle} x={params.x} width={params.width} intensity={params.glow} color={params.colors[1]} animated />
      <Grain opacity={params.grain} />
    </MeshGradient>
  );
}

/**
 * 首屏: 徽章, 两行标题, 两个按钮, 右侧两行说明; 下面 1364 宽的圆角舞台.
 * 舞台里代码窗的数字可拖, 预设点选, 终端逐字打出安装命令; 三者与背景共用一份参数.
 */
export function Hero({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  const [active, setActive] = useState<string | null>(START_PRESET);
  const [params, setParams] = useState<HeroParams>(() => presetParams(START_PRESET));
  const pick = (id: string): void => {
    setActive(id);
    setParams(presetParams(id));
  };
  const change = (key: ParamKey, value: number): void => {
    setActive(null);
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  return (
    <section aria-label="首屏" className={`${WRAP_WIDE} scroll-mt-24 pt-[21px]`}>
      <div className="relative">
        <Backdrop aria-hidden variant="dots" size={DOT_GAP} fade animated={false} className="pointer-events-none absolute right-[10%] top-0 hidden h-[280px] w-[420px] lg:block" />
        <button type={BUTTON_TYPE} onClick={() => onGo(NEW_ID)} className="relative inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card pl-1 pr-3 text-[13px] text-foreground transition-[background-color] hover:bg-accent focus-visible:outline-1 focus-visible:outline-ring">
          <span className="rounded-md bg-foreground px-2 py-0.5 text-[12px] font-medium text-background">新</span>
          数据可视化舞台
          <span aria-hidden className="text-muted-foreground">{ARROW}</span>
        </button>
        <h1 className={`${TYPE.h1} relative mt-[26px] max-w-[40rem]`}>
          一套按得下去的 React 组件,
          <br />
          给让人记住的页面.
        </h1>
        <div className="relative mt-[30px] flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-wrap gap-2.5">
            <Button asChild {...BTN.light}>
              <button type={BUTTON_TYPE} onClick={() => onGo(INDEX_ID)}>
                浏览组件 <span aria-hidden>{ARROW}</span>
              </button>
            </Button>
            <Button asChild {...BTN.dark}>
              <a href={REPO_URL}>
                <span aria-hidden className="icon-[mdi--github] size-4 bg-current" />
                GitHub 源码
              </a>
            </Button>
          </div>
          <p className="max-w-[24rem] pb-0.5 text-[16px] leading-[25px] text-muted-foreground">
            {FACTS.pages} 页文档, {FACTS.skins} 套皮肤, 一份语义令牌.
            <br />
            自己调参数, 或者交给你的 Agent.
          </p>
        </div>
      </div>
      <div data-hero-stage className="relative mt-[32px] overflow-hidden rounded-2xl border border-border bg-background lg:h-[849px]">
        <StageBackdrop params={params} />
        <div className="relative grid gap-4 p-4 lg:block lg:p-0">
          <HeroCode params={params} onChange={change} className="lg:absolute lg:left-[6.1%] lg:top-9 lg:w-[51.2%]" />
          <Terminal command={INSTALL} after={INSTALL_NEXT} className="lg:absolute lg:left-[62.8%] lg:top-14 lg:h-32 lg:w-[32.3%]" />
          <Presets active={active} onPick={pick} onBench={() => onGo(FACE_BENCH)} className="lg:absolute lg:left-[50.7%] lg:top-[204px] lg:w-[30.9%]" />
        </div>
      </div>
    </section>
  );
}
