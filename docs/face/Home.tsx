import type { JSX } from "react";
import { BUTTON_TYPE, VARIANT } from "@hx/ui";
import { TONE_VARIANT } from "../../src/constants/ui";
import { DISPLAY_SIZE, DISPLAY_TAGS } from "../../src/constants/typography";
import { Button } from "../../src/primitives/button";
import { Display } from "../../src/typography/Display";
import { Eyebrow } from "../../src/typography/Eyebrow";
import { Lead } from "../../src/typography/Lead";
import { FieldPlate } from "../../src/studio/pages/FieldPlate";
import { Shot, ShotPlate, ShotSequence, SHOT_MOVE, SHOT_PACE } from "../../src/studio";
import { DOCS, GROUPS } from "../src/nav";
import { HomeShow } from "./home-show";
import { FACE_PREVIEW, PREVIEW_FIELD } from "./router";

const POINTS = [
  { title: "先排页", body: "落地页和商品页是库里的组件, 不是文档站里手写的一块样板." },
  { title: "再拆件", body: "按钮, 表单, 图表, 区块都还在. 找得到, 也能复制用法." },
  { title: "节奏有拍", body: "开场只推近一句. 成组的东西后段更快. 减弱动效时全部停住." },
] as const;

/** 门面首页. 空 hash 就是这一页. */
export function Home({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <main>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <ShotSequence pace={SHOT_PACE.even}>
          <Shot move={SHOT_MOVE.hold}>
            <Eyebrow>HX UI</Eyebrow>
          </Shot>
          <Shot move={SHOT_MOVE.dolly}>
            <Display as={DISPLAY_TAGS[0]} size={DISPLAY_SIZE.lg} className="mt-4">先把一页排完.</Display>
          </Shot>
          <Shot move={SHOT_MOVE.rise}>
            <Lead className="mt-4">控件, 镜头和整页在同一个包里. 亮色和暗色用同一套语义, 不另画一套皮肤来撑场面.</Lead>
          </Shot>
          <Shot move={SHOT_MOVE.rise}>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type={BUTTON_TYPE} variant={VARIANT.primary} onClick={() => onGo(`${FACE_PREVIEW}/${PREVIEW_FIELD}`)}>看田野这一页</Button>
              <Button type={BUTTON_TYPE} variant={TONE_VARIANT.outline} onClick={() => onGo("install")}>从安装开始</Button>
            </div>
          </Shot>
        </ShotSequence>
        <ShotPlate className="min-h-72 rounded-xl border border-border bg-surface-sunken" label="一页决定记录">
          <FieldPlate />
        </ShotPlate>
      </section>

      <section className="border-t border-border">
        <ol className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:grid-cols-3 md:px-8">
          {POINTS.map((item, index) => (
            <li key={item.title} className="border-t border-border pt-4">
              <p className="font-mono text-xs text-muted-foreground">0{index + 1}</p>
              <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <HomeShow onOpen={onGo} />

      <section className="border-t border-border" aria-labelledby="face-index">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8">
          <h2 id="face-index" className="text-xl font-semibold tracking-tight">组件按用途分</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GROUPS.map((group) => {
              const first = DOCS.find((entry) => entry.group === group);
              const count = DOCS.filter((entry) => entry.group === group).length;
              if (!first) return null;
              return (
                <li key={group}>
                  <button
                    type={BUTTON_TYPE}
                    onClick={() => onGo(first.id)}
                    className="flex w-full items-baseline justify-between gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="font-medium">{group}</span>
                    <span className="font-mono text-xs text-muted-foreground">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}
