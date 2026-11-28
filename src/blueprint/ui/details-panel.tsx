"use client";

import { ArrowDown, ArrowUp, ExternalLink, Play, Plus, Trash2 } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import { nodesInComment } from "../comment";
import { compileExpr } from "../expr";
import { brokenCallSites, callSites, freshPinId, signatureOf } from "../functions";
import { findVariable, getPorts } from "../ports";
import { TUNNEL_IN, TUNNEL_OUT, VAR_GET, VAR_SET } from "../registry";
import type { CommentTone, Pin, SubgraphKind } from "../types";
import { alignSelected, collapseSelected, commentSelected, expandNode } from "./commands";
import { COMMENT_TONES, TONE_LABEL } from "./comment-view";
import type { BlueprintEditor } from "./editor";
import { issueText } from "./chrome";
import { KIND_LABEL } from "./labels";
import { Check, Empty, Field, ICON_BTN, NumberField, PANEL_BTN, Section, Select, TextField, TypePicker, ValueField, typeName } from "./wb-ui";

/**
 * Details (UE5 "Details" panel), context sensitive:
 *   one node          title, comment bubble, enabled state (启用 / 禁用 / 仅开发), pin defaults and
 *                     params, call site / variable links, breakpoint + condition + hit count
 *   several nodes     bulk enable / disable, collapse, comment, align
 *   one comment       title, body, colour, move mode, z-order
 *   a variable        name, type with container switch (single / array / set / map), default,
 *                     category, tooltip, references
 *   a function / macro / collapsed graph
 *                     name, kind, pure / const, inputs and outputs editor (add, remove, reorder,
 *                     rename, retype: every call site follows), category, description, keywords,
 *                     call sites and broken ones
 *   nothing           inside a subgraph: that subgraph; on the main graph: graph settings
 * Variables and definitions come from My Blueprint (`editor.inspect`), the rest from the canvas.
 */

export interface DetailsPanelProps {
  readonly editor: BlueprintEditor;
  readonly className?: string;
  readonly onFindReferences?: (query: string) => void;
}

export function DetailsPanel({ editor: ed, className = "", onFindReferences }: DetailsPanelProps) {
  useSyncExternalStore(ed.subscribe, ed.version, ed.version);
  const sel = ed.selection;
  const ins = ed.inspected;
  let head: string;
  let body: ReactNode;
  if (ins?.kind === "variable") {
    head = ins.sg ? "局部变量" : "变量";
    body = <VariableDetails ed={ed} id={ins.id} sg={ins.sg} onFindReferences={onFindReferences} />;
  } else if (ins?.kind === "subgraph") {
    head = KIND_LABEL[ed.root.subgraphs?.[ins.id]?.kind ?? "graph"];
    body = <SubgraphDetails ed={ed} id={ins.id} onFindReferences={onFindReferences} />;
  } else if (ins?.kind === "graph" || (!sel.nodes.length && !sel.comments.length && ed.subgraph === undefined)) {
    head = "图设置";
    body = <GraphDetails ed={ed} />;
  } else if (sel.nodes.length === 1) {
    head = "节点";
    body = <NodeDetails key={sel.nodes[0]} ed={ed} id={sel.nodes[0]!} />;
  } else if (sel.nodes.length > 1) {
    head = `${sel.nodes.length} 个节点`;
    body = <MultiDetails ed={ed} />;
  } else if (sel.comments.length >= 1) {
    head = "注释";
    body = <CommentDetails key={sel.comments[0]} ed={ed} id={sel.comments[0]!} />;
  } else {
    head = KIND_LABEL[ed.root.subgraphs?.[ed.subgraph!]?.kind ?? "graph"];
    body = <SubgraphDetails ed={ed} id={ed.subgraph!} onFindReferences={onFindReferences} />;
  }
  return (
    <div role="region" aria-label="细节" className={`flex min-h-0 flex-col bg-background text-foreground ${className}`}>
      <div className="flex h-8 shrink-0 items-center border-b px-3 text-[11px] text-muted-foreground" aria-live="polite">{head}</div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{body}</div>
    </div>
  );
}

export default DetailsPanel;

// ------------------------------------------------------------------------------------------ node

