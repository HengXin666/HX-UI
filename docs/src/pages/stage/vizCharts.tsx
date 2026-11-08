import { useMemo, useState, type JSX } from "react";
import { BarChart, Ring, Trend } from "../../../../src/viz";
import { RingRow } from "../../../../src/page";
import { blocks, constLine, importLine, jsx, PAGE_ENTRY, REACT_STATE, ref, setter, stateLine, VIZ_ENTRY } from "./code";
import { RINGS, SEED, SPIKE, WEEK } from "./samples";
import { PropChoice, PropSlider, PropSwitch, StageLayout } from "./StageKit";

/** 图区高度的滑杆区间, 三张图共用. */
const HEIGHT = { min: 120, max: 320, step: 20 } as const;
const PERCENT = 100;
/** 柱高与环径的上限. */
const CEILING = 200;
const PROP = { height: "height", value: "value" } as const;
const DAY = "day";
const LINE = "\n";

const TREND = { label: "日活 (万)", height: 160 } as const;

/** 趋势线. 打开尖峰时末值换成越界值, 看坐标轴先冲出再重标; 关掉后 domain 只外扩不回缩. */
export function TrendStage(): JSX.Element {
  const [spike, setSpike] = useState(false);
  const [area, setArea] = useState(true);
  const [height, setHeight] = useState<number>(TREND.height);
  const values = useMemo(() => (spike ? [...SEED.slice(1), SPIKE] : [...SEED]), [spike]);
  const code = blocks(
    importLine(VIZ_ENTRY, ["Trend"]),
    constLine("values", values),
    jsx("Trend", { values: ref("values"), label: TREND.label, area, height }),
  );
  return (
    <StageLayout
      stage={<Trend values={values} label={TREND.label} area={area} height={height} />}
      props={
        <>
          <PropSwitch name="尖峰 (values 末值)" checked={spike} onChange={setSpike} />
          <PropSwitch name="area" checked={area} onChange={setArea} />
          <PropSlider name={PROP.height} value={height} {...HEIGHT} onChange={setHeight} />
        </>
      }
      code={code}
    />
  );
}

const BAR = { label: "本周订单 (千单)", height: CEILING, max: CEILING } as const;
const LAST_DAY = WEEK[WEEK.length - 1];
const DAY_ITEMS = WEEK.map((day) => ({ key: day.id as string, label: day.label }));

/** 柱状图. 拖最后一根柱的数值越过刻度看重标, 切当前柱看主色移动. */
export function BarStage(): JSX.Element {
  const [day, setDay] = useState<string>(LAST_DAY.id);
  const [last, setLast] = useState<number>(LAST_DAY.value);
  const [height, setHeight] = useState<number>(BAR.height);
  const data = useMemo(() => WEEK.map((item) => (item.id === LAST_DAY.id ? { ...item, value: last } : { ...item })), [last]);
  const code = blocks(
    `${REACT_STATE}${LINE}${importLine(VIZ_ENTRY, ["BarChart"])}`,
    constLine("data", data),
    stateLine(DAY, day),
    jsx("BarChart", { data: ref("data"), label: BAR.label, value: ref(DAY), onValueChange: ref(setter(DAY)), height }),
  );
  return (
    <StageLayout
      stage={<BarChart data={data} label={BAR.label} value={day} onValueChange={setDay} height={height} />}
      props={
        <>
          <PropChoice name={PROP.value} items={DAY_ITEMS} value={day} onChange={setDay} />
          <PropSlider name={`${LAST_DAY.label} value`} value={last} min={0} max={BAR.max} onChange={setLast} />
          <PropSlider name={PROP.height} value={height} {...HEIGHT} onChange={setHeight} />
        </>
      }
      code={code}
    />
  );
}

const RING = { size: 120, sizeMin: 72, sizeMax: CEILING, sizeStep: 4, maxMax: CEILING, maxStep: 10, delayMax: 1, delayStep: 0.1 } as const;
const [LEAD, ...REST_RINGS] = RINGS;

/** 环形进度与一排环. value 来回拖, 弹簧从当前位置继续, 不回满圈重来. */
export function RingStage(): JSX.Element {
  const [value, setValue] = useState<number>(LEAD.value);
  const [max, setMax] = useState(PERCENT);
  const [size, setSize] = useState<number>(RING.size);
  const [delay, setDelay] = useState(0);
  const items = useMemo(() => [{ value, max, label: LEAD.label }, ...REST_RINGS.map((item) => ({ ...item }))], [value, max]);
  const code = blocks(
    `${importLine(VIZ_ENTRY, ["Ring"])}${LINE}${importLine(PAGE_ENTRY, ["RingRow"])}`,
    jsx("Ring", { value, max, label: LEAD.label, size, delay }),
    constLine("items", items),
    jsx("RingRow", { items: ref("items") }),
  );
  return (
    <StageLayout
      stage={
        <div className="flex flex-col items-center gap-10">
          <Ring value={value} max={max} label={LEAD.label} size={size} delay={delay} />
          <RingRow items={items} className="w-full" />
        </div>
      }
      props={
        <>
          <PropSlider name={PROP.value} value={value} min={0} max={max} onChange={setValue} />
          <PropSlider name="max" value={max} min={PERCENT} max={RING.maxMax} step={RING.maxStep} onChange={setMax} />
          <PropSlider name="size" value={size} min={RING.sizeMin} max={RING.sizeMax} step={RING.sizeStep} onChange={setSize} />
          <PropSlider name="delay (入场, 重播可见)" value={delay} min={0} max={RING.delayMax} step={RING.delayStep} onChange={setDelay} />
        </>
      }
      code={code}
    />
  );
}
