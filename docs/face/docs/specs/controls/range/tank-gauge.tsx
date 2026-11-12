import { useState } from "react";
import { TankGauge } from "../../../../../../src/controls";
import tankRaw from "../../../../../../src/controls/range/meter/TankGauge.tsx?raw";
import { color, initialValues, range, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { RANGE_TONES } from "./tones";

/**
 * controls 批 1: 玻璃容器里的液位计. 演示是一台机器的储水箱; 打开 "可拖动" 后变成 role=slider, 拖动或方向键改液位,
 * 液面随液位速度倾斜晃荡后静止. 晃荡的阻尼 (viscosity), 倾斜 (tilt) 与浪尖 (splash) 在 Props 表.
 */

const CONTROLS: readonly ControlDef[] = [
  range("defaultValue", "初始液位", [0, 100, 1], 60, "非受控的初始值, 0 到 100."),
  toggle("interactive", "可拖动", true, "打开时可拖动与键盘改值 (role=slider), 关掉是只读的 role=meter."),
  toggle("showValue", "显示读数", true, "容器顶部显示当前值与单位 (关掉时淡出)."),
  text("unit", "单位", "%", "读数后缀."),
  range("width", "宽度", [56, 140, 4], 88, "容器宽 px."),
  range("height", "高度", [120, 240, 10], 180, "容器高 px."),
  range("radius", "圆角", [0, 40, 1], 20, "容器圆角 px."),
  range("ticks", "刻度数", [0, 8, 1], 4, "容器侧边的刻度条数, 0 不画."),
  color("liquidTone", "液体色", RANGE_TONES, "primary", "RangeTone", "液体颜色."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);

function TankDemo(props: Record<string, unknown>) {
  const [level, setLevel] = useState(Number(props.defaultValue));
  return (
    <div className="flex items-center gap-6">
      <TankGauge {...props} ariaLabel="储水箱液位" onChange={setLevel} />
      <dl className="grid gap-1 text-left text-[12px]">
        <dt className="text-muted-foreground">储水箱 B2</dt>
        <dd className="font-mono tabular-nums text-foreground">{Math.round(level * 12)} / 1200 L</dd>
      </dl>
    </div>
  );
}

export const TANK_GAUGE: PageSpec = {
  id: "tank-gauge",
  kind: "control",
  importName: "TankGauge",
  source: "src/controls/range/meter/TankGauge.tsx",
  raw: tankRaw,
  deps: [],
  controls: CONTROLS,
  height: 320,
  render: (props) => <TankDemo {...props} />,
  usage: (values: Values) => controlUsage("TankGauge", { ...values, ariaLabel: "储水箱液位" }, { ...BASE, interactive: false, liquidTone: "foreground", ariaLabel: "" }),
  propDesc: {
    value: "受控液位, 0 到 100.",
    onChange: "拖动或按键改值时调用.",
    glassTone: "容器底色.",
    viscosity: "液面晃动的阻尼比, 越小晃得越久.",
    tilt: "液面倾斜的幅度系数.",
    splash: "浪尖幅度系数.",
    ariaLabel: "读屏名称, 默认 Level.",
  },
  propsNote: "根元素在只读时是 role=\"meter\", interactive 时是 role=\"slider\" (可聚焦); 液面是一条 svg path, aria-hidden.",
  examples: [
    {
      id: "row",
      title: "一排只读的电量",
      desc: "只读 (默认) 时是 role=\"meter\", 不可聚焦; 低电量换 warning 色.",
      code: `<TankGauge defaultValue={86} width={56} height={120} radius={12} ticks={0} ariaLabel="主电池" />\n<TankGauge defaultValue={18} width={56} height={120} radius={12} ticks={0} liquidTone="warning" ariaLabel="备用电池" />`,
      render: () => (
        <>
          <TankGauge defaultValue={86} width={56} height={120} radius={12} ticks={0} ariaLabel="主电池" />
          <TankGauge defaultValue={18} width={56} height={120} radius={12} ticks={0} liquidTone="warning" ariaLabel="备用电池" />
        </>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "interactive 时聚焦容器; 只读时不占 Tab 位." },
    { keys: ["↑", "→"], action: "液位加 2; ↓ / ← 减 2." },
    { keys: ["PageUp"], action: "加 10; PageDown 减 10; Home / End 到 0 与 100." },
  ],
  reduced: {
    desc: "减少动效下液位直接到新值, 液面保持水平, 不倾斜不晃荡.",
    notes: ["值变化时液位直接跳到新高度, 不滑过去.", "液面始终水平, 没有倾斜与浪尖.", "显示读数开关的淡入淡出去掉."],
  },
};
