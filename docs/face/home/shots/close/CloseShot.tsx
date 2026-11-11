import type { CSSProperties, JSX } from "react";
import { BUTTON_TYPE } from "@hx/ui";
import { NumberRoll } from "../../../../../src/craft";
import { REPO_URL } from "../../../../src/components/site";
import { FACTS, VERSION } from "../../site-facts";
import { Stage } from "../stage";
import { CLOSE_END_MS, closePose, wordPose } from "./shot-close";

/** 收尾一句, 按词压印. 带 mark 的那个词起马克线. */
const WORDS = [
  { text: "现在," },
  { text: "去排" },
  { text: "你的" },
  { text: "那一页.", mark: true },
] as const;
const LICENSE = "Apache-2.0";
const SUB_ALPHA = 0.7;
const BLUEPRINT = "blueprint";
const LINK = "text-sm underline-offset-4 opacity-80 hover:underline hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const EXTERNAL = { target: "_blank", rel: "noreferrer" } as const;

/** 镜 8: 深色收尾. 一句大标题, mono 副行, 四个出口. 不做片尾淡出. */
export function CloseShot({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <Stage id="8" total={CLOSE_END_MS} label="收尾" className="bg-foreground text-background dark:bg-card dark:text-card-foreground">
      {({ ms }) => {
        const pose = closePose(ms, WORDS.length);
        return (
          <footer className="mx-auto flex h-full w-full max-w-[78rem] flex-col justify-center px-5 py-12 md:px-8 lg:px-14">
            <p className="font-mono text-xs tracking-[0.12em] opacity-60">08 / 收尾</p>
            <h2 className="mt-6 text-5xl font-semibold leading-[1.15] tracking-tight md:text-7xl">
              {WORDS.map((word, index) => {
                const w = wordPose(index, ms);
                const style: CSSProperties = {
                  opacity: w.opacity,
                  filter: `blur(${w.blur}px)`,
                  transform: `scale(${w.scale})`,
                };
                return (
                  <span key={word.text} data-shot-part={`word-${index}`} className={`relative isolate inline-block origin-bottom-left ${index === 0 ? "mr-[0.25em]" : ""}`} style={style}>
                    {"mark" in word ? (
                      <span
                        aria-hidden
                        data-shot-part="marker"
                        className="absolute inset-x-0 bottom-[0.08em] -z-10 h-[0.36em] origin-left bg-primary/35"
                        style={{ transform: `scaleX(${pose.mark})` }}
                      />
                    ) : null}
                    {word.text}
                  </span>
                );
              })}
            </h2>
            <span aria-hidden data-shot-part="rule" className="mt-6 block h-px w-full max-w-[44rem] origin-left bg-current opacity-40" style={{ transform: `scaleX(${pose.rule})` }} />
            <p data-shot-part="sub" className="mt-6 font-mono text-sm leading-[1.8]" style={{ opacity: SUB_ALPHA * pose.sub }}>
              <NumberRoll value={FACTS.docs} progress={pose.sub} />
              <span> 篇组件文档 · {FACTS.components} 个组件 · {FACTS.groups} 个分组 · {FACTS.templates} 套模板 · {LICENSE} · v{VERSION}</span>
            </p>
            <nav aria-label="站点出口" className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-current/20 pt-6">
              <a className={LINK} href={REPO_URL} {...EXTERNAL}>GitHub</a>
              <a className={LINK} href={`${REPO_URL}/blob/HEAD/CHANGELOG.md`} {...EXTERNAL}>更新日志</a>
              <a className={LINK} href={`${REPO_URL}/blob/HEAD/LICENSE`} {...EXTERNAL}>许可证</a>
              <button type={BUTTON_TYPE} className={LINK} onClick={() => onGo(BLUEPRINT)}>蓝图</button>
            </nav>
          </footer>
        );
      }}
    </Stage>
  );
}
