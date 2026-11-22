import type { InteractionEntry } from "./types";
import { meta as speedCounter } from "./speed-counter/meta";
import { meta as statefulButton } from "./stateful-button/meta";

/** L2 交互清单. 文档站从这里生成网格和调参页; 演示按需加载. */
export const INTERACTIONS: readonly InteractionEntry[] = [
  { meta: speedCounter, load: () => import("./speed-counter/demo") },
  { meta: statefulButton, load: () => import("./stateful-button/demo") },
];