function NodeDetails({ ed, id }: { ed: BlueprintEditor; id: string }) {
  const g = ed.graph;
  const node = g.nodes.find((n) => n.id === id);
  if (!node) return <Empty>节点不存在。</Empty>;
  const reg = ed.registry;
  const ro = ed.readOnly;
  const def = reg.node(node.type);
  const ports = getPorts(node, reg, g);
  const sg = node.subgraph !== undefined ? ed.root.subgraphs?.[node.subgraph] : undefined;
  const v = node.type === VAR_GET || node.type === VAR_SET ? findVariable(g, node.variable) : undefined;
  const wired = new Set(g.edges.filter((e) => e.to.node === id).map((e) => e.to.pin));
  const up = (patch: Record<string, unknown>, label: string) => ed.apply([{ op: "updateNode", id, ...patch }], { label });
  const state = node.disabled ? "disabled" : node.devOnly ? "dev" : "on";
  const defaultTitle = sg?.label ?? (v ? (node.type === VAR_GET ? v.name : `设置 ${v.name}`) : def?.title ?? node.type);
  const inputs = ports.inputs.filter((p) => !p.exec && !p.hidden);
  const key = ed.keyOf(id);
  const spec = ed.breakpointSpecs.get(key);
  const bp = ed.breakpoints.has(key);
  const cond = spec?.condition ?? "";
  const condErr = cond ? compileExpr(cond).error : undefined;
  const hits = ed.debug.hits.get(key);
  const isTunnel = node.type === TUNNEL_IN || node.type === TUNNEL_OUT;

  return (
    <>
      <Section title="节点">
        <Field label="标题"><TextField value={node.title ?? ""} placeholder={defaultTitle} label="节点标题" disabled={ro}
          onCommit={(t) => up({ title: t.trim() || null }, "重命名")} /></Field>
        <Field label="类型"><div className="truncate pt-1.5 text-xs">{def?.title ?? node.type} <span className="font-mono text-[11px] text-muted-foreground">{node.type}</span></div></Field>
        {isTunnel ? null : (
          <Field label="启用状态" hint={state === "dev" ? "开发和调试运行里照常执行，发布运行（shipping）时跳过。" : state === "disabled" ? "运行时跳过：执行流直通第一个执行输出。" : undefined}>
            <Select value={state} label="启用状态" disabled={ro}
              options={[{ value: "on", label: "启用" }, { value: "disabled", label: "禁用" }, { value: "dev", label: "仅开发" }]}
              onChange={(s) => up({ disabled: s === "disabled", devOnly: s === "dev" }, "启用状态")} />
          </Field>
        )}
      </Section>
      <Section title="注释">
        <Field label="气泡"><TextField multiline value={node.comment ?? ""} placeholder="节点上方显示的一句话" label="节点注释" disabled={ro}
          onCommit={(t) => up({ comment: t.trim() || null }, "节点注释")} /></Field>
        <Field label=""><Check checked={Boolean(node.commentPinned)} disabled={ro || !node.comment} label="缩小视图时也显示" onChange={(c) => up({ commentPinned: c }, "固定注释气泡")} /></Field>
      </Section>
      {inputs.length || def?.params.length ? (
        <Section title="默认值">
          {inputs.map((p) => (
            <Field key={p.id} label={p.label ?? p.id}>
              {wired.has(p.id) ? <div className="pt-1.5 text-xs text-muted-foreground">已连线</div> : (
                <ValueField reg={reg} type={p.type} value={node.values?.[p.id] ?? p.default} label={`${p.label ?? p.id} 的值`} disabled={ro}
                  onCommit={(val) => ed.apply([{ op: "setValue", node: id, key: p.id, ...(val === undefined ? { unset: true } : { value: val }) }], { label: "修改值" })} />
              )}
            </Field>
          ))}
          {(def?.params ?? []).map((pd) => (
            <Field key={pd.id} label={pd.label ?? pd.id}>
              {pd.kind === "select" ? (
                <Select value={String(node.values?.[pd.id] ?? pd.default ?? "")} label={pd.label ?? pd.id} disabled={ro}
                  options={(pd.options ?? []).map((o) => ({ value: o.value, label: o.label ?? o.value }))}
                  onChange={(val) => ed.apply([{ op: "setValue", node: id, key: pd.id, value: val }], { label: "修改值" })} />
              ) : (
                <ValueField reg={reg} type={pd.kind === "number" ? "number" : pd.kind === "switch" ? "boolean" : "string"} value={node.values?.[pd.id] ?? pd.default}
                  label={pd.label ?? pd.id} disabled={ro}
                  onCommit={(val) => ed.apply([{ op: "setValue", node: id, key: pd.id, ...(val === undefined ? { unset: true } : { value: val }) }], { label: "修改值" })} />
              )}
            </Field>
          ))}
        </Section>
      ) : null}
      {sg ? (
        <Section title={`调用${KIND_LABEL[sg.kind ?? "graph"]}`}>
          <Field label="定义"><div className="truncate pt-1.5 text-xs">{sg.label ?? sg.id}{sg.pure ? " · 纯函数" : ""}{sg.library ? " · 来自库" : ""}</div></Field>
          <Signature ed={ed} sgId={sg.id} />
          <div className="flex flex-wrap gap-1 px-3 pt-1">
            <button type="button" className={PANEL_BTN} onClick={() => ed.open(sg.id)}><ExternalLink className="size-3.5" aria-hidden />打开定义</button>
            <button type="button" className={PANEL_BTN} onClick={() => ed.inspect({ kind: "subgraph", id: sg.id })}>编辑签名</button>
            <button type="button" className={PANEL_BTN} disabled={ro} onClick={() => expandNode(ed, id)}>展开为节点</button>
          </div>
        </Section>
      ) : null}
      {v ? (
        <Section title="变量">
          <Field label="变量"><div className="truncate pt-1.5 text-xs">{v.name} · {typeName(reg, v.type)}</div></Field>
          {node.variable?.startsWith("$in:") ? <Field label=""><span className="text-[11px] text-muted-foreground">函数输入，只读</span></Field> : (
            <div className="px-3 pt-1">
              <button type="button" className={PANEL_BTN} onClick={() => ed.inspect({ kind: "variable", id: v.id, sg: g.locals?.some((x) => x.id === v.id) ? ed.subgraph : undefined })}>查看变量</button>
            </div>
          )}
        </Section>
      ) : null}
      {ed.debugEnabled && !isTunnel ? (
        <Section title="调试">
          <Field label="断点"><Check checked={bp} label={bp ? "已设断点（F9）" : "在此暂停（F9）"} onChange={() => ed.toggleBreakpoint([id])} /></Field>
          <Field label="条件" hint={condErr ? <span className="text-destructive">条件写法有误：{condErr}</span> : "引脚值与 hit（第几次到达），例如 a > 5 && hit >= 2"}>
            <TextField value={cond} mono label="断点条件" placeholder="留空则总是暂停"
              onCommit={(t) => ed.setBreakpointSpec(key, { ...spec, condition: t.trim() })} />
          </Field>
          <Field label="命中次数" hint={hits ? `本次运行已到达 ${hits} 次` : "从第 N 次到达起才暂停"}>
            <NumberField value={spec?.hitCount} min={1} step={1} label="命中次数" placeholder="1"
              onCommit={(n) => ed.setBreakpointSpec(key, { ...spec, hitCount: n === undefined ? undefined : Math.max(1, Math.round(n)) } as never)} />
          </Field>
          <Field label=""><Check checked={spec?.enabled !== false} disabled={!bp} label="启用这个断点" onChange={(c) => ed.setBreakpointSpec(key, { ...spec, enabled: c })} /></Field>
          <div className="px-3 pt-1">
            <button type="button" className={PANEL_BTN} onClick={() => void ed.runToCursor(id)}><Play className="size-3.5" aria-hidden />运行到此处</button>
          </div>
        </Section>
      ) : null}
      <p className="px-3 py-2 font-mono text-[11px] text-muted-foreground">id {node.id}</p>
    </>
  );
}

