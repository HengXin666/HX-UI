"use client";

import { useState, type JSX } from "react";
import { Price } from "../../commerce/Price";
import { ProductSwatch } from "../../commerce/ProductSwatch";
import { RatingSummary } from "../../commerce/RatingSummary";
import { SizeSelector } from "../../commerce/SizeSelector";
import { BUTTON_TYPE, VARIANT } from "../../constants";
import { SVG_CURRENT_COLOR, SVG_NONE } from "../../constants/polish";
import { LIVE_POLITE } from "../../constants/widgets";
import { DISPLAY_SIZE, DISPLAY_TAGS, type DisplayTag } from "../../constants/typography";
import { Button } from "../../primitives/button";
import { cn } from "../../primitives/utils";
import { Display } from "../../typography/Display";
import { Eyebrow } from "../../typography/Eyebrow";
import { Lead } from "../../typography/Lead";
import { STUDIO_CLASS } from "../classes";
import { F016, F088, N126, F48 } from "../num";
import { SHOT_MOVE, SHOT_PACE } from "../moves";
import { Shot, ShotSequence } from "../sequence/Sequence";
import { ShotPlate } from "../sequence/Plate";
import { Compare } from "../viz/Compare";
import { Process } from "../viz/Process";
import {
  KILN_COLUMNS,
  KILN_GLAZE,
  KILN_NOTES,
  KILN_PRICE,
  KILN_ROWS,
  KILN_SIZE,
  KILN_STEP,
  KILN_STEPS,
  STUDIO_CURRENCY,
  STUDIO_LOCALE,
} from "./copy";

export interface KilnPageProps {
  heading?: DisplayTag;
  className?: string;
}

const KILN_SCORE = F48;
const KILN_REVIEWS = N126;

/**
 * 窑四号: 一只滤杯的商品页. 画廊是机位里的器物, 购买面板是同一页的流程.
 */
export function KilnPage({ heading = DISPLAY_TAGS[0], className }: KilnPageProps): JSX.Element {
  const [glaze, setGlaze] = useState<string>(KILN_GLAZE[0].value);
  const [size, setSize] = useState<string | null>(KILN_SIZE[0].value);
  const [step, setStep] = useState<string>(KILN_STEP.glaze);
  const [held, setHeld] = useState(false);
  const glazeLabel = KILN_GLAZE.find((item) => item.value === glaze)?.label ?? KILN_GLAZE[0].label;

  return (
    <article lang={STUDIO_LOCALE} data-slot="kiln-page" className={cn(STUDIO_CLASS.page, className)}>
      <header className={cn(STUDIO_CLASS.wrap, "grid items-center gap-12 py-16 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:py-20")}>
        <ShotPlate className={cn(STUDIO_CLASS.sunken, "grid min-h-80 place-items-center")} label={`${glazeLabel} 窑四号`}>
          <KilnVessel glaze={glaze} />
        </ShotPlate>
        <ShotSequence pace={SHOT_PACE.even}>
          <Shot move={SHOT_MOVE.hold}>
            <Eyebrow lang={STUDIO_LOCALE}>器物</Eyebrow>
          </Shot>
          <Shot move={SHOT_MOVE.dolly}>
            <Display as={heading} size={DISPLAY_SIZE.lg} lang={STUDIO_LOCALE} className={STUDIO_CLASS.mt4}>窑四号滤杯</Display>
          </Shot>
          <Shot move={SHOT_MOVE.rise}>
            <Lead lang={STUDIO_LOCALE} className={STUDIO_CLASS.mt4}>内壁三条肋, 把水切开. 圈足不施釉, 从烘箱里拿出来不会打滑.</Lead>
          </Shot>
          <Shot move={SHOT_MOVE.rise}>
            <div className={cn(STUDIO_CLASS.row, STUDIO_CLASS.mt4)}>
              <Price amount={KILN_PRICE} currency={STUDIO_CURRENCY} locale={STUDIO_LOCALE} />
              <RatingSummary value={KILN_SCORE} count={KILN_REVIEWS} locale={STUDIO_LOCALE} />
            </div>
          </Shot>
          <Shot move={SHOT_MOVE.rise}>
            <div className={cn(STUDIO_CLASS.mt6, STUDIO_CLASS.stack, "gap-5")}>
              <ProductSwatch options={[...KILN_GLAZE]} value={glaze} onValueChange={(next) => next && setGlaze(next)} aria-label="釉色" />
              <SizeSelector options={KILN_SIZE} value={size} onValueChange={setSize} showStock aria-label="型号" />
              <div className={STUDIO_CLASS.row}>
                <Button type={BUTTON_TYPE} variant={VARIANT.primary} onClick={() => { setHeld(true); setStep(KILN_STEP.ship); }}>
                  放入木盒
                </Button>
                <p className={STUDIO_CLASS.muted} aria-live={LIVE_POLITE}>
                  {held ? `已收下 ${glazeLabel}, 型号 ${size ?? KILN_SIZE[0].value}` : "还没有放入木盒"}
                </p>
              </div>
            </div>
          </Shot>
        </ShotSequence>
      </header>

      <section className={cn(STUDIO_CLASS.wrap, STUDIO_CLASS.section)} aria-labelledby="kiln-flow">
        <h2 id="kiln-flow" className={cn(STUDIO_CLASS.mt6, "text-xl font-semibold")}>从釉色到发出</h2>
        <Process label="购买步骤" steps={KILN_STEPS} value={step} onValueChange={setStep} />
      </section>

      <section className={cn(STUDIO_CLASS.wrap, STUDIO_CLASS.section)}>
        <div className={STUDIO_CLASS.grid3}>
          {KILN_NOTES.map((note) => (
            <Shot key={note.title} move={SHOT_MOVE.rise}>
              <article className={cn(STUDIO_CLASS.card, "h-full p-5")}>
                <h3 className="text-base font-semibold">{note.title}</h3>
                <p className={cn(STUDIO_CLASS.muted, STUDIO_CLASS.mt2)}>{note.body}</p>
              </article>
            </Shot>
          ))}
        </div>
      </section>

      <section className={cn(STUDIO_CLASS.wrap, STUDIO_CLASS.section)}>
        <Compare caption="和上一只杯子比" columns={KILN_COLUMNS} rows={KILN_ROWS} />
      </section>
    </article>
  );
}

function KilnVessel({ glaze }: { glaze: string }): JSX.Element {
  const iron = glaze === KILN_GLAZE[1].value;
  return (
    <svg viewBox="0 0 160 220" className={cn("h-64 w-auto", iron ? STUDIO_CLASS.ink : STUDIO_CLASS.quiet)} aria-hidden>
      <path
        d="M50 36h60l10 18H40L50 36zm-12 18h84l14 132c2 14-10 22-24 22H48c-14 0-26-8-24-22L38 54z"
        fill={SVG_CURRENT_COLOR}
        fillOpacity={iron ? F088 : F016}
        stroke={SVG_CURRENT_COLOR}
        strokeWidth={1}
      />
      <path d="M62 86h36M56 112h48M62 138h36" fill={SVG_NONE} stroke={SVG_CURRENT_COLOR} strokeWidth={1} />
    </svg>
  );
}
