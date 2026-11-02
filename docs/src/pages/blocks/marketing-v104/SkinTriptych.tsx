import type { JSX } from "react";
import { DOC_V104 } from "./data";
import { ChangelogListDemo, TestimonialsDemo } from "./Demos";

/**
 * 三皮肤演示: 同一份数据放进 default / linear / fintech 三个 data-skin 作用域并排渲染.
 * 区块只读语义令牌, 外观差异全部来自皮肤 css.
 */
export function SkinTriptych(): JSX.Element {
  return (
    <div className={DOC_V104.skinGrid}>
      {DOC_V104.skins.map((skin) => (
        <div key={skin} {...{ [DOC_V104.skinAttr]: skin }} className={DOC_V104.skinFrame}>
          <span className={DOC_V104.skinTag}>{`${DOC_V104.skinAttr}="${skin}"`}</span>
          <TestimonialsDemo />
          <ChangelogListDemo />
        </div>
      ))}
    </div>
  );
}