function Signature({ ed, sgId }: { ed: BlueprintEditor; sgId: string }) {
  const sg = ed.root.subgraphs?.[sgId];
  if (!sg) return null;
  const sig = signatureOf(sg);
  const pins = (ps: readonly Pin[]) => ps.filter((p) => !ed.registry.isExec(p.type)).map((p) => `${p.label ?? p.id}: ${typeName(ed.registry, p.type)}`).join("，") || "无";
  return (
    <>
      <Field label="输入"><div className="pt-1.5 text-xs leading-5">{pins(sig.inputs)}</div></Field>
      <Field label="输出"><div className="pt-1.5 text-xs leading-5">{pins(sig.outputs)}</div></Field>
    </>
  );
}

function MultiDetails({ ed }: { ed: BlueprintEditor }) {
  const sel = ed.selection.nodes;
  const nodes = ed.graph.nodes.filter((n) => sel.includes(n.id));
  const ro = ed.readOnly;
  const allOff = nodes.every((n) => n.disabled);
  return (
    <Section title="选中的节点" count={nodes.length}>
      <div className="flex flex-wrap gap-1 px-3 py-1">
        <button type="button" className={PANEL_BTN} disabled={ro} onClick={() => ed.apply(sel.map((id) => ({ op: "updateNode" as const, id, disabled: !allOff })), { label: allOff ? "启用节点" : "禁用节点" })}>{allOff ? "全部启用" : "全部禁用"}</button>
        <button type="button" className={PANEL_BTN} disabled={ro} onClick={() => collapseSelected(ed, "function")}>折叠为函数</button>
        <button type="button" className={PANEL_BTN} disabled={ro} onClick={() => collapseSelected(ed, "macro")}>折叠为宏</button>
        <button type="button" className={PANEL_BTN} disabled={ro} onClick={() => collapseSelected(ed)}>折叠为子图</button>
        <button type="button" className={PANEL_BTN} disabled={ro} onClick={() => commentSelected(ed)}>加注释框</button>
      </div>
      <Field label="对齐">
        <div className="flex flex-wrap gap-1">
          {([["left", "左"], ["center", "水平居中"], ["right", "右"], ["top", "顶"], ["middle", "垂直居中"], ["bottom", "底"]] as const).map(([m, l]) => (
            <button key={m} type="button" className={PANEL_BTN} disabled={ro} onClick={() => alignSelected(ed, m)}>{l}</button>
          ))}
        </div>
      </Field>
    </Section>
  );
}

