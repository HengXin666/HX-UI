import { useState, type JSX } from "react";
import { Slider } from "@hx/ui";
import { Callout, H2, H3, P, Preview, PropsTable } from "../components/DocKit";

/**
 * Slider 页。
 *
 * Slider 是库内**没有用 radix**的少数几个基础件之一: 轨道是普通 div + 指针事件,
 * 但真正承载键盘与无障碍的是里面那个 opacity-0 的原生 input[type=range]。
 * 所以键盘操作、Home/End、PageUp/PageDown 都是浏览器给的, 不用自己实现。
 * 值永远是数组 —— 即使只支持单个滑块, API 也按数组给, 方便以后扩展。
 */
export function SliderPage(): JSX.Element {
  const [volume, setVolume] = useState(42);
  const [committed, setCommitted] = useState(42);
  const [temp, setTemp] = useState(0.6);

  return (
    <>
      <P>
        轨道是 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">h-1.5</code> 的
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> bg-muted-foreground/20</code>, 已选段是
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> bg-primary</code>;
        滑块是 16px 圆点, 默认 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-popover</code> 底加主色描边, 按下或聚焦才填实。
        整个组件高 20px, 不做纵向堆叠。
      </P>

      <H2>基础</H2>
      <P>宽度来自父容器 (w-full), 所以要先用 className 或外层容器定宽。</P>
      <Preview
        align="start"
        code={`<Slider aria-label="缩放" defaultValue={[42]} className="w-64" />

{/* 值永远是数组, 哪怕只有一个滑块 */}
<Slider aria-label="不透明度" defaultValue={[80]} className="w-64" />`}
      >
        <div className="flex w-64 flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">缩放 42</span>
          <Slider aria-label="缩放" defaultValue={[42]} />
        </div>
        <div className="flex w-64 flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">不透明度 80</span>
          <Slider aria-label="不透明度" defaultValue={[80]} />
        </div>
      </Preview>

      <H2>区间与步长</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">step</code> 支持小数, 但轨道宽度是按 0~100 映射的 ——
        负值区间的起点靠 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">min</code> 换算, 不需要手动偏移。
      </P>
      <Preview
        align="start"
        code={`{/* 温度: 负起点 + 0.5 步长 */}
<Slider min={-10} max={40} step={0.5} defaultValue={[18.5]} className="w-64" />

{/* 音量: 0~100, 步长 5 */}
<Slider min={0} max={100} step={5} defaultValue={[60]} className="w-64" />`}
      >
        <div className="flex w-64 flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">温度 -10~40, 步长 0.5</span>
          <Slider min={-10} max={40} step={0.5} aria-label="温度" defaultValue={[18.5]} />
        </div>
        <div className="flex w-64 flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">音量 0~100, 步长 5</span>
          <Slider min={0} max={100} step={5} aria-label="音量" defaultValue={[60]} />
        </div>
        <div className="flex w-64 flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">受控 value 也走同一条路</span>
          <Slider min={-10} max={40} step={0.5} aria-label="受控温度" value={[temp]} onValueChange={(v) => setTemp(v[0])} />
        </div>
        <span className="self-end text-[12px] text-muted-foreground">当前 {temp.toFixed(1)}°C</span>
      </Preview>

      <H2>拖动中与提交</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">onValueChange</code> 在拖动过程中每帧触发,
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> onValueCommit</code> 在松手 (或键盘改值) 时触发一次。
        写设置项用前者做预览、后者落盘, 免得每拖一格就写一次文件。
      </P>
      <Preview
        align="start"
        code={`const [volume, setVolume] = useState(42);
const [committed, setCommitted] = useState(42);

<Slider
  aria-label="音量"
  min={0}
  max={100}
  value={[volume]}
  onValueChange={(v) => setVolume(v[0])}
  onValueCommit={(v) => setCommitted(v[0])}
  className="w-64"
/>

<span>拖动中 {volume} / 已提交 {committed}</span>`}
      >
        <div className="flex w-64 flex-col gap-1">
          <Slider
            aria-label="音量"
            min={0}
            max={100}
            value={[volume]}
            onValueChange={(v) => setVolume(v[0])}
            onValueCommit={(v) => setCommitted(v[0])}
          />
        </div>
        <span className="self-center text-[12px] text-muted-foreground">
          拖动中 {volume} / 已提交 {committed}
        </span>
      </Preview>

      <H2>禁用与动画</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">animateValue</code> 只在<b className="text-foreground">非拖拽</b>时给宽度与位置加 240ms 过渡
        (拖拽中不加, 否则指针和滑块会脱节), 适合"值由外部按钮 +10/-10 改变"的场景。
      </P>
      <Preview
        align="start"
        code={`<Slider disabled defaultValue={[35]} className="w-64" />

{/* 值由别处改变时才有意义: 拖拽中自动不播过渡 */}
<Slider animateValue defaultValue={[35]} className="w-64" />`}
      >
        <div className="flex w-64 flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">禁用</span>
          <Slider disabled aria-label="禁用示例" defaultValue={[35]} />
        </div>
        <div className="flex w-64 flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">animateValue</span>
          <Slider animateValue aria-label="动画示例" defaultValue={[35]} />
        </div>
      </Preview>

      <Callout title="键盘支持是免费的">
        按 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">Tab</code> 聚焦滑块后,
        方向键步进一格, <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">PageUp / PageDown</code> 步进十格,
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> Home / End</code> 跳到两端。
        这些都来自内部那个不可见的原生 range 输入, 所以别把它删掉换成纯 div 实现。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "value / defaultValue", type: "number[]", desc: "受控值 / 非受控初值。只取数组第一项, 但按数组传。" },
          { name: "onValueChange", type: "(value: number[]) => void", desc: "拖动过程每帧回调。" },
          { name: "onValueCommit", type: "(value: number[]) => void", desc: "松手或键盘改值后回调一次, 用来落盘。" },
          { name: "min / max", type: "number", default: "0 / 100", desc: "区间端点。max ≤ min 时进度按 0 处理, 不会除零。" },
          { name: "step", type: "number", default: "1", desc: "步长, 支持小数 (小数位数决定结果的精度)。" },
          { name: "disabled", type: "boolean", default: "false", desc: "禁用; 鼠标事件被拦, 原生 input 也 disabled。" },
          { name: "animateValue", type: "boolean", default: "false", desc: "非拖拽时给进度加 240ms 过渡。" },
          { name: "aria-label", type: "string", desc: "无障碍名。没有可见标签时必填。" },
          { name: "aria-valuetext", type: "string", desc: "把数字读成更有意义的文案 (例如 42 → 42%)。" },
          { name: "className", type: "string", desc: "宽度等布局微调, 默认 w-full。" },
        ]}
      />
    </>
  );
}
