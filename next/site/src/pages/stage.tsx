import * as React from "react";
import { defaults, type ControlValues, type InteractionEntry } from "@/interactions/types";

/** 懒加载一件交互的演示. 网格卡片和详情页共用. */
export function useDemo(entry: InteractionEntry) {
  const [Demo, setDemo] = React.useState<React.ComponentType<{ values: ControlValues }> | null>(null);
  React.useEffect(() => {
    let live = true;
    entry.load().then((mod) => live && setDemo(() => mod.default));
    return () => { live = false; };
  }, [entry]);
  return Demo;
}

export function Stage({ entry, values, className }: { entry: InteractionEntry; values?: ControlValues; className?: string }) {
  const Demo = useDemo(entry);
  const v = values ?? defaults(entry.meta);
  return (
    <div className={className}>
      {Demo ? <Demo values={v} /> : <div className="text-xs text-muted-foreground">加载中…</div>}
    </div>
  );
}