// ------------------------------------------------------------------------------------------ comment

function CommentDetails({ ed, id }: { ed: BlueprintEditor; id: string }) {
  const c = ed.graph.comments?.find((x) => x.id === id);
  if (!c) return <Empty>注释不存在。</Empty>;
  const ro = ed.readOnly;
  const up = (patch: Record<string, unknown>, label: string) => ed.apply([{ op: "updateComment", id, ...patch }], { label });
  const inside = nodesInComment(ed.graph, c, ed.registry);
  return (
    <Section title="注释框">
      <Field label="标题"><TextField value={c.title ?? ""} placeholder="注释" label="注释标题" disabled={ro} onCommit={(t) => up({ title: t }, "重命名注释")} /></Field>
      <Field label="正文"><TextField multiline value={c.body ?? ""} label="注释正文" disabled={ro} onCommit={(t) => up({ body: t }, "注释正文")} /></Field>
      <Field label="颜色">
        <div role="radiogroup" aria-label="注释颜色" className="flex flex-wrap gap-1.5 pt-1">
          {COMMENT_TONES.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={(c.tone ?? "default") === t} aria-label={TONE_LABEL[t]} title={TONE_LABEL[t]} disabled={ro}
              onClick={() => up({ tone: t as CommentTone }, "注释颜色")}
              className="bp-swatch outline-offset-2 aria-checked:outline-2 aria-checked:outline-ring" data-tone={t} />
          ))}
        </div>
      </Field>
      <Field label="移动方式" hint={c.moveWithNodes === false ? "拖动注释框时，框内节点留在原处。" : "拖动注释框时，完全在框内的节点一起移动。"}>
        <Check checked={c.moveWithNodes !== false} label="带上框内节点" disabled={ro} onChange={(v) => up({ moveWithNodes: v }, "注释移动方式")} />
      </Field>
      <Field label="层级">
        <div className="flex gap-1">
          <button type="button" className={PANEL_BTN} disabled={ro} onClick={() => ed.apply([{ op: "orderComment", id, to: "front" }], { label: "注释置顶" })}>置于顶层</button>
          <button type="button" className={PANEL_BTN} disabled={ro} onClick={() => ed.apply([{ op: "orderComment", id, to: "back" }], { label: "注释置底" })}>置于底层</button>
        </div>
      </Field>
      <Field label="框内节点">
        <button type="button" className={PANEL_BTN} disabled={!inside.length} onClick={() => ed.select({ nodes: inside, comments: [id] })}>选中 {inside.length} 个</button>
      </Field>
    </Section>
  );
}

