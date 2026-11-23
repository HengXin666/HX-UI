import { memo } from "react";
import type { ResolvedPin } from "../ports";
import type { Registry } from "../registry";
import { REROUTE } from "../registry";
import type { BlueprintNode, ParamDef } from "../types";
import type { BlueprintEditor } from "./editor";
import { pinColors, typeColor, type NodeLayout } from "./geometry";
import { PinGlyph } from "./pin";

/**
 * One node card. Memoised: a pan / zoom / drag never re-renders it (those write transforms
 * directly), and a graph change only re-renders the nodes whose props changed.
 *
 * Pointer handling is delegated to the canvas through data attributes:
 *   data-node="<id>"   the card      data-pin="in:<pin>" / "out:<pin>"   a pin cell
 *   data-nodrag        fields that keep their own pointer behaviour
 */

export interface NodeViewProps {
  readonly ed: BlueprintEditor;
  readonly node: BlueprintNode;
  readonly layout: NodeLayout;
  readonly kind: string;
  readonly title: string;
  readonly subtitle: string | undefined;
  readonly selected: boolean;
  /** Keyboard target (aria-activedescendant points at `domId`). */
  readonly active: boolean;
  readonly domId: string;
  readonly breakpoint: boolean;
  /** Connected pin keys joined by "|" ("in:a|out:then"), a string so memo compares cheaply. */
  readonly connected: string;
  readonly badPins: string;
  readonly issueLevel: "error" | "warning" | undefined;
  readonly issueText: string;
  readonly issueDetail: string;
  readonly readOnly: boolean;
}

export const NodeView = memo(function NodeView(p: NodeViewProps) {
  const { ed, node, layout, kind, selected } = p;
  const reg = ed.registry;
  const style = { transform: `translate(${node.x}px, ${node.y}px)`, width: layout.w, height: layout.h };

  if (node.type === REROUTE) {
    const t = layout.inputs[0]?.type ?? "any";
    return (
      <div className="bp-reroute" id={p.domId} data-node={node.id} data-selected={selected || undefined} data-active={p.active || undefined}
        data-breakpoint={p.breakpoint || undefined} title="转接点" style={{ ...style, ["--bp-wire" as string]: typeColor(reg, t) }} />
    );
  }

  const conn = new Set(p.connected.split("|"));
  const bad = new Set(p.badPins.split("|"));
  const rows = Math.max(layout.inputs.length, layout.outputs.length);
  const params = reg.node(node.type)?.params ?? [];
  return (
    <div className="bp-node" id={p.domId} data-node={node.id} data-kind={kind} data-selected={selected || undefined}
      data-active={p.active || undefined} data-breakpoint={p.breakpoint || undefined} data-disabled={node.disabled || undefined}
      data-collapsed={node.collapsed || undefined} role="group" aria-label={p.title} style={style}>
      {node.comment ? <div className="bp-note">{node.comment}</div> : null}
      <div className="bp-head">
        <span className="bp-head-title">{p.title}</span>
        {node.disabled ? <span className="bp-head-sub">已禁用</span> : p.subtitle ? <span className="bp-head-sub">{p.subtitle}</span> : null}
      </div>
      {node.collapsed ? null : (
        <div className="bp-body">
          {Array.from({ length: rows }, (_, i) => (
            <div className="bp-row" key={i}>
              {layout.inputs[i] ? <PinCell ed={ed} node={node} pin={layout.inputs[i]} connected={conn.has(`in:${layout.inputs[i].id}`)} bad={bad.has(`in:${layout.inputs[i].id}`)} readOnly={p.readOnly} /> : null}
              {layout.outputs[i] ? <PinCell ed={ed} node={node} pin={layout.outputs[i]} connected={conn.has(`out:${layout.outputs[i].id}`)} bad={false} readOnly={p.readOnly} /> : null}
            </div>
          ))}
          {params.length ? (
            <div className="bp-params">
              {params.map((d) => <ParamRow key={d.id} ed={ed} node={node} def={d} readOnly={p.readOnly} />)}
            </div>
          ) : null}
        </div>
      )}
      {p.issueLevel ? (
        <div className="bp-banner" data-level={p.issueLevel} title={p.issueDetail}>
          {p.issueLevel === "error" ? "错误" : "警告"}：{p.issueText}
        </div>
      ) : null}
    </div>
  );
});

