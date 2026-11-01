import { useState, type JSX, type ReactNode } from "react";
import { ActivityIcon, BoxesIcon, GaugeIcon, LayersIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { ALIGN, Badge, TONE_VARIANT } from "@hx/ui";
import { Bento, BentoItem } from "../../../../src/box";
import { BOX_CLASS, BOX_DOC, BOX_STEP, BENTO_PAGE_PROPS } from "../../../../src/constants/box";
import { H2, P, Preview, PropsTable, Callout, Code } from "../../components/DocKit";

/** 磁贴里的示意图块: 只用语义色, 让大小差异看得见. */
function Visual({ children }: { children: ReactNode }): JSX.Element {
  return <div className="flex size-full items-center justify-center bg-muted/40 text-muted-foreground">{children}</div>;
}

export function BentoPage(): JSX.Element {
  const [picked, setPicked] = useState<string>();
  return (
    <>
      <P>
        Bento 是不等大小磁贴拼成的展示墙: 落地页的特性区, 仪表盘的概览. 跨度只写 lg 起的值, 小屏自动收窄,
        <Code>grid-flow-row-dense</Code> 让小磁贴回填大磁贴留下的空洞.
      </P>
      <Callout title="断点策略">
        手机单列, 跨度失效按源顺序堆叠; sm 两列, 跨度最多 2; lg 起按 cols (默认 4) 排, 跨度原样生效.
        行高是 <Code>minmax(行高档, auto)</Code>, 内容多时行会长高, 不会裁字. gap 与 Stack / Grid 同一套档.
      </Callout>

      <H2>基础拼法</H2>
      <P>一块 2x2 的主磁贴, 一块横向宽磁贴, 其余单格. 磁贴自带图标, 标题, 说明与底栏几个槽位.</P>
      <Preview
        align={ALIGN.stretch}
        code={`<Bento cols={4} rowHeight="md" gap="md" aria-label="特性">
  <BentoItem colSpan={2} rowSpan={2} icon={<SparklesIcon />} title="动效引擎" description="…">
    <Visual />
  </BentoItem>
  <BentoItem colSpan={2} icon={<GaugeIcon />} title="性能" description="…" />
  <BentoItem icon={<ShieldCheckIcon />} title="可访问" />
  <BentoItem icon={<LayersIcon />} title="分层" />
  <BentoItem colSpan="full" surface={TONE_VARIANT.muted} title="全宽横幅" />
</Bento>`}
      >
        <Bento aria-label="特性" className={BOX_CLASS.fullWidth}>
          <BentoItem
            colSpan={BOX_DOC.wide}
            rowSpan={BOX_DOC.tall}
            icon={<SparklesIcon />}
            title="动效引擎"
            description="入场, 交错, 数字滚动共用一套弹簧预设."
          >
            <Visual>
              <div className="flex h-24 items-end gap-1.5">
                {BOX_DOC.bars.map((height, index) => (
                  <div key={index} className="w-3 rounded-sm bg-primary/60" style={{ height: `${height}%` }} />
                ))}
              </div>
            </Visual>
          </BentoItem>
          <BentoItem colSpan={BOX_DOC.wide} icon={<GaugeIcon />} title="性能" description="布局原语零运行时, 只拼类名与 CSS 变量." />
          <BentoItem icon={<ShieldCheckIcon />} title="可访问" description="列表语义, 焦点环可见." />
          <BentoItem icon={<LayersIcon />} title="分层" description="card / muted / outline 三种面." />
          <BentoItem colSpan={BOX_DOC.full} surface={TONE_VARIANT.muted} title="全宽横幅" description="col-span-full 在每个断点都铺满一行." />
        </Bento>
      </Preview>

      <H2>可点磁贴</H2>
      <P>
        给 <Code>href</Code> 渲染链接, 给 <Code>onSelect</Code> 渲染按钮. 热区覆盖整块, Tab 可达, 焦点环画在磁贴上,
        读屏念 title (或 actionLabel).
      </P>
      <Preview align={ALIGN.stretch}>
        <div className={BOX_CLASS.fullWidth}>
          <Bento cols={BOX_DOC.cols} rowHeight={BOX_STEP.sm} gap={BOX_STEP.sm} aria-label="入口">
            <BentoItem icon={<ActivityIcon />} title="运行状态" onSelect={() => setPicked("运行状态")} footer={<Badge>实时</Badge>} />
            <BentoItem icon={<BoxesIcon />} title="组件清单" onSelect={() => setPicked("组件清单")} footer="119 个导出" />
            <BentoItem icon={<LayersIcon />} title="设计令牌" href="#tokens" footer="跳到令牌页" />
          </Bento>
          <p className={`mt-3 ${BOX_CLASS.mutedText}`} aria-live={BOX_DOC.live}>
            {picked ? `选中了: ${picked}` : "点一块磁贴, 或 Tab 过去按回车."}
          </p>
        </div>
      </Preview>

      <H2>属性</H2>
      <PropsTable rows={[...BENTO_PAGE_PROPS]} />
    </>
  );
}
