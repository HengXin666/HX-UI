import {
  alignSelected, collapseSelected, commentSelected, deleteSelected, distributeSelected, duplicate, straighten,
} from "./commands";
import type { BlueprintEditor } from "./editor";
import type { CommandId } from "./shortcuts";

/** UI pieces a command may need (menus and overlays live in the React view). */
export interface CommandUI {
  openActions(): void;
  /** Close menus / help / rename; returns true when something was open. */
  closeAll(): boolean;
  toggleHelp(): void;
  rename(target: { kind: "node" | "comment"; id: string }): void;
}

/** Run one entry of the SHORTCUTS table. copy / cut / paste go through clipboard events instead. */
export function runCommand(ed: BlueprintEditor, id: CommandId, ui: CommandUI): void {
  const sel = ed.selection;
  switch (id) {
    case "undo": return ed.undo();
    case "redo": return ed.redo();
    case "duplicate": return duplicate(ed);
    case "delete": return deleteSelected(ed);
    case "rename":
      if (sel.nodes.length === 1) ui.rename({ kind: "node", id: sel.nodes[0]! });
      else if (sel.comments.length === 1 && !sel.nodes.length) ui.rename({ kind: "comment", id: sel.comments[0]! });
      return;
    case "comment": {
      const c = commentSelected(ed);
      if (c) requestAnimationFrame(() => ui.rename({ kind: "comment", id: c }));
      return;
    }
    case "collapse": return void collapseSelected(ed);
    case "selectAll": return ed.selectAll();
    case "escape": if (!ui.closeAll()) ed.clearSelection(); return;
    case "fit": return ed.fit();
    case "menu": return ui.openActions();
    case "help": return ui.toggleHelp();
    case "exit": return ed.exitTo(ed.path.length - 1);
    case "straighten": return straighten(ed);
    case "alignTop": return alignSelected(ed, "top");
    case "alignBottom": return alignSelected(ed, "bottom");
    case "alignLeft": return alignSelected(ed, "left");
    case "alignRight": return alignSelected(ed, "right");
    case "alignMiddle": return alignSelected(ed, "middle");
    case "alignCenter": return alignSelected(ed, "center");
    case "distributeX": return distributeSelected(ed, "x");
    case "distributeY": return distributeSelected(ed, "y");
    case "copy": case "cut": case "paste": return;
  }
}
