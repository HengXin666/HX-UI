"use client";

import type { JSX } from "react";
import { Price } from "../../commerce/Price";
import { BUTTON_TYPE, VARIANT } from "../../constants";
import { PRICE_PERIOD } from "../../constants/commerce";
import { TONE_VARIANT } from "../../constants/ui";
import { DISPLAY_SIZE, DISPLAY_TAGS, type DisplayTag } from "../../constants/typography";
import { Button } from "../../primitives/button";
import { cn } from "../../primitives/utils";
import { Display } from "../../typography/Display";
import { Eyebrow } from "../../typography/Eyebrow";
import { Lead } from "../../typography/Lead";
import { HX_LEAD, STUDIO_CLASS } from "../classes";
import { SHOT_DEPTH, SHOT_MOVE, SHOT_PACE } from "../../motion/shots";
import { Shot, ShotSequence } from "../sequence/Sequence";
import { ShotLayer, ShotPlate } from "../sequence/Plate";
import { Metric } from "../viz/Metric";
import { Process } from "../viz/Process";
import { FIELD_CHAPTERS, FIELD_METRICS, FIELD_PLAN, FIELD_PLANS, FIELD_PRICE, FIELD_QUOTE, FIELD_STEPS, STUDIO_CURRENCY, STUDIO_LOCALE } from "./copy";
import { FieldPlate } from "./FieldPlate";

export interface FieldPageProps {
  /** 嵌在已有 h1 的文档页里时传 h2. 默认 h1. */
  heading?: DisplayTag;
  className?: string;
}

/**
 * 田野: 给产品团队的决定记录.
 * 开场只有一个主体 (标题的推近), 产品稿落在真实槽位里, 不悬浮在标题上.
 *
 * .agents/notes/implemented/feature/2026-11-06-studio-shot-language.md
 */
export function FieldPage({ heading = DISPLAY_TAGS[0], className }: FieldPageProps): JSX.Element {
  return (
    <article lang={STUDIO_LOCALE} data-slot="field-page" className={cn(STUDIO_CLASS.page, className)}>
      <header className={cn(STUDIO_CLASS.wrap, "grid items-center gap-12 py-16 md:grid-cols-2 md:py-24")}>
        <ShotSequence pace={SHOT_PACE.even}>
          <Shot move={SHOT_MOVE.hold}>
            <Eyebrow lang={STUDIO_LOCALE}>田野</Eyebrow>
          </Shot>
          <Shot move={SHOT_MOVE.dolly}>
            <Display as={heading} size={DISPLAY_SIZE.lg} lang={STUDIO_LOCALE} className={STUDIO_CLASS.mt4}>
              一次讨论, 落成一条可以执行的决定.
            </Display>
          </Shot>
          <Shot move={SHOT_MOVE.rise}>
            <Lead lang={STUDIO_LOCALE} className={STUDIO_CLASS.mt5}>
              不另开聊天窗口, 也不再写第二份纪要. 田野把会上的句子, 署名和未决事项收成同一条时间线.
            </Lead>
          </Shot>
          <Shot move={SHOT_MOVE.rise}>
            <div className={cn(STUDIO_CLASS.row, STUDIO_CLASS.mt6)}>
              <Button type={BUTTON_TYPE} variant={VARIANT.primary}>开始一本田野</Button>
              <Button type={BUTTON_TYPE} variant={TONE_VARIANT.outline}>看一条未决</Button>
            </div>
          </Shot>
        </ShotSequence>
        <ShotPlate className={STUDIO_CLASS.sunken} label="第 42 周的决定记录">
          <ShotLayer depth={SHOT_DEPTH.back}>
            <div className="pointer-events-none absolute inset-0 bg-surface-sunken" />
          </ShotLayer>
          <ShotLayer depth={SHOT_DEPTH.subject}>
            <FieldPlate />
          </ShotLayer>
        </ShotPlate>
      </header>

      <section className={cn(STUDIO_CLASS.wrap, STUDIO_CLASS.section)} aria-label="这一季的数字">
        <div className={STUDIO_CLASS.grid3}>
          {FIELD_METRICS.map((item) => (
            <Metric key={item.label} {...item} locale={STUDIO_LOCALE} series={[...item.series]} />
          ))}
        </div>
      </section>

      <section className={cn(STUDIO_CLASS.wrap, STUDIO_CLASS.section)}>
        <div className={STUDIO_CLASS.stack}>
          {FIELD_CHAPTERS.map((chapter) => (
            <ShotSequence key={chapter.kicker} pace={SHOT_PACE.deal} className="max-w-2xl">
              <Shot move={SHOT_MOVE.hold}>
                <p className={STUDIO_CLASS.label}>{chapter.kicker}</p>
              </Shot>
              <Shot move={SHOT_MOVE.rise}>
                <h3 className={cn(STUDIO_CLASS.mt3, "text-2xl font-semibold tracking-tight text-foreground")}>{chapter.title}</h3>
              </Shot>
              <Shot move={SHOT_MOVE.rise}>
                <p className={cn(STUDIO_CLASS.muted, STUDIO_CLASS.mt3)}>{chapter.body}</p>
              </Shot>
            </ShotSequence>
          ))}
        </div>
      </section>

      <section className={cn(STUDIO_CLASS.wrap, STUDIO_CLASS.section)} aria-labelledby="field-process">
        <h3 id="field-process" className={cn(STUDIO_CLASS.mt6, "text-xl font-semibold")}>一条事项怎么走完</h3>
        <Process label="田野里的四个步骤" steps={FIELD_STEPS} defaultValue={FIELD_STEPS[0].id} />
      </section>

      <section className={cn(STUDIO_CLASS.wrap, STUDIO_CLASS.section)} aria-label="价格">
        <div className={STUDIO_CLASS.grid3}>
          {FIELD_PLANS.map((plan) => (
            <article key={plan.id} data-state={plan.id === FIELD_PLAN.studio ? HX_LEAD : undefined} className={cn(STUDIO_CLASS.card, STUDIO_CLASS.pad, plan.id === FIELD_PLAN.studio && "bg-surface-raised")}>
              <h3 className="text-base font-semibold">{plan.name}</h3>
              <Price amount={plan.price} currency={STUDIO_CURRENCY} locale={STUDIO_LOCALE} period={plan.period ?? undefined} />
              <ul className={STUDIO_CLASS.stackGap2}>
                {plan.points.map((point) => (
                  <li key={point} className={STUDIO_CLASS.muted}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className={cn(STUDIO_CLASS.label, STUDIO_CLASS.mt4)}>工作室与机构按月计费. 个人版不收费, 数据留在你自己的目录里.</p>
      </section>

      <section className={cn(STUDIO_CLASS.wrap, STUDIO_CLASS.section)}>
        <blockquote>
          <Shot move={SHOT_MOVE.glide}>
            <p className="max-w-3xl text-2xl font-medium leading-snug text-foreground">{FIELD_QUOTE.text}</p>
          </Shot>
          <footer className={cn(STUDIO_CLASS.muted, STUDIO_CLASS.mt4)}>{FIELD_QUOTE.by}</footer>
        </blockquote>
        <div className={cn(STUDIO_CLASS.row, STUDIO_CLASS.mt8)}>
          <Button type={BUTTON_TYPE} variant={VARIANT.primary}>用工作室版开始</Button>
          <span className={STUDIO_CLASS.muted}>
            <Price amount={FIELD_PRICE.studio} currency={STUDIO_CURRENCY} locale={STUDIO_LOCALE} period={PRICE_PERIOD.month} />
          </span>
        </div>
      </section>
    </article>
  );
}
