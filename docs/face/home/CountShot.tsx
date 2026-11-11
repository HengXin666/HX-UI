import { useRef, type JSX } from "react";
import { NumberRoll } from "../../../src/craft";
import { useScrollProgressValue } from "../../../src/motion";
import { SCROLL_OFFSET } from "../../../src/constants/motion";
import { FACTS } from "./site-facts";

/** 舞台进度过了这一点数字才滚到终值, 往回滚过它就滚回 0. */
const ROLL_AT = 0.15;

/** 镜 2: 一镜一个数字. sticky 舞台铺满视口, 进度驱动, 可逆. */
export function CountShot(): JSX.Element {
  const track = useRef<HTMLElement>(null);
  const progress = useScrollProgressValue({ target: track, offset: [...SCROLL_OFFSET.contain] });
  const value = progress >= ROLL_AT ? FACTS.docs : 0;
  return (
    <section ref={track} data-shot="2" className="relative h-[180svh] border-b border-border">
      <div className="sticky top-12 flex h-[calc(100svh-3rem)] flex-col items-center justify-center px-5 text-center">
        <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground">02 / 规模</p>
        <p className="mt-6 text-8xl font-semibold tracking-tight text-foreground md:text-[10rem]">
          <NumberRoll value={value} />
        </p>
        <p className="mt-4 text-base text-foreground">篇组件文档, 每一篇都是能按的组件</p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {FACTS.components} 个组件 · {FACTS.groups} 个分组 · {FACTS.blocks} 组区块 · {FACTS.templates} 套模板 · {FACTS.skins} 套皮肤
        </p>
      </div>
    </section>
  );
}
