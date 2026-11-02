import { useState, type JSX } from "react";
import { Button } from "@hx/ui";
import {
  AnimatedNumber,
  FadeSwap,
  MOTION_PRESETS,
  PageTransition,
  Reveal,
  Stagger,
  StaggerItem,
  type MotionPresetName,
} from "../../../../src/motion";
import { VARIANT } from "../../../../src/constants";
import { MOTION_DOC, MOTION_PRESET_NAME, STAGGER_GAP_S, STAGGER_TRIGGER } from "../../../../src/constants/motion";
import {
  DEMO_BUTTON_ROW_CLASS,
  DEMO_FULL_WIDTH_CLASS,
  DEMO_NUMBER_LOCALE,
  DEMO_OVERVIEW_LABEL,
  DEMO_PLACEHOLDER_ITEM_TAG,
  DEMO_PROP_DEFAULT_TAG,
  DEMO_PROP_DEFAULT_TRUE,
  DEMO_PROP_DEFAULT_ZERO,
  DEMO_PROP_NAME_SPRING,
  DEMO_PROP_NAME_VALUE,
  DEMO_PROP_TYPE_BOOLEAN,
  DEMO_VARIANT_ACTIVE,
  DEMO_VARIANT_IDLE,
  DEMO_VARIANT_OUTLINE,
} from "../../../../src/constants/docs-demos";
import { Callout, Code, H2, P, Preview, PropsTable } from "../../components/DocKit";
import { ScrollMotionSection } from "./ScrollMotionSection";

const PRESET_NAMES = Object.keys(MOTION_PRESETS) as MotionPresetName[];
const STAGGER_ITEMS = Array.from({ length: MOTION_DOC.staggerCount }, (_, index) => index + 1);
const PAGES = [DEMO_OVERVIEW_LABEL, "成员", "账单"] as const;

