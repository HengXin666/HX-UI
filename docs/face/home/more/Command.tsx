import type { JSX } from "react";
import { BUTTON_TYPE, Button } from "@hx/ui";
import meshSource from "../../../../src/effects/MeshGradient.tsx?raw";
import { CodeLines, Terminal, Win, tint } from "../kit/Code";
import { ARROW, BTN, TYPE, WRAP } from "../kit/layout";
import { INSTALL, INSTALL_NEXT } from "../hero/Hero";

/** 源码窗里放的真组件源码: 库里 MeshGradient 的原文, 从文件读, 不手抄. */
const SOURCE_LINES = meshSource.split("\n").slice(2, 26);

/** One command: 左文案与按钮, 右终端叠一个源码窗. 命令与安装页一致, 源码是库里的原文件. */
export function Command({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <section aria-labelledby="command-title" className={`${WRAP} grid gap-10 pt-[213px] md:grid-cols-[minmax(0,1fr)_706px] md:gap-0`}>
      <div className="flex flex-col justify-end pb-[126px]">
        <h2 id="command-title" className={TYPE.h2}>
          一条命令.
          <br />
          装好就能用.
        </h2>
        <p className={`${TYPE.lede} mt-6 max-w-[27rem]`}>
          npm 装一个包, 入口 CSS 引一次样式. 组件, 令牌, 皮肤和动效都在里面, 源码就是你看到的这份.
        </p>
        <div className="mt-[42px]">
          <Button asChild {...BTN.dark}>
            <button type={BUTTON_TYPE} onClick={() => onGo("install")}>
              安装指南 <span aria-hidden>{ARROW}</span>
            </button>
          </Button>
        </div>
      </div>
      <div className="relative min-w-0 md:h-[502px]">
        <Terminal command={INSTALL} after={INSTALL_NEXT} className="md:absolute md:left-0 md:top-0 md:h-[152px] md:w-[436px]" />
        <Win title="MeshGradient.tsx" className="mt-4 md:absolute md:left-[99px] md:top-[167px] md:mt-0 md:h-[335px] md:w-[607px]">
          <div className="relative h-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
            <CodeLines lines={SOURCE_LINES.map((line) => tint(line))} className="text-[13px] md:text-[13px]" />
          </div>
        </Win>
      </div>
    </section>
  );
}
