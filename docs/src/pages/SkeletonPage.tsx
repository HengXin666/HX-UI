import type { JSX } from "react";
import { DOC_SAMPLE, Skeleton, SkeletonText } from "@hx/ui";
import { H2, P, Preview } from "../components/DocKit";
import { Props } from "../components/DocSpec";

/** Skeleton / SkeletonText 页 */
export function SkeletonPage(): JSX.Element {
  return (
    <>
      <H2>Skeleton</H2>
      <P>
        只做一件事: 占住位置。不要用它模拟真实内容的形状细节  那会变成一份要跟着真实布局
        同步维护的赝品, 界面一改就对不上。宽度用比例 (w-2/3) 而不是像素, 嵌进任何宽度的容器都不会溢出。
      </P>
      <Preview
        code={`<Skeleton className="h-3 w-64" />
<Skeleton className="h-3 w-40" />
<SkeletonText lines={3} className="w-64" />`}
      >
        <div className="flex w-64 flex-col gap-2">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-40" />
          <SkeletonText lines={DOC_SAMPLE.skeletonLines} />
        </div>
      </Preview>

      <H2>属性</H2>
      <Props spec={`
SkeletonText.lines ~ number ~ 3 ~ 行数, 末行自动短一截
`} />
    </>
  );
}
