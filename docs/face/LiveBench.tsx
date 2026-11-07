import { useState, type JSX } from "react";
import {
  CraftDialog,
  CraftDrawer,
  CraftFold,
  CraftMonth,
  CraftRange,
  CraftSelect,
  CraftTable,
  CraftTip,
  CraftToasts,
} from "../../src/craft";

/**
 * 道具台. 滑杆改弹簧目标, 控件不重新挂载, 用来看中断.
 */
export function LiveBench(): JSX.Element {
  const [choice, setChoice] = useState("field");
  const [amount, setAmount] = useState(36);
  const [day, setDay] = useState("2026-11-07");
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const rows = [
    { id: "a", name: "田野", value: 12 },
    { id: "b", name: "窑四号", value: amount },
    { id: "c", name: "记录", value: 7 },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <section className="rounded-xl border border-border p-4">
        <h2 className="text-sm text-muted-foreground">选择, 打开途中再按会反向</h2>
        <div className="mt-3">
          <CraftSelect
            label="页面"
            value={choice}
            onChange={setChoice}
            options={[
              { value: "field", label: "田野" },
              { value: "kiln", label: "窑四号" },
              { value: "note", label: "记录" },
            ]}
          />
        </div>
        <pre className="mt-3 overflow-auto text-xs text-muted-foreground">{`<CraftSelect value="${choice}" />`}</pre>
      </section>
      <section className="rounded-xl border border-border p-4">
        <h2 className="text-sm text-muted-foreground">滑杆, 松手吸附</h2>
        <div className="mt-6">
          <CraftRange label="幅度" value={amount} onChange={setAmount} />
        </div>
        <pre className="mt-3 text-xs text-muted-foreground">{`<CraftRange value={${amount}} step={10} />`}</pre>
      </section>
      <section className="rounded-xl border border-border p-4">
        <h2 className="text-sm text-muted-foreground">对话框与抽屉</h2>
        <div className="mt-3 flex gap-2">
          <button type="button" className="h-8 rounded-lg border border-border px-3 text-sm" onClick={() => setDialog(true)}>打开对话框</button>
          <button type="button" className="h-8 rounded-lg border border-border px-3 text-sm" onClick={() => setDrawer(true)}>打开抽屉</button>
        </div>
        <CraftDialog open={dialog} onOpenChange={setDialog} title="对话框">Esc 会从当前进度反向关上.</CraftDialog>
        <CraftDrawer open={drawer} onOpenChange={setDrawer} title="抽屉">按住面板向右拖, 速度够就关上.</CraftDrawer>
      </section>
      <section className="rounded-xl border border-border p-4">
        <h2 className="text-sm text-muted-foreground">提示, 折叠, 月份, 表格, 提示条</h2>
        <div className="mt-3">
          <CraftTip label="400ms 后出现">
            <button type="button" className="h-8 rounded-lg border border-border px-3 text-sm">悬停</button>
          </CraftTip>
        </div>
        <div className="mt-4">
          <CraftFold title="折叠面板">高度是弹簧, 再点一下从当前高度收回.</CraftFold>
        </div>
        <div className="mt-4">
          <CraftMonth value={day} onChange={setDay} />
        </div>
        <div className="mt-4">
          <CraftTable rows={rows} />
        </div>
        <div className="mt-4">
          <CraftToasts />
        </div>
      </section>
    </div>
  );
}
