import { useState, type JSX } from "react";
import { H2, H3, P } from "../../components/DocKit";
import { DEMO_CLASS, NATIVE_BUTTON_TYPE } from "../../../../src/constants/docs-legacy";
import { BUTTON, CAPTION, GRID, LABEL } from "./impl/token-classes";
import { ANIMATIONS, EASINGS } from "./impl/token-data";

/**
 * 令牌页动效分区: 缓动曲线对比与关键帧重放, 播放状态只属于本分区.
 * .agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md
 */
export function MotionSections(): JSX.Element {
  const [moved, setMoved] = useState(false);
  const [replay, setReplay] = useState(0);
  return (
    <>
      <H2>动效</H2>
      <P>时长五档: instant 80 / fast 120 / base 200 / slow 300 / emphasized 500 (ms)。系统减弱动效时全部归零, 弹簧退回 ease-out。</P>
      <button type={NATIVE_BUTTON_TYPE} onClick={() => setMoved((v) => !v)} className={`mb-3 ${BUTTON}`}>
        播放曲线对比
      </button>
      <div className={DEMO_CLASS.rows}>
        {EASINGS.map((e) => (
          <div key={e.name} className="flex items-center gap-4">
            <div className="w-44 shrink-0">
              <div className={LABEL}>{e.name}</div>
              <div className={CAPTION}>{e.use}</div>
            </div>
            <div className="relative h-6 flex-1 rounded-md bg-surface-sunken">
              <div
                className="absolute top-1 left-1 size-4 rounded-full bg-primary transition-transform"
                style={{
                  transform: moved ? "translateX(12rem)" : "translateX(0)",
                  transitionDuration: "var(--duration-emphasized)",
                  transitionTimingFunction: `var(${e.name})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <H3>关键帧</H3>
      <button type={NATIVE_BUTTON_TYPE} onClick={() => setReplay((n) => n + 1)} className={`mb-3 ${BUTTON}`}>
        重放入场
      </button>
      <div key={replay} className={GRID}>
        {ANIMATIONS.map((a) => (
          <div key={a} className={`rounded-xl border border-border bg-surface-raised p-4 shadow-md ${a}`}>
            <div className={LABEL}>{a}</div>
          </div>
        ))}
        <div className="hx-skeleton h-14" />
      </div>
    </>
  );
}
