import { useState, type JSX } from "react";
import { BUTTON_TYPE, VARIANT } from "@hx/ui";
import { Button } from "../../src/primitives/button";
import { Switch } from "../../src/primitives/switch";
import { NumberRoll, SegmentedThumb } from "../../src/craft";

/** 道具台. 改值不重新挂载, 用来看中断. */
export function Playground({ onBack }: { readonly onBack: () => void }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [on, setOn] = useState(false);
  const [page, setPage] = useState("field");
  const [amount, setAmount] = useState(1280);
  const snippet = `<Button type="button" variant="primary" loading={${loading}} disabled={${disabled}}>保存</Button>`;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <button type="button" className="text-sm text-muted-foreground" onClick={onBack}>回到首页</button>
      <h1 className="mt-4 text-3xl text-foreground">按下的 90ms</h1>
      <div className="mt-8 rounded-xl border border-border p-6">
        <Button type={BUTTON_TYPE} variant={VARIANT.primary} loading={loading} disabled={disabled}>保存</Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={loading} onChange={(event) => setLoading(event.target.checked)} />加载</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} />禁用</label>
      </div>
      <div className="mt-8 flex items-center gap-4">
        <Switch checked={on} onCheckedChange={setOn} aria-label="开关" />
        <span className="text-sm text-muted-foreground">{on ? "开" : "关"}</span>
      </div>
      <div className="mt-8">
        <SegmentedThumb
          ariaLabel="页面"
          value={page}
          onChange={setPage}
          options={[{ value: "field", label: "田野" }, { value: "kiln", label: "窑四号" }]}
        />
      </div>
      <div className="mt-8">
        <input type="range" min={0} max={9000} value={amount} onChange={(event) => setAmount(Number(event.target.value))} aria-label="数字" />
        <p className="mt-3 text-4xl"><NumberRoll value={amount} /></p>
      </div>
      <pre className="mt-8 overflow-auto rounded-lg border border-border p-4 text-sm">{snippet}</pre>
      <button
        type="button"
        className="mt-3 text-sm text-foreground"
        onClick={() => navigator.clipboard.writeText(snippet)}
      >
        复制调用
      </button>
    </main>
  );
}