/** Primary exec pins ("exec" in, "then" out) carry no label, as in UE5. */
const pinLabel = (pin: ResolvedPin) => pin.label ?? (pin.exec && (pin.id === "exec" || pin.id === "then") ? "" : pin.id);

function PinCell({ ed, node, pin, connected, bad, readOnly }: {
  ed: BlueprintEditor; node: BlueprintNode; pin: ResolvedPin; connected: boolean; bad: boolean; readOnly: boolean;
}) {
  const c = pinColors(ed.registry, pin.type);
  const label = pinLabel(pin);
  const literal = pin.direction === "in" && !connected && !pin.exec ? literalKind(ed.registry, pin.type) : undefined;
  return (
    <div className="bp-cell" data-dir={pin.direction} data-pin={`${pin.direction}:${pin.id}`}>
      <span className="bp-pin" data-bad={bad || undefined} title={`${label || pin.id}：${pin.type}`}>
        <PinGlyph shape={pin.shape} color={c.value} keyColor={c.key} connected={connected} />
      </span>
      {label ? <span className="bp-pin-label">{label}</span> : null}
      {literal ? (
        <LiteralField ed={ed} node={node} id={pin.id} kind={literal} value={node.values?.[pin.id] ?? pin.default} label={label || pin.id} readOnly={readOnly} width="pin" />
      ) : null}
    </div>
  );
}

type LiteralKind = "number" | "text" | "switch";

function literalKind(reg: Registry, type: string): LiteralKind | undefined {
  if (type === "any") return undefined;
  if (reg.assignable(type, "number") && reg.shape(type) === "data") return "number";
  if (reg.assignable(type, "boolean") && reg.shape(type) === "data") return "switch";
  if (reg.assignable(type, "string") && reg.shape(type) === "data") return "text";
  return undefined;
}

const commit = (ed: BlueprintEditor, node: string, key: string, value: unknown) =>
  ed.apply([{ op: "setValue", node, key, ...(value === undefined ? { unset: true } : { value }) }], { tag: `value:${node}:${key}`, label: "修改值" });

function LiteralField({ ed, node, id, kind, value, label, readOnly, width }: {
  ed: BlueprintEditor; node: BlueprintNode; id: string; kind: LiteralKind; value: unknown; label: string; readOnly: boolean; width: "pin" | "param";
}) {
  const aria = `${label}（${node.title ?? node.type}）`;
  if (kind === "switch") {
    return <input type="checkbox" className="bp-field" data-nodrag aria-label={aria} checked={Boolean(value)} disabled={readOnly}
      onChange={(e) => commit(ed, node.id, id, e.target.checked)} />;
  }
  return (
    <input className="bp-field" data-w={width} data-nodrag aria-label={aria} disabled={readOnly} spellCheck={false}
      type={kind === "number" ? "number" : "text"} step="any"
      value={value === undefined || value === null ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        commit(ed, node.id, id, kind === "number" ? (raw === "" || Number.isNaN(Number(raw)) ? undefined : Number(raw)) : raw);
      }} />
  );
}

function ParamRow({ ed, node, def, readOnly }: { ed: BlueprintEditor; node: BlueprintNode; def: ParamDef; readOnly: boolean }) {
  const value = node.values?.[def.id] ?? def.default;
  const label = def.label ?? def.id;
  return (
    <div className="bp-param">
      <span>{label}</span>
      {def.kind === "select" ? (
        <select className="bp-field" data-w="param" data-nodrag aria-label={`${label}（${node.title ?? node.type}）`} disabled={readOnly}
          value={String(value ?? "")} onChange={(e) => commit(ed, node.id, def.id, e.target.value)}>
          {(def.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label ?? o.value}</option>)}
        </select>
      ) : (
        <LiteralField ed={ed} node={node} id={def.id} kind={def.kind === "number" ? "number" : def.kind === "switch" ? "switch" : "text"}
          value={value} label={label} readOnly={readOnly} width="param" />
      )}
    </div>
  );
}
