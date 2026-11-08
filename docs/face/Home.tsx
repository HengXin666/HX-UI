import type { JSX } from "react";
import { Hero } from "./home/hero/Hero";
import { Inside } from "./home/inside/Inside";
import { Action } from "./home/action/Action";
import { Command } from "./home/more/Command";
import { Templates } from "./home/more/Templates";
import { Tools } from "./home/more/Tools";
import { Changelog } from "./home/more/Changelog";
import { Faq } from "./home/outro/Faq";
import { Closing } from "./home/outro/Closing";

/**
 * 门面首页只做编排, 段落顺序对着 reactbits.dev 首页: 首屏舞台, 里面有什么, 实际效果, 一条命令,
 * 整页模板, 工具, 更新日志, 常见问题, 收尾. 旧的 sticky 镜头不再挂载, 四镜进了实际效果段的卡里.
 */
export function Home({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <main className="pb-0">
      <Hero onGo={onGo} />
      <Inside onGo={onGo} />
      <div className="bg-surface-sunken">
        <Action onGo={onGo} />
        <Command onGo={onGo} />
        <Templates onGo={onGo} />
      </div>
      <Tools onGo={onGo} />
      <Changelog />
      <Faq />
      <Closing onGo={onGo} />
    </main>
  );
}