// ------------------------------------------------------------------------------------------ variable

function VariableDetails({ ed, id, sg, onFindReferences }: { ed: BlueprintEditor; id: string; sg: string | undefined; onFindReferences?: ((q: string) => void) | undefined }) {
  const root = ed.root;
  const list = sg ? root.subgraphs?.[sg]?.variables ?? [] : root.variables ?? [];
  const v = list.find((x) => x.id === id);
  if (!v) return <Empty>变量不存在。</Empty>;
  const reg = ed.registry;
  const ro = ed.readOnly;
  const up = (patch: Record<string, unknown>, label: string) => ed.applyAt(sg, [{ op: "updateVariable", id, ...patch }], { label });
  const cats = [...new Set((root.variables ?? []).map((x) => x.category).filter((x): x is string => !!x))];
  let refs = 0;
  for (const n of [...root.nodes, ...Object.values(root.subgraphs ?? {}).flatMap((s) => s.nodes)]) if ((n.type === VAR_GET || n.type === VAR_SET) && n.variable === id) refs++;
  const catList = `bp-cats-${id}`;
  return (
    <>
      <Section title="变量">
        <Field label="名称"><TextField value={v.name} label="变量名称" disabled={ro} onCommit={(t) => { if (t.trim()) up({ name: t }, "重命名变量"); }} /></Field>
        <Field label="类型" hint="改类型会清掉不再相容的默认值；获取、设置节点的引脚跟着变。">
          <TypePicker reg={reg} value={v.type} label="变量类型" disabled={ro} onChange={(t) => up({ type: t }, "修改变量类型")} />
        </Field>
        <Field label="默认值">
          <ValueField reg={reg} type={v.type} value={v.default} label="变量默认值" disabled={ro}
            onCommit={(val) => up(val === undefined ? { unsetDefault: true } : { default: val }, "修改默认值")} />
        </Field>
      </Section>
      <Section title="说明">
        {sg ? null : (
          <Field label="分类">
            <input key={v.category ?? ""} list={catList} defaultValue={v.category ?? ""} placeholder="未分类" aria-label="变量分类" disabled={ro} spellCheck={false}
              onBlur={(e) => { if (e.currentTarget.value !== (v.category ?? "")) up({ category: e.currentTarget.value.trim() || null }, "变量分类"); }}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); }}
              className="h-7 w-full min-w-0 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
            <datalist id={catList}>{cats.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
        )}
        <Field label="提示"><TextField multiline value={v.tooltip ?? ""} placeholder="鼠标悬停时显示" label="变量提示" disabled={ro} onCommit={(t) => up({ tooltip: t.trim() || null }, "变量提示")} /></Field>
      </Section>
      <Section title="引用" count={refs}>
        <div className="flex flex-wrap gap-1 px-3 py-1">
          {onFindReferences ? <button type="button" className={PANEL_BTN} onClick={() => onFindReferences(v.name)}>查找引用</button> : null}
          <button type="button" className={`${PANEL_BTN} hover:text-destructive`} disabled={ro}
            onClick={() => { ed.applyAt(sg, [{ op: "removeVariable", id }], { label: "删除变量" }); ed.notify(`已删除变量「${v.name}」${refs ? `和 ${refs} 个节点` : ""}`); }}>
            <Trash2 className="size-3.5" aria-hidden />删除变量
          </button>
        </div>
      </Section>
    </>
  );
}

// ------------------------------------------------------------------------------------------ function / macro / graph

