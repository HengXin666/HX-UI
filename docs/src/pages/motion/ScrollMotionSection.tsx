import { useRef, useState, type JSX } from "react";
import {
  Parallax,
  Reveal,
  RotatingText,
  ScrollProgress,
  SplitText,
  StickyScroll,
  useOrchestration,
  useScrollProgressValue,
} from "../../../../src/motion";
import { MOTION_DIRECTION, MOTION_DOC, ROTATE_TRIGGER, SCROLL_BAR_POSITION, SCROLL_DOC, SPLIT_BY } from "../../../../src/constants/motion";
import { Callout, Code, H2, P, Preview, PropsTable } from "../../components/DocKit";

const STEPS = ["一. 先给画面", "二. 再讲细节", "三. 最后给行动"] as const;
const WORDS = ["设计师", "工程师", "产品经理"];
const LAYERS = [
  { speed: SCROLL_DOC.speedSlow, label: "背景 0.1" },
  { speed: SCROLL_DOC.speedMid, label: "中景 0.3" },
  { speed: SCROLL_DOC.speedFast, label: "前景 0.6" },
] as const;

/** 容器内的进度条与百分比读数. */
function ProgressDemo(): JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const value = useScrollProgressValue({ container: box });
  return (
    <div className={MOTION_DOC.column}>
      <ScrollProgress container={box} position={SCROLL_BAR_POSITION.inline} label="示例阅读进度" />
      <div ref={box} className={SCROLL_DOC.scrollBox}>
        <div className={SCROLL_DOC.tallInner}>
          <p className={MOTION_DOC.figure}>{Math.round(value * 100)}%</p>
          <p className={SCROLL_DOC.caption}>在这个框里滚动, 上方进度条与读数一起变化.</p>
        </div>
      </div>
    </div>
  );
}

/** 三层不同速度的视差. */
function ParallaxDemo(): JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className={SCROLL_DOC.scrollBox}>
      <div className={[SCROLL_DOC.tallInner, "grid grid-cols-3 items-center gap-3"].join(" ")}>
        {LAYERS.map((layer) => (
          <Parallax key={layer.label} container={box} speed={layer.speed} direction={MOTION_DIRECTION.up}>
            <div className={MOTION_DOC.tile}>{layer.label}</div>
          </Parallax>
        ))}
      </div>
    </div>
  );
}

/** 粘性叙事: 左侧媒体随当前步切换. */
function StickyDemo(): JSX.Element {
  const [step, setStep] = useState(0);
  return (
    <div className={MOTION_DOC.column}>
      <p className={SCROLL_DOC.caption}>onStepChange: 当前第 {step + 1} 步</p>
      <StickyScroll
        onStepChange={setStep}
        steps={STEPS.map((title) => (
          <div key={title} className={MOTION_DOC.tile}>{title}</div>
        ))}
        media={(index) => <div className={[MOTION_DOC.tile, "flex h-40 items-center justify-center"].join(" ")}>媒体 {index + 1}</div>}
      />
    </div>
  );
}

/** 区块编排: 眉标 -> 标题 -> lead -> CTA -> 媒体. 重播换 key. */
function OrchestrationDemo(): JSX.Element {
  const [round, setRound] = useState(0);
  const delay = useOrchestration("hero");
  return (
    <div key={round} className={MOTION_DOC.column}>
      <Reveal delay={delay.eyebrow}><span className="text-[12px] text-muted-foreground">新品</span></Reveal>
      <Reveal delay={delay.title} timing="emphasized"><span className={MOTION_DOC.figure}>为 <RotatingText words={WORDS} /> 而生</span></Reveal>
      <Reveal delay={delay.lead}><p className={SCROLL_DOC.caption}>一句话说明它解决什么问题.</p></Reveal>
      <Reveal delay={delay.cta}>
        <button type="button" className="rounded-md border border-border px-3 py-1 text-[13px]" onClick={() => setRound((n) => n + 1)}>重播编排</button>
      </Reveal>
      <Reveal delay={delay.media}><div className={MOTION_DOC.tile}>媒体</div></Reveal>
    </div>
  );
}

/**
 * 滚动联动与入场编排一节: ScrollProgress, Parallax, StickyScroll, RotatingText, SplitText, orchestration.
 *
 * .agents/notes/implemented/feature/2026-11-02-scroll-motion-orchestration.md
 */
export function ScrollMotionSection(): JSX.Element {
  return (
    <>
      <H2>滚动联动与编排</H2>
      <Callout title="减弱动效">
        系统开启 prefers-reduced-motion 时: 视差静止, 进度条不缩放只按宽度贴合, 轮换词只显示第一个, 逐字入场直接显示原文,
        编排延迟全部归零. 粘性叙事的粘住是布局, 照常保留.
      </Callout>

      <H2>ScrollProgress</H2>
      <P><Code>useScrollProgress</Code> 返回 0 到 1 的 MotionValue, 可指定容器或整页; 组件版是一条进度条.</P>
      <Preview code={`<ScrollProgress />  // 整页, 贴顶\nconst p = useScrollProgress({ container: ref })`}>
        <ProgressDemo />
      </Preview>
      <PropsTable
        rows={[
          { name: "container", type: SCROLL_DOC.typeRef, desc: "滚动容器, 省略为整页" },
          { name: "target", type: SCROLL_DOC.typeRef, desc: "跟踪元素从进屏到出屏的进度" },
          { name: "position", type: "top | bottom | inline", default: SCROLL_BAR_POSITION.top, desc: "进度条位置" },
          { name: "label", type: "string", desc: "给了即以 progressbar 暴露给读屏器" },
        ]}
      />

      <H2>Parallax</H2>
      <P>按滚动位置位移子元素, 屏幕正中时归位. 速度因子越大漂得越多, 负数反向.</P>
      <Preview code={`<Parallax speed={0.3} direction="up">\n  <img ... />\n</Parallax>`}>
        <ParallaxDemo />
      </Preview>

      <H2>StickyScroll</H2>
      <P>媒体粘住, 步骤滚动; 压过视口正中线的那步成为当前步. 宽屏左粘右滚, 窄屏上粘下滚.</P>
      <Preview code={`<StickyScroll steps={steps} media={(i) => <img src={shots[i]} />}\n  onStepChange={setStep} />`}>
        <StickyDemo />
      </Preview>

      <H2>RotatingText 与 SplitText</H2>
      <P>轮换词定时或按滚动换词; SplitText 逐字或逐词入场, 可设方向与步长.</P>
      <Preview code={`<RotatingText words={["设计师", "工程师"]} trigger="${ROTATE_TRIGGER.interval}" />\n<SplitText text="..." by="${SPLIT_BY.word}" direction="up" step={0.06} />`}>
        <div className={MOTION_DOC.column}>
          <SplitText className={MOTION_DOC.figure} text="逐字入场的大标题" />
          <SplitText text="Words arrive one by one from the left" by={SPLIT_BY.word} direction={MOTION_DIRECTION.left} />
        </div>
      </Preview>

      <H2>入场编排</H2>
      <P>
        <Code>useOrchestration("hero")</Code> 返回每个角色的延迟 (秒), 间隔取 <Code>--stagger-step</Code> 令牌.
        预设: hero, split, mediaFirst, compact.
      </P>
      <Preview code={`const d = useOrchestration("hero");\n<Reveal delay={d.title}>...</Reveal>`}>
        <OrchestrationDemo />
      </Preview>
    </>
  );
}
