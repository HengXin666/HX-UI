import { useState, type JSX } from "react";
import { Spin, SPIN_VARIANTS, type SpinVariant, Card, Badge, Button } from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code } from "../components/DocKit";

/**
 * 变体展示卡。每张卡自己维护一份"是否放大"的状态 ——
 * 放在页面级 state 里会让 44 张卡每次操作都全量重渲染。
 */
function VariantCard({
  variant,
  size,
  picked,
  onPick,
}: {
  variant: SpinVariant;
  size: number;
  picked: boolean;
  onPick: (v: SpinVariant) => void;
}): JSX.Element {
  return (
    <Card
      variant={picked ? "solid" : "default"}
      className={"flex flex-col items-center gap-3 p-4 transition-colors " + (picked ? "border-primary/50" : "hover:border-primary/40")}
    >
      {/* 固定高度的展示区: 不同变体的实际占位高度不同, 不固定会让网格错位 */}
      <div className="flex h-16 items-center justify-center">
        <Spin variant={variant} size={size} />
      </div>
      <div className="flex w-full items-center justify-between gap-2">
        <code className="truncate font-mono text-[11px] text-foreground/80">{variant}</code>
        {picked ? <Badge variant="default">已选</Badge> : null}
      </div>
      <Button variant="ghost" size="xs" onClick={() => onPick(variant)} className="w-full">
        {picked ? "取消" : "选它"}
      </Button>
    </Card>
  );
}

