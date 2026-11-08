import type { JSX } from "react";
import { Tile } from "../kit/Tile";
import { TYPE, WRAP } from "../kit/layout";
import { FACTS } from "../site-facts";
import { ChipsArt, OrbitArt, SkinsArt, SourceArt, SpringArt, TokensArt } from "./art";
import { INDEX_ID } from "../../docs/constants";

const ART_H = 172;

/** What's inside: 两行三卡, 宽度交错 (5:3:4 与 4:5:3). 卖点都是仓库里的真事实. */
export function Inside({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <section aria-labelledby="inside-title" className={`${WRAP} pt-[148px] pb-[84px]`}>
      <h2 id="inside-title" className={TYPE.h2}>里面有什么</h2>
      <div className="mt-[37px] grid gap-4 md:grid-cols-[522fr_307fr_415fr]">
        <Tile art={<ChipsArt />} artHeight={ART_H} title={`${FACTS.pages} 页文档`} desc="按钮, 表单, 浮层, 图表, AI 交互到整页模板. 自己从头写的那些, 这里已经做好并测过." onOpen={() => onGo("install")} />
        <Tile art={<SkinsArt />} artHeight={ART_H} title={`${FACTS.skins} 套皮肤`} desc="只换令牌不换组件, 一个属性切一整套气质." onOpen={() => onGo("skins")} />
        <Tile art={<OrbitArt />} artHeight={ART_H} title={`${FACTS.groups} 个分组`} desc="按找东西的方式分组, 不用在一整面墙里翻." onOpen={() => onGo(INDEX_ID)} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[415fr_522fr_307fr]">
        <Tile art={<TokensArt />} artHeight={ART_H} title="语义令牌" desc="颜色只来自 token, 亮暗与每套皮肤共用一份. 线一律 1px." onOpen={() => onGo("tokens")} />
        <Tile art={<SourceArt />} artHeight={ART_H} title="源码即文档" desc="每个演示旁边就是它的源码. 复制给 Cursor, Copilot 或 Claude Code, 照着就能拼." onOpen={() => onGo("code-block")} />
        <Tile art={<SpringArt />} artHeight={ART_H} title="可中断弹簧" desc="按下 90ms, 松开带着当前速度继续, 不从 0 重播." onOpen={() => onGo("motion")} />
      </div>
    </section>
  );
}
