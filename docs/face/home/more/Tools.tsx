import { useState, type JSX } from "react";
import { BUTTON_TYPE, SKIN_ATTR, SKIN_LIST, Slider, Switch, VARIANT } from "@hx/ui";
import { Button } from "../../../../src/primitives/button";
import { NumberRoll } from "../../../../src/craft";
import { Spark } from "../../../../src/studio";
import { FACE_BENCH } from "../../router";
import { SectionHead, Tile } from "../kit/Tile";
import { WRAP } from "../kit/layout";

const TOP_H = 278;
const LOW_H = 282;
const SLIDER_MAX = 100;
const SLIDER_START = 64;
const SPARK = [12, 18, 15, 26, 22, 31, 29, 42] as const;
const SWATCHES = ["background", "card", "muted", "border", "primary", "accent-2", "success", "warning", "destructive", "info", "foreground", "muted-foreground"] as const;
const PAGE_SNIPPET = ["const spec = definePage({", "  sections: [hero, features, pricing],", "});", "<Page spec={spec} />"] as const;

/** Playground 的缩样: 真按钮, 真开关, 真滑块驱动真 NumberRoll. */
function BenchArt(): JSX.Element {
  const [value, setValue] = useState(SLIDER_START);
  const [on, setOn] = useState(true);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-10">
      <p className="m-0 font-mono text-[44px] leading-none text-heading"><NumberRoll value={value} /></p>
      <Slider value={[value]} max={SLIDER_MAX} onValueChange={(next) => setValue(next[0] ?? 0)} aria-label="数值" className="max-w-[18rem]" />
      <div className="flex items-center gap-4">
        <Switch checked={on} onCheckedChange={setOn} aria-label="开关" />
        <Button type={BUTTON_TYPE} variant={VARIANT.primary} loading={!on}>保存</Button>
      </div>
    </div>
  );
}

/** 皮肤: 同一组件放进五套 data-skin, 读的是各自的令牌. */
function SkinArt(): JSX.Element {
  return (
    <div className="grid h-full grid-cols-5 gap-2 p-4">
      {SKIN_LIST.slice(1, 6).map((skin) => (
        <div key={skin.name} {...{ [SKIN_ATTR.skin]: skin.name }} className="flex flex-col justify-between rounded-xl border border-border bg-background p-3 text-foreground">
          <span className="text-[12px] text-muted-foreground">{skin.label}</span>
          <span className="space-y-2">
            <span className="block h-1.5 w-3/4 rounded-full bg-muted-foreground/40" />
            <span className="block h-1.5 w-1/2 rounded-full bg-muted-foreground/25" />
          </span>
          <span className="grid h-7 place-items-center rounded-md bg-primary text-[11px] text-primary-foreground">按钮</span>
        </div>
      ))}
    </div>
  );
}

function TokensArt(): JSX.Element {
  return (
    <div className="grid h-full grid-cols-6 content-center gap-2 p-5">
      {SWATCHES.map((token) => (
        <span key={token} title={`--${token}`} className="aspect-square rounded-lg border border-border" style={{ background: `var(--${token})` }} />
      ))}
    </div>
  );
}

function VizArt(): JSX.Element {
  return (
    <div className="flex h-full items-center px-8 text-foreground">
      <Spark values={SPARK} label="近八周完成的决定" className="h-24 w-full" />
    </div>
  );
}

function PageArt(): JSX.Element {
  return (
    <pre className="m-0 flex h-full flex-col justify-center px-6 font-mono text-[13px] leading-6 text-foreground">
      {PAGE_SNIPPET.map((line) => <span key={line} className="whitespace-pre">{line}</span>)}
    </pre>
  );
}

/** 工具 (对标 Five free tools): 两大三小, 全是文档站里真实存在的工具页. */
export function Tools({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <section aria-labelledby="tools-title" className={`${WRAP} pt-[96px]`}>
      <SectionHead title={<span id="tools-title">五个工具, 都在浏览器里</span>} />
      <div className="mt-10 grid gap-[13px] md:grid-cols-2">
        <Tile art={<BenchArt />} artHeight={TOP_H} title="Playground 道具台" desc="改值不重新挂载, 用来看按下, 中断和回程. 拖一下滑块, 数字跟着滚." onOpen={() => onGo(FACE_BENCH)} />
        <Tile art={<SkinArt />} artHeight={TOP_H} title="皮肤与密度" desc="六套皮肤一键换气质, 紧凑, 舒适, 宽松三档密度." onOpen={() => onGo("skins")} />
      </div>
      <div className="mt-4 grid gap-[13px] md:grid-cols-3">
        <Tile art={<TokensArt />} artHeight={LOW_H} title="设计令牌" desc="颜色, 圆角, 阴影, 字号, 间距与动效, 一页看全." onOpen={() => onGo("tokens")} />
        <Tile art={<VizArt />} artHeight={LOW_H} title="数据可视化舞台" desc="舞台, 道具台, 源码三栏, 重播入场." onOpen={() => onGo("viz")} />
        <Tile art={<PageArt />} artHeight={LOW_H} title="整页描述" desc="用 definePage 描述一整页: 调顺序, 开关区块, 改标题." onOpen={() => onGo("page")} />
      </div>
    </section>
  );
}
