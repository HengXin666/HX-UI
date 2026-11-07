import { useState, type JSX } from "react";
import {
  AxisShock,
  CraftButton,
  CraftDigits,
  CraftSegmented,
  CraftSwitch,
  CraftTabs,
} from "../../src/craft";

const TABS = [
  { id: "press", label: "按下" },
  { id: "slide", label: "滑动" },
  { id: "digit", label: "数字" },
];

/** 道具台. 改数值不重挂载, 中途改目标时速度还在. */
export function CraftLab(): JSX.Element {
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [on, setOn] = useState(false);
  const [tab, setTab] = useState("press");
  const [page, setPage] = useState("field");
  const [amount, setAmount] = useState(12840);

  const call = [
    `<CraftButton${disabled ? " disabled" : ""}${loading ? " loading" : ""}>按下我</CraftButton>`,
    `<CraftSwitch checked={${on}} label="通知" />`,
    `<CraftTabs value="${tab}" />`,
    `<CraftDigits value={${amount}} />`,
  ].join("\n");

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8">
      <p className="text-xs text-muted-foreground">手感</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">五件控件, 都可以中途改.</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">滑杆改的是正在显示的那一个, 不会把它拆掉重装. 连点, 按到一半松开, 都从当前速度继续.</p>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">按钮</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <CraftButton disabled={disabled} loading={loading}>按下我</CraftButton>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} />
            禁用
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={loading} onChange={(event) => setLoading(event.target.checked)} />
            加载
          </label>
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">开关</h2>
        <div className="mt-4">
          <CraftSwitch checked={on} onChange={setOn} label="通知" />
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">标签条</h2>
        <div className="mt-4">
          <CraftTabs tabs={TABS} value={tab} onChange={setTab} />
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">分段</h2>
        <div className="mt-4">
          <CraftSegmented
            value={page}
            onChange={setPage}
            segments={[
              { id: "field", label: "田野" },
              { id: "kiln", label: "窑" },
              { id: "off", label: "停用", disabled: true },
            ]}
          />
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">数字</h2>
        <div className="mt-4 text-5xl">
          <CraftDigits value={amount} label={String(amount)} />
        </div>
        <input
          className="mt-6 w-full accent-current"
          type="range"
          min={1000}
          max={98000}
          value={amount}
          aria-label="数字目标"
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">坐标轴</h2>
        <div className="mt-4">
          <AxisShock />
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">调用</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-card p-4 text-xs leading-relaxed"><code>{call}</code></pre>
      </section>
    </main>
  );
}
