import type { JSX } from "react";
import { AppFrame } from "@hx/ui";
import { H2, P, Preview } from "../components/DocKit";

export function AppFramePage(): JSX.Element {
  return (
    <>
      <P>
        应用外壳是"像应用"与"像网页"的分界线。它不是简单的全屏容器 —— 它在外层留 8px 白边,
        让侧栏与主区各自成为一块圆角面板, 中间才有那条缝。省掉这条缝, 界面会顶满窗口四边。
      </P>

      <H2>结构</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">AppFrame</code> 只负责最外层。
        两个面板与中间的间隙由使用方在 children 里给出 —— 因为不同产品的分栏数不一样。
      </P>
      <Preview
        align="stretch"
        className="[&>div:first-child]:min-h-[260px]"
        code={`<AppFrame>
  {/* 关键: gap-2 提供面板之间的缝, p-2 提供与窗口的留白 */}
  <div className="relative z-10 flex min-h-0 flex-1 gap-2 p-2">
    <aside className="flex w-60 shrink-0 flex-col overflow-hidden rounded-xl
                      border border-border/40 bg-card/25">
      <div className="h-11 shrink-0" />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2.5 pb-2.5">
        {/* 导航项 */}
      </div>
    </aside>
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden
                     rounded-xl border border-border/40">
      {/* 页面内容 */}
    </main>
  </div>
</AppFrame>`}
      >
        <div className="h-[260px] w-full overflow-hidden rounded-lg border border-border/60">
          <AppFrame>
            <div className="relative z-10 flex min-h-0 flex-1 gap-2 p-2">
              <aside className="flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-border/40 bg-card/25">
                <div className="h-11 shrink-0" />
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                  {["概览", "项目", "素材库", "设置"].map((t) => (
                    <div key={t} className="rounded-md px-2 py-1.5 text-[12.5px] text-muted-foreground">{t}</div>
                  ))}
                </div>
              </aside>
              <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/40 p-4">
                <div className="text-[13px] font-medium">主内容区</div>
                <div className="mt-1 text-[12px] text-muted-foreground">它是页面底色, 所以不加 bg-card。</div>
              </main>
            </div>
          </AppFrame>
        </div>
      </Preview>

      <H2>两个易错点</H2>
      <P>
        纵向 flex 里的滚动容器: 容器自己写 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">min-h-0 flex-1</code>,
        它的**子项**写 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">h-full overflow-y-auto</code>。
        子项若写 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">flex-1</code>, 在纵向 flex 里只影响主轴尺寸, 撑不出滚动区, 内容会溢出被裁。
      </P>
      <P>
        主区面板**不要**加 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-card</code>。
        它该是页面底色, 否则会挡住下面的纹理或光晕层。
      </P>
    </>
  );
}
