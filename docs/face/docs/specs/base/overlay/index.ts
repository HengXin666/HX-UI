import type { PageSpec } from "../../types";
import { ALERT_DIALOG } from "./alert-dialog";
import { COMMAND } from "./command";
import { CONFIRM_DIALOG } from "./confirm-dialog";
import { CONTEXT_MENU } from "./context-menu";
import { DIALOG } from "./dialog";
import { DRAWER } from "./drawer";
import { DROPDOWN_MENU } from "./dropdown-menu";
import { HOVER_CARD } from "./hover-card";
import { MENUBAR } from "./menubar";
import { POPOVER } from "./popover";
import { SHEET } from "./sheet";
import { TOOLTIP } from "./tooltip";

/** 基础组件 / 浮层与菜单 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const OVERLAY_SPECS: readonly PageSpec[] = [
  DIALOG,
  ALERT_DIALOG,
  CONFIRM_DIALOG,
  DRAWER,
  SHEET,
  POPOVER,
  HOVER_CARD,
  TOOLTIP,
  DROPDOWN_MENU,
  CONTEXT_MENU,
  MENUBAR,
  COMMAND,
];