function SubgraphDetails({ ed, id, onFindReferences }: { ed: BlueprintEditor; id: string; onFindReferences?: ((q: string) => void) | undefined }) {
  const sg = ed.root.subgraphs?.[id];
  if (!sg) return <Empty>定义不存在。</Empty>;
  const ro = ed.readOnly;
  const kind = sg.kind ?? "graph";
  const up = (patch: Record<string, unknown>, label: string) => {
    const r = ed.applyDocument([{ op: "updateSubgraph", id, ...patch }], { label });
    const err = r?.errors[0]?.message;
    if (err) ed.notify(/exec/.test(err) ? (/pure/i.test(err) || /body/.test(err) ? "函数体里有执行节点，不能设为纯函数" : "函数只能有一个执行输入和一个执行输出") : err);
  };
  const sites = callSites(ed.root, id);
  const broken = brokenCallSites(ed.root, id, ed.registry);
  const where = (s: (typeof sites)[number]) => (s.sg === undefined ? "主图" : ed.root.subgraphs?.[s.sg]?.label ?? s.sg);
  const go = (s: (typeof sites)[number]) => {
    const local = ed.reveal(s.sg === undefined ? s.node.id : `${s.sg}/${s.node.id}`);
    requestAnimationFrame(() => { ed.select([local]); ed.fit([local]); });
  };
  return (
    <>
      <Section title={KIND_LABEL[kind]}>
        <Field label="名称"><TextField value={sg.label ?? ""} placeholder={sg.id} label="名称" disabled={ro} onCommit={(t) => up({ label: t.trim() || sg.id }, "重命名")} /></Field>
        <Field label="类型" hint={kind === "function" ? "一个执行输入、一个执行输出，有自己的局部变量，走完才返回。" : kind === "macro" ? "内联展开，可以有多个执行引脚，到达出口立刻接着外面的流程。" : "只是把节点收在一起，原地执行。"}>
          <Select<SubgraphKind> value={kind} label="类型" disabled={ro}
            options={[{ value: "graph", label: "折叠图" }, { value: "function", label: kind === "graph" ? "函数（提升）" : "函数" }, { value: "macro", label: "宏" }]}
            onChange={(k) => up({ kind: k }, "转换类型")} />
        </Field>
        {kind === "function" ? (
          <Field label="标志">
            <Check checked={Boolean(sg.pure)} disabled={ro} label="纯函数（没有执行引脚，按需求值）" onChange={(c) => up({ pure: c }, c ? "设为纯函数" : "取消纯函数")} />
            <Check checked={Boolean(sg.const)} disabled={ro} label="常量（不能设置图变量）" onChange={(c) => up({ const: c }, "常量函数")} />
          </Field>
        ) : null}
        {sg.library ? <Field label="来源"><div className="pt-1.5 text-xs">库「{ed.registry.libraries.find((l) => l.id === sg.library)?.name ?? sg.library}」的副本，改动只影响本文档</div></Field> : null}
      </Section>
      <Section title="输入"><PinList ed={ed} sgId={id} dir="inputs" /></Section>
      <Section title="输出"><PinList ed={ed} sgId={id} dir="outputs" /></Section>
      <Section title="说明">
        <Field label="分类"><TextField value={sg.category ?? ""} placeholder={kind === "macro" ? "宏" : "函数"} label="分类" disabled={ro} onCommit={(t) => up({ category: t.trim() || null }, "分类")} /></Field>
        <Field label="描述"><TextField multiline value={sg.description ?? ""} label="描述" disabled={ro} onCommit={(t) => up({ description: t.trim() || null }, "描述")} /></Field>
        <Field label="关键词" hint="操作菜单搜索时也匹配这些词"><TextField value={sg.keywords ?? ""} label="关键词" disabled={ro} onCommit={(t) => up({ keywords: t.trim() || null }, "关键词")} /></Field>
      </Section>
      <Section title="调用处" count={sites.length}>
        {broken.length ? <p role="alert" className="px-3 pb-1 text-xs text-destructive">{broken.length} 处调用与签名不符，点下面带红点的一项去修。</p> : null}
        {sites.length ? (
          <ul className="space-y-px px-1.5">
            {sites.map((s) => (
              <li key={`${s.sg ?? ""}/${s.node.id}`}>
                <button type="button" onClick={() => go(s)} className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-xs hover:bg-accent">
                  {broken.includes(s) ? <span aria-label="失配" className="size-1.5 rounded-full bg-destructive" /> : <span aria-hidden className="size-1.5" />}
                  <span className="truncate">{s.node.title ?? sg.label ?? sg.id}</span>
                  <span className="ml-auto shrink-0 text-muted-foreground">{where(s)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : <Empty>还没有调用。把它从「我的蓝图」拖到画布上，或在操作菜单里搜索它的名字。</Empty>}
        <div className="flex flex-wrap gap-1 px-3 pt-1">
          <button type="button" className={PANEL_BTN} onClick={() => ed.open(id)}><ExternalLink className="size-3.5" aria-hidden />打开</button>
          {onFindReferences ? <button type="button" className={PANEL_BTN} onClick={() => onFindReferences(sg.label ?? sg.id)}>查找引用</button> : null}
          <button type="button" className={PANEL_BTN} disabled={ro} onClick={() => { const r = ed.applyDocument([{ op: "duplicateSubgraph", id }], { label: "复制" }); const nid = r?.created["#0"]; if (nid) ed.inspect({ kind: "subgraph", id: nid }); }}>复制一份</button>
          <button type="button" className={`${PANEL_BTN} hover:text-destructive`} disabled={ro}
            onClick={() => { ed.applyDocument([{ op: "removeSubgraph", id }], { label: "删除" }); ed.notify(`已删除「${sg.label ?? id}」${sites.length ? `和 ${sites.length} 处调用` : ""}`); }}>
            <Trash2 className="size-3.5" aria-hidden />删除
          </button>
        </div>
      </Section>
    </>
  );
}

/** Inputs or outputs of a definition: rename, retype, reorder, remove, add. Writes the tunnels via setSignature. */
function PinList({ ed, sgId, dir }: { ed: BlueprintEditor; sgId: string; dir: "inputs" | "outputs" }) {
  const sg = ed.root.subgraphs![sgId]!;
  const reg = ed.registry;
  const ro = ed.readOnly;
  const isFn = sg.kind === "function";
  const pins = signatureOf(sg)[dir];
  const set = (next: readonly Pin[], label: string) => {
    const r = ed.applyDocument([{ op: "setSignature", id: sgId, [dir]: next }], { label });
    if (r?.errors.length) ed.notify(isFn ? "函数最多一个执行输入和一个执行输出" : r.errors[0]!.message);
  };
  const replace = (i: number, p: Pin) => set(pins.map((x, k) => (k === i ? p : x)), "修改引脚");
  const move = (i: number, d: -1 | 1) => {
    const next = [...pins];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x!);
    set(next, "调整引脚顺序");
  };
  const add = (exec: boolean) => {
    const base = exec ? (dir === "inputs" ? "exec" : "then") : dir === "inputs" ? "in" : "out";
    const id = freshPinId(pins, base);
    const type = exec ? "exec" : reg.type("number") ? "number" : "boolean";
    const n = pins.filter((x) => !reg.isExec(x.type)).length + 1;
    set([...pins, { id, type, label: exec ? (dir === "inputs" ? "执行" : "然后") : dir === "inputs" ? `输入 ${n}` : `输出 ${n}` }], "添加引脚");
  };
  const word = dir === "inputs" ? "输入" : "输出";
  return (
    <div>
      {pins.length ? (
        <ul className="space-y-1.5 px-3 py-1">
          {pins.map((p, i) => {
            const exec = reg.isExec(p.type);
            const fixed = isFn && exec;
            if (fixed) {
              return (
                <li key={p.id} className="flex h-7 items-center gap-2 rounded-md border border-dashed px-2 text-[11px] text-muted-foreground" title="函数的执行引脚由「纯函数」开关决定">
                  <span aria-hidden className="size-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-current" />执行{dir === "inputs" ? "输入" : "输出"}
                </li>
              );
            }
            return (
              <li key={p.id} className="rounded-md border p-1.5">
                <div className="flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <TextField value={p.label ?? p.id} label={`${word}名称：${p.label ?? p.id}`} disabled={ro || fixed}
                      onCommit={(t) => replace(i, { ...p, label: t.trim() || p.id })} />
                  </div>
                  <button type="button" aria-label={`上移 ${p.label ?? p.id}`} className={ICON_BTN} disabled={ro || i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-3.5" /></button>
                  <button type="button" aria-label={`下移 ${p.label ?? p.id}`} className={ICON_BTN} disabled={ro || i === pins.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-3.5" /></button>
                  <button type="button" aria-label={`删除 ${p.label ?? p.id}`} className={`${ICON_BTN} hover:text-destructive`} disabled={ro || fixed}
                    title={fixed ? "函数的执行引脚由「纯函数」开关决定" : "删除引脚（调用处接在它上面的线一起删掉）"} onClick={() => set(pins.filter((_, k) => k !== i), "删除引脚")}><Trash2 className="size-3.5" /></button>
                </div>
                <div className="mt-1">
                  {fixed ? <span className="text-[11px] text-muted-foreground">执行引脚</span> : (
                    <TypePicker reg={reg} value={p.type} label={`${p.label ?? p.id} 的类型`} disabled={ro} allowExec={!isFn}
                      onChange={(t) => { const { default: _d, ...rest } = p; void _d; replace(i, { ...rest, type: t }); }} />
                  )}
                </div>
                {dir === "inputs" && !exec ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="shrink-0 text-[11px] text-muted-foreground">默认</span>
                    <div className="min-w-0 flex-1">
                      <ValueField reg={reg} type={p.type} value={p.default} label={`${p.label ?? p.id} 的默认值`} disabled={ro}
                        onCommit={(val) => { const { default: _d, ...rest } = p; void _d; replace(i, val === undefined ? rest : { ...rest, default: val }); }} />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : <Empty>没有{word}。</Empty>}
      {ro ? null : (
        <div className="flex flex-wrap gap-1 px-3 pt-0.5">
          <button type="button" className={PANEL_BTN} onClick={() => add(false)}><Plus className="size-3.5" aria-hidden />添加{word}</button>
          {!isFn ? <button type="button" className={PANEL_BTN} onClick={() => add(true)}><Plus className="size-3.5" aria-hidden />执行引脚</button> : null}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ graph

function GraphDetails({ ed }: { ed: BlueprintEditor }) {
  const root = ed.root;
  const ro = ed.readOnly;
  const subs = Object.values(root.subgraphs ?? {});
  const v = ed.validation.all;
  const errors = v.issues.filter((i) => i.level === "error");
  const stat = (label: string, n: number) => (
    <div className="flex items-baseline justify-between rounded-md bg-muted/50 px-2 py-1"><span className="text-[11px] text-muted-foreground">{label}</span><span className="font-mono text-xs tabular-nums">{n}</span></div>
  );
  return (
    <>
      <Section title="图设置">
        <Field label="名称"><TextField value={root.meta?.name ?? ""} placeholder="未命名蓝图" label="图名称" disabled={ro} onCommit={(t) => ed.applyDocument([{ op: "setMeta", name: t.trim() || null }], { label: "重命名图" })} /></Field>
        <Field label="描述"><TextField multiline value={root.meta?.description ?? ""} label="图描述" disabled={ro} onCommit={(t) => ed.applyDocument([{ op: "setMeta", description: t.trim() || null }], { label: "图描述" })} /></Field>
      </Section>
      <Section title="概况">
        <div className="grid grid-cols-2 gap-1 px-3 py-1">
          {stat("节点", root.nodes.length + subs.reduce((s, x) => s + x.nodes.length, 0))}
          {stat("连线", root.edges.length + subs.reduce((s, x) => s + x.edges.length, 0))}
          {stat("函数", subs.filter((s) => s.kind === "function").length)}
          {stat("宏", subs.filter((s) => s.kind === "macro").length)}
          {stat("折叠图", subs.filter((s) => (s.kind ?? "graph") === "graph").length)}
          {stat("变量", root.variables?.length ?? 0)}
        </div>
        <p className="px-3 py-1 text-xs">{v.issues.length === 0 ? "校验通过" : `${errors.length} 个错误，${v.issues.length - errors.length} 个警告`}</p>
        {errors.slice(0, 3).map((i, k) => <p key={k} className="truncate px-3 text-[11px] text-muted-foreground">{issueText(ed, i)}</p>)}
      </Section>
      <Empty>选中节点、注释，或在「我的蓝图」里点一个函数、变量，这里显示它的细节。</Empty>
    </>
  );
}
