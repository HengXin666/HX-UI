import type { RenameTarget } from "./rename-field";
import {
  alignSelected, collapseSelected, commentSelected, deleteSelected, distributeSelected, duplicate, moveActive, nudge, straighten,
} from "./commands";
import type { BlueprintEditor } from "./editor";
import type { CommandId } from "./shortcuts";

/** UI pieces a command may need (menus and overlays live in the React view). */
export interface CommandUI {
  openActions(): void;
  /** Close menus / help / rename; returns true when something was open. */
  closeAll(): boolean;
  toggleHelp(): void;
  rename(target: RenameTarget): void;
  openFind(): void;
  /** Debug keys only act when the editor has `debug` on. */
  readonly debug: boolean;
}

/**
 * Run one entry of the SHORTCUTS table. copy / cut / paste go through clipboard events instead.
 * `key` is the event's key (arrow commands need the direction). Returns false when the command did
 * not apply, so the key keeps its default behaviour.
 */
export function runCommand(ed: BlueprintEditor, id: CommandId, ui: CommandUI, key = ""): boolean | void {
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
    case "nudge": return nudge(ed, key, false);
    case "nudgeFine": return nudge(ed, key, true);
    case "focusNode": return moveActive(ed, key);
    case "activate": {
      if (sel.nodes.length !== 1) return false;
      const n = ed.graph.nodes.find((x) => x.id === sel.nodes[0]);
      if (n?.subgraph !== undefined) ed.enter(n.subgraph);
      else if (n) ui.rename({ kind: "node", id: n.id });
      return;
    }
    case "find": return ui.openFind();
    case "breakpoint": return ed.toggleBreakpoint();
    case "run": if (!ui.debug) return false; void ed.run(); return;
    case "step": if (!ui.debug) return false; void ed.step(); return;
    case "stop": if (!ui.debug) return false; ed.stop(); return;
    case "copy": case "cut": case "paste": return;
  }
}
