import { useRef, useState, type JSX } from "react";
import { DOCS, GROUPS } from "../src/nav";
import {
  CraftButton,
  CraftDigits,
  CraftQuote,
  CraftSegmented,
  DealCard,
  PX,
  useReducedMotion,
  useSpringNumber,
} from "../../src/craft";
import { FieldPlate } from "../../src/studio/pages/FieldPlate";
import { FACE_PREVIEW, PREVIEW_FIELD, PREVIEW_KILN } from "./router";
import { useScroll } from "./scroll";

const NOTES = [
  { title: "按下", body: "90ms 到 0.97, 再下移 1px. 按住不呼吸." },
  { title: "松开", body: "从当前速度弹到 1.012, 再在下一拍收回 1." },
  { title: "滑动", body: "指示条的宽不跟着过冲. 宽和位置分开算." },
];

/** 镜 2 到镜 6. 滚动进度可逆, 不重播一条时间轴. */
export function HomeShots({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <>
      <Record />
      <Explain />
      <Swap onGo={onGo} />
      <OneNumber />
      <Index onGo={onGo} />
    </>
  );
}

function Record(): JSX.Element {
  const ref = useRef<HTMLElement>(null);
  const progress = useScroll(ref);
  const x = PX.record * (1 - Math.min(1, progress * 1.4));
  return (
    <section ref={ref} className="border-t border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-24 md:grid-cols-2 md:px-8">
        <div>
          <p className="text-xs text-muted-foreground">记录卡</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">指针靠近时它跟着, 离开时自己回来.</h2>
        </div>
        <div style={{ transform: `translate3d(${x.toFixed(2)}px, 0, 0)` }}>
          <p className="text-sm leading-relaxed text-muted-foreground">卡里的三行字一起到, 不各自再演一遍.</p>
        </div>
      </div>
    </section>
  );
}

function Explain(): JSX.Element {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-24 md:px-8">
        <CraftQuote text="手感在松开的那一下, 不在背景上." />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {NOTES.map((note, index) => (
            <DealCard key={note.title} index={index} count={NOTES.length} className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">{note.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note.body}</p>
            </DealCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function Swap({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  const reduced = useReducedMotion();
  const [which, setWhich] = useState<"field" | "kiln">("field");
  const shift = useSpringNumber(which === "kiln" ? 1 : 0, "thumb", reduced);
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-24 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight">两页用同一根拇指换.</h2>
          <CraftSegmented
            segments={[{ id: "field", label: "田野" }, { id: "kiln", label: "窑四号" }]}
            value={which}
            onChange={(id) => setWhich(id === "kiln" ? "kiln" : "field")}
          />
        </div>
        <div className="relative mt-8 h-80 overflow-hidden rounded-xl border border-border">
          <div
            className="absolute inset-0"
            style={{
              opacity: 1 - shift,
              transform: `translate3d(${(-PX.page * shift).toFixed(2)}px, 0, 0)`,
            }}
          >
            <FieldPlate />
          </div>
          <div
            className="absolute inset-0 grid content-center gap-3 px-6"
            style={{
              opacity: shift,
              transform: `translate3d(${(PX.page * (1 - shift)).toFixed(2)}px, 0, 0)`,
            }}
          >
            <p className="text-xs text-muted-foreground">窑四号</p>
            <p className="text-2xl font-semibold">灰釉浅碗</p>
            <p className="max-w-sm text-sm text-muted-foreground">旧页往左让, 新页从右边落到原位. 两页叠在一起大约 80ms.</p>
          </div>
        </div>
        <div className="mt-4">
          <CraftButton variant="ghost" onClick={() => onGo(`${FACE_PREVIEW}/${which === "kiln" ? PREVIEW_KILN : PREVIEW_FIELD}`)}>打开整页</CraftButton>
        </div>
      </div>
    </section>
  );
}

function OneNumber(): JSX.Element {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-24 md:px-8">
        <p className="text-xs text-muted-foreground">一个数</p>
        <div className="mt-4 text-6xl md:text-8xl">
          <CraftDigits value={12840} label="12840" />
        </div>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">每位自己滚. 旁边不再放三张一样大的指标卡.</p>
      </div>
    </section>
  );
}

function Index({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <section className="border-t border-border" aria-labelledby="face-index">
      <div className="mx-auto max-w-6xl px-5 py-24 md:px-8">
        <h2 id="face-index" className="text-3xl font-semibold tracking-tight">组件按用途分</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((group, index) => {
            const first = DOCS.find((entry) => entry.group === group);
            if (!first) return null;
            return (
              <li key={group}>
                <DealCard index={index} count={GROUPS.length}>
                  <CraftButton variant="outline" className="w-full justify-between" onClick={() => onGo(first.id)}>
                    <span>{group}</span>
                    <span className="font-mono text-xs text-muted-foreground">{DOCS.filter((entry) => entry.group === group).length}</span>
                  </CraftButton>
                </DealCard>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
