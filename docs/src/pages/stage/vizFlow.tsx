import { useMemo, useState, type JSX } from "react";
import { FlowGraph, Funnel, Timeline, TIMELINE_STATUS } from "../../../../src/viz";
import { blocks, constLine, importLine, jsx, REACT_STATE, ref, setter, stateLine, VIZ_ENTRY } from "./code";
import { FLOW_EDGES, FLOW_NODES, FUNNEL, ROADMAP } from "./samples";
import { PropChoice, PropSlider, PropSwitch, StageLayout } from "./StageKit";

const LINE = "\n";
const CURRENT = "current";
const NODES = "nodes";
const EDGES = "edges";

const FLOW = { label: "订单履约流程", height: 260, min: 180, max: 400, step: 20 } as const;
const NODE_ITEMS = FLOW_NODES.map((node) => ({ key: node.id as string, label: node.label }));

/** 流程图. 切当前节点看进出边换色与脉冲重走; 关掉 pulse 只换色. */
export function FlowStage(): JSX.Element {
  const [current, setCurrent] = useState<string>(FLOW_NODES[0].id);
  const [pulse, setPulse] = useState(true);
  const [height, setHeight] = useState<number>(FLOW.height);
  const code = blocks(
    `${REACT_STATE}${LINE}${importLine(VIZ_ENTRY, ["FlowGraph"])}`,
    constLine(NODES, FLOW_NODES),
    constLine(EDGES, FLOW_EDGES),
    stateLine(CURRENT, current),
    jsx("FlowGraph", { label: FLOW.label, nodes: ref(NODES), edges: ref(EDGES), value: ref(CURRENT), onValueChange: ref(setter(CURRENT)), pulse, height }),
  );
  return (
    <StageLayout
      stage={<FlowGraph label={FLOW.label} nodes={FLOW_NODES} edges={FLOW_EDGES} value={current} onValueChange={setCurrent} pulse={pulse} height={height} />}
      props={
        <>
          <PropChoice name="value" items={NODE_ITEMS} value={current} onChange={setCurrent} />
          <PropSwitch name="pulse" checked={pulse} onChange={setPulse} />
          <PropSlider name="height" value={height} min={FLOW.min} max={FLOW.max} step={FLOW.step} onChange={setHeight} />
        </>
      }
      code={code}
    />
  );
}

const FUNNEL_LABEL = "本月转化";
const RATE_LABEL = "转化";
const FUNNEL_RANGE = { max: 60000, step: 10 } as const;
const STAGE_ITEMS = FUNNEL.map((item) => ({ key: item.id as string, label: item.label }));

/** 漏斗. 选一层改它的数值: 条从当前宽度继续, 数字按位滚动, 转化率跟着重算. */
export function FunnelStage(): JSX.Element {
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(FUNNEL.map((item) => [item.id, item.value])));
  const [layer, setLayer] = useState<string>(FUNNEL[FUNNEL.length - 1].id);
  const [rate, setRate] = useState(true);
  const stages = useMemo(() => FUNNEL.map((item) => ({ ...item, value: values[item.id] ?? item.value })), [values]);
  const value = values[layer] ?? 0;
  const code = blocks(
    importLine(VIZ_ENTRY, ["Funnel"]),
    constLine("stages", stages),
    jsx("Funnel", { label: FUNNEL_LABEL, rateLabel: rate ? RATE_LABEL : undefined, stages: ref("stages") }),
  );
  return (
    <StageLayout
      stage={<Funnel label={FUNNEL_LABEL} rateLabel={rate ? RATE_LABEL : undefined} stages={stages} />}
      props={
        <>
          <PropChoice name="改哪一层" items={STAGE_ITEMS} value={layer} onChange={setLayer} />
          <PropSlider name={`stages[${layer}].value`} value={value} min={0} {...FUNNEL_RANGE} onChange={(next) => setValues((all) => ({ ...all, [layer]: next }))} />
          <PropSwitch name="rateLabel" checked={rate} onChange={setRate} />
        </>
      }
      code={code}
    />
  );
}

const TIMELINE_LABEL = "产品路线图";
const ROAD_ITEMS = ROADMAP.map((item) => ({ key: item.id, label: item.title }));
const ACTIVE_AT = ROADMAP.findIndex((item) => item.status === TIMELINE_STATUS.active);

/** 时间线. 切 active 项, 之前的变 done, 之后的变 next; 关掉 scrollLinked 时进度线停在最后一个 done 项. */
export function TimelineStage(): JSX.Element {
  const [active, setActive] = useState(ROADMAP[ACTIVE_AT].id);
  const [linked, setLinked] = useState(false);
  const at = ROADMAP.findIndex((item) => item.id === active);
  const items = useMemo(
    () =>
      ROADMAP.map((item, index) => ({
        ...item,
        status: index < at ? TIMELINE_STATUS.done : index === at ? TIMELINE_STATUS.active : TIMELINE_STATUS.next,
      })),
    [at],
  );
  const code = blocks(
    importLine(VIZ_ENTRY, ["Timeline"]),
    constLine("items", items),
    jsx("Timeline", { label: TIMELINE_LABEL, items: ref("items"), scrollLinked: linked }),
  );
  return (
    <StageLayout
      stage={<Timeline label={TIMELINE_LABEL} items={items} scrollLinked={linked} />}
      props={
        <>
          <PropChoice name="active 项" items={ROAD_ITEMS} value={active} onChange={setActive} />
          <PropSwitch name="scrollLinked" checked={linked} onChange={setLinked} />
        </>
      }
      code={code}
    />
  );
}
