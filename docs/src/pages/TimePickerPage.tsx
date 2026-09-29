import type { JSX } from "react";
import { useState } from "react";
import { TimePicker, SettingRow, SettingSection } from "@hx/ui";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";

/** TimePicker 页。 */
export function TimePickerPage(): JSX.Element {
  const [h, setH] = useState(9);
  const [m, setM] = useState(0);
  const [h2, setH2] = useState(23);
  const [m2, setM2] = useState(59);

  return (
    <>
      <P>
        为什么不用 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">&lt;input type="time"&gt;</code>:
        它的呈现完全交给浏览器 —— Chrome 是带钟表图标的分段输入, Firefox 是另一种,
        而且<b className="text-foreground">宽度与高度不可控</b>, 放进设置页的一行式版式里会把整行撑歪。
        这里自己拼两个数字输入, 尺寸与 Input 一致。
      </P>

      <H2>基础</H2>
      <Preview
        align="start"
        code={`const [h, setH] = useState(9);
const [m, setM] = useState(0);

<TimePicker hour={h} minute={m} onHourChange={setH} onMinuteChange={setM} />`}
      >
        <TimePicker hour={h} minute={m} onHourChange={setH} onMinuteChange={setM} />
        <span className="self-center font-mono text-[12px] text-muted-foreground">
          当前 {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
        </span>
      </Preview>

      <H2>三条被刻意调过的行为</H2>
      <P>
        一、<b className="text-foreground">受控但不卡输入</b>。输入过程中允许中间态 (想输 09 时先出现的那个 "0"),
        只有解析得出的数字才回调; 失焦时按规范化值回填, 于是 "7" 会变成 "07"。
      </P>
      <P>
        二、<b className="text-foreground">越界即夹紧</b>, 不报错也不拒绝。输了 99 就变成 59 —— 比弹出校验提示更顺手。
      </P>
      <P>
        三、<b className="text-foreground">去掉 spinner</b>。数字框右侧的上下箭头在 48px 宽的框里占掉三分之一,
        而方向键本来就能调值。
      </P>
      <Preview
        align="start"
        code={`{/* 试着输入 99 再失焦 —— 会被夹到 59 */}`}
      >
        <TimePicker hour={h2} minute={m2} onHourChange={setH2} onMinuteChange={setM2} />
        <span className="self-center text-[11.5px] text-muted-foreground">往小时里输 99 试试</span>
      </Preview>

      <H2>放进设置行</H2>
      <Preview
        align="start"
        code={`<SettingSection section={{ id: "automation" }} title="自动化">
  <SettingRow title="每日保活" description="到点自动跑一次探活">
    <TimePicker hour={h} minute={m} onHourChange={setH} onMinuteChange={setM} />
  </SettingRow>
</SettingSection>`}
      >
        <SettingSection section={{ id: "automation" }} title="自动化">
          <SettingRow title="每日保活" description="到点自动跑一次探活">
            <TimePicker hour={h} minute={m} onHourChange={setH} onMinuteChange={setM} />
          </SettingRow>
        </SettingSection>
      </Preview>

      <Callout title="分钟改成单数时会自动补零">
        失焦回填走 padStart(2, "0"), 所以 9:5 在界面上永远显示成 09:05。
        这是刻意的: 时间字段是扫描型信息, 参差不齐的宽度会让整列读起来很慢。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "hour / minute", type: "number", desc: "受控值。hour 0-23, minute 0-59。" },
          { name: "onHourChange / onMinuteChange", type: "(n: number) => void", desc: "改值时回调, 已夹紧到合法区间。" },
          { name: "disabled", type: "boolean", default: "false", desc: "同时禁用两个输入框。" },
          { name: "hourLabel / minuteLabel", type: "string", default: '"小时" / "分钟"', desc: "输入框的无障碍名。" },
          { name: "className", type: "string", desc: "外层容器的布局微调。" },
        ]}
      />
    </>
  );
}