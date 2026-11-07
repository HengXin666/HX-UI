import { useState, type JSX } from "react";
import { BUTTON_TYPE, SegmentedControl } from "@hx/ui";
import { FieldPage, KilnPage, Metric, Process, Shot, SHOT_MOVE, type ShotMove } from "../../src/studio";
import { TEXT_TONE } from "../../src/constants/typography";
import { N12, N18, N27, N4, N6, N9 } from "../../src/studio/figures";
import { FACE_PREVIEW, PREVIEW_FIELD, PREVIEW_KILN } from "./router";

const MOVES: ReadonlyArray<{ readonly move: ShotMove; readonly name: string; readonly line: string }> = [
  { move: SHOT_MOVE.hold, name: "hold", line: "先站住, 再往下读." },
  { move: SHOT_MOVE.dolly, name: "dolly", line: "只推近这一句." },
  { move: SHOT_MOVE.rise, name: "rise", line: "落到版面里的位置." },
  { move: SHOT_MOVE.pan, name: "pan", line: "从侧面进来, 停成正视." },
];

const STEPS = [
  { id: "note", title: "记下", detail: "会上的一句先进时间线, 先不分类." },
  { id: "sign", title: "署名", detail: "没有名字的事项, 就还停在未决." },
  { id: "close", title: "复盘", detail: "两周后回到这一行, 看它有没有发生." },
] as const;

const PAGES = [
  { key: PREVIEW_FIELD, label: "田野" },
  { key: PREVIEW_KILN, label: "窑四号" },
] as const;

/** 首页里可操作的三段: 运镜, 指标, 整页. */
export function HomeShow({ onOpen }: { readonly onOpen: (id: string) => void }): JSX.Element {
  const [move, setMove] = useState<ShotMove>(SHOT_MOVE.dolly);
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState<typeof PREVIEW_FIELD | typeof PREVIEW_KILN>(PREVIEW_FIELD);
  const active = MOVES.find((item) => item.move === move) ?? MOVES[1];
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-5 py-16 md:px-8">
      <section aria-labelledby="face-moves">
        <h2 id="face-moves" className="text-xl font-semibold tracking-tight">镜头</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">点一个名字, 这一句按那个运镜再走一遍. 系统开了减弱动效时, 它直接停在终态.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {MOVES.map((item) => (
            <button
              key={item.name}
              type={BUTTON_TYPE}
              aria-pressed={item.move === move}
              className="rounded-full border border-border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onClick={() => { setMove(item.move); setTick((value) => value + 1); }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <Shot key={`${active.name}-${tick}`} move={active.move} className="mt-6 max-w-xl">
          <p className="border-t border-border pt-4 text-2xl font-medium tracking-tight">{active.line}</p>
        </Shot>
      </section>

      <section aria-labelledby="face-figures">
        <h2 id="face-figures" className="text-xl font-semibold tracking-tight">数字与过程</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Metric label="本周收束" value={N27} from={0} delta="比上周多一些" tone={TEXT_TONE.success} series={[N6, N9, N12, N18, N27]} />
          <Metric label="仍未拍板" value={N9} from={N18} delta="没有超过两周的" series={[N18, N12, N9]} />
          <Metric label="返工" value={N4} from={0} delta="都来自未署名的条目" tone={TEXT_TONE.danger} series={[0, 1, N4, N6, N4]} />
        </div>
        <div className="mt-8">
          <Process label="一条事项怎么走完" steps={STEPS} defaultValue={STEPS[0].id} />
        </div>
      </section>

      <section aria-labelledby="face-pages">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="face-pages" className="text-xl font-semibold tracking-tight">整页</h2>
          <SegmentedControl items={[...PAGES]} value={page} onChange={setPage} />
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">下面就是库里的页面组件, 不是截图. 可以在框里滚动, 也可以单独打开.</p>
        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
            <span className="font-mono text-xs text-muted-foreground">{page === PREVIEW_FIELD ? "FieldPage" : "KilnPage"}</span>
            <button type={BUTTON_TYPE} className="text-sm text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" onClick={() => onOpen(`${FACE_PREVIEW}/${page}`)}>
              单独打开
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {page === PREVIEW_FIELD ? <FieldPage heading="h2" /> : <KilnPage heading="h2" />}
          </div>
        </div>
      </section>
    </div>
  );
}
