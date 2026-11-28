"use client";

import { ContextMenu } from "./context-menu";
import type { BlueprintEditor } from "./editor";
import { menuFor, type MenuHost, type MenuTarget } from "./menu-items";

/** Right-click menu for a node / wire / comment / pin. Its own chunk, loaded with the first right-click. */
export default function ContextHost({ ed, target, sx, sy, host, ui, onClose }: {
  ed: BlueprintEditor; target: MenuTarget; sx: number; sy: number; host: HTMLElement | null; ui: MenuHost; onClose: () => void;
}) {
  const ctx = menuFor(ed, target, ui);
  return <ContextMenu title={ctx.title} items={ctx.items} sx={sx} sy={sy} host={host} onClose={onClose} />;
}
