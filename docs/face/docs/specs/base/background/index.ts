import type { PageSpec } from "../../types";
import { MESH_GRADIENT } from "./mesh-gradient";
import { BACKDROP } from "./backdrop";
import { BEAM } from "./beam";
import { GRID_LINES } from "./grid-lines";
import { GRAIN } from "./grain";

/** 基础组件 / 背景 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const BACKGROUND_SPECS: readonly PageSpec[] = [MESH_GRADIENT, BACKDROP, BEAM, GRID_LINES, GRAIN];