export function SpinPage(): JSX.Element {
  const [size, setSize] = useState(40);
  const [picked, setPicked] = useState<SpinVariant[]>(["quantum"]);

  const toggle = (v: SpinVariant): void => {
    setPicked((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  return (
    <>
      <P>
        全部 44 种形态来自 <Code>UI Ball LDRS</Code>（MIT 许可，带官方 React 版）。
        它们是**逐帧手调**出来的动效 —— 每个关键帧各自的插值曲线、每个元素各自的延迟，
        不是参数化生成。这也是为什么不该手写复刻：能做出来"像"，但没那个劲。
      </P>

      <Callout title="选它，然后告诉我">
        下面每张卡都能点「选它」。挑完把名字发我，我把其他的裁掉只留你选的 ——
        组件的 <Code>variant</Code> 白名单在 <Code>src/primitives/spin.tsx</Code> 顶部，
        裁剪就是删几行。
      </Callout>

      <H2>怎么挑</H2>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-[12.5px] text-muted-foreground">尺寸</span>
        {[16, 24, 40, 64].map((s) => (
          <Button key={s} variant={size === s ? "primary" : "outline"} size="xs" onClick={() => setSize(s)}>
            {s}px
          </Button>
        ))}
        <span className="text-[12.5px] text-muted-foreground">已选 {picked.length} 个</span>
        {picked.length ? <Badge variant="outline">{picked.join(" ")}</Badge> : null}
      </div>
      <P>
        <b className="text-foreground">16px 是分水岭</b>：那个尺寸下细节全部丢失，
        只有轮廓最简的几种还读得出来（<Code>quantum</Code>、<Code>ring</Code>、
        <Code>dotPulse</Code>、<Code>pulsar</Code>）。选之前先把尺寸切到 16 看一眼。
      </P>

      <H2>轮播模式</H2>
      <P>
        <Code>mode="rotate"</Code> 会每隔 <Code>interval</Code> 毫秒随机换一个形态，带交叉淡入淡出。
        换的时机按**时间**而不是按"播了几轮"—— 44 个形态的周期从 0.5s 到 1.8s 不等，
        按轮数换算会让每个形态停留的时长不一致，看起来像随机抽搐。
      </P>
      <Preview
        align="center"
        code={`{/* 整页加载 / 长任务等待: 换形态能让等待不那么难熬 */}
<Spin mode="rotate" size={56} className="text-primary" />

{/* 换得快一点, 池子小一点 */}
<Spin mode="rotate" interval={1200} size={40}
      rotatePool={["quantum", "helix", "trefoil"]} />

{/* 只出现一瞬间的地方: 每次挂载随机一个, 之后不变 */}
<Spin mode="random" size={24} />`}
      >
        <Spin mode="rotate" size={56} className="text-primary" />
        <Spin mode="rotate" interval={1200} size={40} rotatePool={["quantum", "helix", "trefoil"]} className="text-emerald-400" />
        <Spin mode="random" size={24} />
        <Spin mode="rotate" interval={3000} size={32} rotatePool={["miyagi", "zoomies", "wobble", "pinwheel"]} className="text-amber-400" />
      </Preview>
      <Callout kind="warning" title="默认是 fixed, 不是 rotate">
        加载指示器最不该出现的是「界面里同时有五种转圈」。<Code>rotate</Code> 只在明确传了才生效，
        免得每个使用方无意中把界面变成转盘。
      </Callout>

      <H2>全部形态</H2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {SPIN_VARIANTS.map((v) => (
          <VariantCard key={v} variant={v} size={size} picked={picked.includes(v)} onPick={toggle} />
        ))}
      </div>

      <H2>用法</H2>
      <Preview
        align="center"
        code={`import { Spin } from "@hx/ui";

<Spin />                              {/* 默认 quantum, md (24px) */}
<Spin variant="helix" size="lg" />    {/* 指定形态与预设尺寸 */}
<Spin variant="dotPulse" size={18} /> {/* 数字尺寸 */}
<Spin variant="miyagi" className="text-primary" />  {/* 主题色 */}
<Spin variant="quantum" label="加载中" />            {/* 无障碍 */}`}
      >
        <Spin />
        <Spin variant="helix" size="lg" />
        <Spin variant="dotPulse" size={18} />
        <Spin variant="miyagi" className="text-primary" />
        <Spin variant="superballs" size={32} />
        <Spin variant="trefoil" size={32} />
      </Preview>

      <H2>颜色跟随 currentColor</H2>
      <P>默认 color 是 <Code>currentColor</Code>，所以主题类直接生效，不需要为每种颜色配一个变体。</P>
      <Preview
        align="center"
        code={`<Spin className="text-primary" />
<Spin className="text-muted-foreground" />
<Spin className="text-destructive" />
<Spin className="text-emerald-400" />`}
      >
        <Spin size={36} className="text-primary" />
        <Spin size={36} className="text-muted-foreground" />
        <Spin size={36} className="text-destructive" />
        <Spin size={36} className="text-emerald-400" />
      </Preview>

      <H2>放进界面</H2>
      <Preview
        align="stretch"
        code={`<Button variant="primary" disabled>
  <Spin size={14} /> 保存中
</Button>`}
      >
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-3">
            <Button variant="primary" disabled>
              <Spin size={14} variant="dotPulse" /> 保存中
            </Button>
            <Button variant="outline" disabled>
              <Spin size={14} variant="ring" /> 同步中
            </Button>
          </div>
          <Card variant="muted" className="flex items-center gap-3 p-4">
            <Spin size={20} variant="quantum" className="text-primary" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium">正在生成回答</div>
              <div className="text-[12px] text-muted-foreground">已收到 128 个 token</div>
            </div>
          </Card>
        </div>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "variant", type: "SpinVariant (41 种)", default: '"quantum"', desc: "固定播放时的形态。全部可选值见上方网格。" },
          { name: "mode", type: '"fixed" | "rotate" | "random"', default: '"fixed"', desc: "播放模式。rotate 会定时随机换形态并交叉淡入。" },
          { name: "interval", type: "number", default: "2200", desc: "轮播间隔（毫秒）。短于 1500 会看不清形态。" },
          { name: "rotatePool", type: "readonly SpinVariant[]", desc: "轮播候选池。默认 12 个节奏相近的形态。" },
          { name: "size", type: '"sm" | "md" | "lg" | "xl" | number', default: '"md"', desc: "预设四档或直接给像素数。" },
          { name: "color", type: "string", default: '"currentColor"', desc: "颜色。默认跟随文字色，主题类直接生效。" },
          { name: "speed", type: "number", desc: "每圈秒数。不传用该形态自己的默认值（每个形态的默认速度都是调过的）。" },
          { name: "label", type: "string", desc: "无障碍标签。不传则对辅助技术隐藏。" },
        ]}
      />

      <H2>尺寸与无障碍</H2>
      <P>
        <b className="text-foreground">容器尺寸由 LDRS 自己决定</b>，多数形态是正方形，
        少数（<Code>waveform</Code>、<Code>mirage</Code>、<Code>dotStream</Code>）是扁的。
        组件的 <Code>&lt;span&gt;</Code> 是 flex 容器，因此两种都能正确居中。
      </P>
      <P>
        <Code>prefers-reduced-motion</Code> 的处理交给使用方：库不替使用者决定
        "减少动态"时该显示什么。要停掉动画时给一个静态替代（例如 <Code>&lt;span&gt;加载中&lt;/span&gt;</Code>），
        而不是让它冻在中间帧 —— 冻结会留下一个看不出状态的形状。
      </P>
    </>
  );
}