import { useState } from "react";
import { BlueprintWorkbench } from "@/blueprint/ui";
import { demoRegistry, type BlueprintGraph } from "@/blueprint";
import { workbenchDoc } from "./blueprint.sample";

// 演示数据为虚构. 整页工作台: #/ui/blueprint/full
export default function BlueprintFullPage() {
  const [graph, setGraph] = useState<BlueprintGraph>(workbenchDoc);
  return (
    <BlueprintWorkbench
      registry={demoRegistry}
      value={graph}
      onChange={setGraph}
      storageKey="hx-docs-bp-workbench"
      debug={{ breakpoints: ["fn_damage/log"], stepMs: 200 }}
      onSave={() => undefined}
      toolbarEnd={<a href="#/ui/blueprint" className="mr-1 inline-flex h-8 shrink-0 items-center rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">返回文档</a>}
    />
  );
}