/** 预设一览: 每个预设一块, 点重播会换 key 让 Reveal 重新挂载. */
function PresetGallery(): JSX.Element {
  const [round, setRound] = useState(0);
  return (
    <div className={MOTION_DOC.column}>
      <div>
        <Button size={VARIANT.sm} onClick={() => setRound((n) => n + 1)}>重播</Button>
      </div>
      <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
        {PRESET_NAMES.map((name, index) => (
          <Reveal key={`${name}-${round}`} preset={name} delay={index * STAGGER_GAP_S} once={false}>
            <div className={MOTION_DOC.tile}>{name}</div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/** 交错列表: mount 触发, 重播时整组换 key. */
function StaggerDemo(): JSX.Element {
  const [round, setRound] = useState(0);
  return (
    <div className={MOTION_DOC.column}>
      <div>
        <Button size={VARIANT.sm} onClick={() => setRound((n) => n + 1)}>重新交错</Button>
      </div>
      <Stagger key={round} as="ul" trigger={STAGGER_TRIGGER.mount} className="grid w-full grid-cols-3 gap-2">
        {STAGGER_ITEMS.map((item) => (
          <StaggerItem key={item} as={DEMO_PLACEHOLDER_ITEM_TAG} preset={MOTION_PRESET_NAME.scaleIn}>
            <div className={MOTION_DOC.tile}>第 {item} 项</div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

/** 弹簧数字: 在两档目标值之间切换, 观察不同弹簧的手感. */
function NumberDemo(): JSX.Element {
  const [high, setHigh] = useState(false);
  const value = high ? MOTION_DOC.numberHigh : MOTION_DOC.numberLow;
  return (
    <div className={MOTION_DOC.column}>
      <div className="flex flex-wrap items-end gap-6">
        <AnimatedNumber className={MOTION_DOC.figure} value={value} from={MOTION_DOC.numberFrom} />
        <AnimatedNumber
          className={MOTION_DOC.figure}
          value={value}
          spring="snappy"
          locale={DEMO_NUMBER_LOCALE}
          format={{ style: "currency", currency: "CNY" }}
        />
        <AnimatedNumber className={MOTION_DOC.figure} value={value} spring="bouncy" format={{ notation: "compact" }} />
      </div>
      <div>
        <Button size={VARIANT.sm} onClick={() => setHigh((v) => !v)}>切换目标值</Button>
      </div>
    </div>
  );
}

/** 页面转场与局部替换. */
function TransitionDemo(): JSX.Element {
  const [page, setPage] = useState(0);
  const [saved, setSaved] = useState(false);
  return (
    <div className={MOTION_DOC.column}>
      <div className={DEMO_BUTTON_ROW_CLASS}>
        {PAGES.map((label, index) => (
          <Button key={label} size={VARIANT.sm} variant={index === page ? DEMO_VARIANT_ACTIVE : DEMO_VARIANT_IDLE} onClick={() => setPage(index)}>
            {label}
          </Button>
        ))}
      </div>
      <PageTransition pageKey={page} className={DEMO_FULL_WIDTH_CLASS}>
        <div className={MOTION_DOC.tile}>当前页: {PAGES[page]}. 旧页先离场, 新页再进, 两页不叠放.</div>
      </PageTransition>
      <div>
        <Button size={VARIANT.sm} variant={DEMO_VARIANT_OUTLINE} onClick={() => setSaved((v) => !v)}>
          <FadeSwap swapKey={saved ? 1 : 0}>{saved ? "已保存" : "保存草稿"}</FadeSwap>
        </Button>
      </div>
    </div>
  );
}

/**
 * 动效引擎文档页: 预设, Reveal, Stagger, AnimatedNumber, PageTransition 与 FadeSwap.
 *
 * .agents/notes/implemented/feature/2026-11-01-motion-engine.md
 */
export function MotionPage(): JSX.Element {
  return (
    <>
      <H2>动效引擎</H2>
      <P>
        一套基于 motion/react 的共享预设与四个组件. 时长与缓动不写死在代码里, 而是在挂载时从 tokens.css 的
        令牌读取, 换主题或调令牌, 全库动效节奏一起变. 系统开启减弱动效时, 所有组件直接落到终态.
      </P>
      <Callout title="减弱动效">
        组件用 <Code>useReducedMotion</Code> 跟随系统设置实时切换; 时长令牌在减弱动效媒体查询下本身也归零, 两道保险.
      </Callout>

      <H2>预设</H2>
      <P>
        <Code>MOTION_PRESETS</Code> 只描述从哪来到哪去 (hidden / visible / exit), 不带时长. 进入用 slow + ease-out,
        离场用 fast + ease-in, 首屏大标题可选 emphasized.
      </P>
      <Preview code={`<Reveal preset="blurIn" delay={0.12}>\n  <Card>...</Card>\n</Reveal>`}>
        <PresetGallery />
      </Preview>

      <H2>Reveal</H2>
      <P>进入视口时入场. 默认只播一次, 露出 20% 才触发; 首帧固定是 hidden 态, 服务端与客户端一致.</P>
      <Preview code={`<Reveal preset="fadeUp" timing="emphasized">\n  <h1>标题</h1>\n</Reveal>`}>
        <Reveal timing="emphasized" className={DEMO_FULL_WIDTH_CLASS}>
          <div className={MOTION_DOC.tile}>滚动到这里时, 这块用 emphasized 节奏浮现.</div>
        </Reveal>
      </Preview>
      <PropsTable
        rows={[
          { name: "preset", type: "MotionPresetName", default: MOTION_PRESET_NAME.fadeUp, desc: "入场预设" },
          { name: "timing", type: "enter | emphasized", default: "enter", desc: "节奏, 对应时长与缓动令牌" },
          { name: "delay", type: MOTION_DOC.typeNumber, default: DEMO_PROP_DEFAULT_ZERO, desc: "延迟, 单位秒" },
          { name: "once", type: DEMO_PROP_TYPE_BOOLEAN, default: DEMO_PROP_DEFAULT_TRUE, desc: "滚出后是否复位重播" },
          { name: "amount", type: MOTION_DOC.typeNumber, default: "0.2", desc: "露出比例达到多少触发" },
          { name: "as", type: "div | section | article | li | ul | span", default: DEMO_PROP_DEFAULT_TAG, desc: "包裹标签" },
        ]}
      />

      <H2>Stagger</H2>
      <P>容器只排开起播时间, 子项 StaggerItem 决定怎么动. 子项必须是 StaggerItem, 普通元素拿不到状态.</P>
      <Preview code={`<Stagger as="ul" trigger="mount">\n  {items.map((it) => <StaggerItem as="li" key={it.id}>{it.name}</StaggerItem>)}\n</Stagger>`}>
        <StaggerDemo />
      </Preview>
      <PropsTable
        rows={[
          { name: "gap", type: MOTION_DOC.typeNumber, default: "0.06", desc: "相邻子项间隔, 单位秒" },
          { name: "trigger", type: "inView | mount", default: "inView", desc: "进入视口才播, 或挂载即播" },
          { name: "StaggerItem.preset", type: "MotionPresetName", default: MOTION_PRESET_NAME.fadeUp, desc: "子项预设" },
        ]}
      />

      <H2>AnimatedNumber</H2>
      <P>
        弹簧驱动的数字, 每帧直接写文字节点, 不触发 React 重渲染. 字宽 tabular-nums 固定, 读屏器只读终值.
        格式交给 Intl.NumberFormat, 省略小数位时按目标值自身的小数位.
      </P>
      <Preview code={`<AnimatedNumber value={revenue} spring="snappy" locale="zh-CN"\n  format={{ style: "currency", currency: "CNY" }} />`}>
        <NumberDemo />
      </Preview>
      <PropsTable
        rows={[
          { name: DEMO_PROP_NAME_VALUE, type: MOTION_DOC.typeNumber, desc: "目标值, 变化时从当前显示值弹过去" },
          { name: "from", type: MOTION_DOC.typeNumber, desc: "首次进入视口时的起点, 省略则首帧即终值" },
          { name: DEMO_PROP_NAME_SPRING, type: "soft | snappy | bouncy", default: "soft", desc: "弹簧档位" },
          { name: "format", type: "Intl.NumberFormatOptions", desc: "货币, 百分比, 紧凑写法等" },
        ]}
      />

      <H2>PageTransition 与 FadeSwap</H2>
      <P>
        PageTransition 放在路由出口外, pageKey 变化即转场, 默认 wait 模式. FadeSwap 用于按钮文案, 状态徽标这类局部替换,
        默认 popLayout, 首帧不播.
      </P>
      <Preview code={`<PageTransition pageKey={pathname}>{outlet}</PageTransition>\n<FadeSwap swapKey={status}>{label}</FadeSwap>`}>
        <TransitionDemo />
      </Preview>

      <ScrollMotionSection />
    </>
  );
}
