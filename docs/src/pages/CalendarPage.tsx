import { useEffect, useState, type JSX } from "react";
import { Calendar, Card, CardContent, DatePicker, type CalendarProps, type DatePickerLabels } from "@hx/ui";
import { Callout, H2, H3, P, Preview, PropsTable } from "../components/DocKit";

/**
 * Calendar / DatePicker 页。
 *
 * 两个必须从源码里读出来的事实:
 *   1. Calendar 的尺寸由 CSS 变量 --cell-size 决定 (默认 --spacing(8) = 32px), 不写死像素;
 *   2. DatePicker 的月份/年份是**两个 Select**(不是原生 select), 并由自己的导航箭头代替 Calendar 的导航,
 *      所以它给 Calendar 传了 hideNavigation 与 month_caption: "hidden"。
 * locale 用动态 import: 静态引一个几 KB 的语言包不该拖进首屏。
 */
type Range = { from: Date; to?: Date };

/** DayPicker 的标签是配置项, 不是 React 节点, 所以要一个常量给它。 */
const CN_LABELS: CalendarProps["labels"] = {
  labelDayButton: (date: Date, modifiers): string =>
    [date.toLocaleDateString("zh-CN", { dateStyle: "full" }), modifiers.today && "今天", modifiers.selected && "已选中"]
      .filter(Boolean)
      .join(", "),
  labelWeekday: (date: Date): string => date.toLocaleDateString("zh-CN", { weekday: "long" }),
  labelGrid: (date: Date): string => date.toLocaleDateString("zh-CN", { year: "numeric", month: "long" }),
  labelNext: () => "下个月",
  labelPrevious: () => "上个月",
  labelMonthDropdown: () => "选择月份",
  labelYearDropdown: () => "选择年份",
};

const PICKER_LABELS: DatePickerLabels = {
  placeholder: "选择日期",
  clear: "清除",
  today: "今天",
  selected: "已选中",
  month: "月份",
  year: "年份",
  previousMonth: "上个月",
  nextMonth: "下个月",
};

const DAY_FORMAT: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };

export function CalendarPage(): JSX.Element {
  const [locale, setLocale] = useState<CalendarProps["locale"]>();
  const [single, setSingle] = useState<Date | undefined>(() => new Date());
  const [range, setRange] = useState<Range | undefined>(() => ({ from: new Date(), to: new Date() }));
  const [picked, setPicked] = useState<Date | undefined>();
  const [deadline, setDeadline] = useState<Date | undefined>();
  const today = new Date();

  useEffect(() => {
    let alive = true;
    void import("react-day-picker/locale").then((mod) => {
      if (alive) setLocale(mod.zhCN);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <P>
        格子边长来自 CSS 变量 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">--cell-size</code>,
        圆角来自 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">--cell-radius</code>,
        两个都挂在根节点上, 改一处就整块缩放。选中态是主色实底, 今天 (未选中) 是
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> bg-muted</code>。
      </P>

      <H2>单选</H2>
      <P>默认就是单选 (<code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">mode</code> 不传时是 single)。</P>
      <Preview
        align="start"
        code={`const [locale, setLocale] = useState<CalendarProps["locale"]>();

// 语言包按需加载: 静态引会把整个 date-fns 语言表拖进首屏
useEffect(() => {
  void import("react-day-picker/locale").then((mod) => setLocale(mod.zhCN));
}, []);

const [date, setDate] = useState<Date | undefined>(new Date());

<Calendar
  mode="single"
  locale={locale}
  selected={date}
  onSelect={setDate}
  labels={CN_LABELS}
  startMonth={new Date(2020, 0)}
  endMonth={new Date(2030, 11)}
/>`}
      >
        <Calendar
          mode="single"
          locale={locale}
          selected={single}
          onSelect={(day) => setSingle(day)}
          labels={CN_LABELS}
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2030, 11)}
        />
      </Preview>

      <H2>区间</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">mode="range"</code> 时选中态分三截:
        两端是主色实底加外侧圆角, 中间是 muted 底、圆角归零, 靠 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">after</code> 伪元素把相邻格补成连续色带。
      </P>
      <Preview
        align="start"
        code={`const [range, setRange] = useState<{ from: Date; to?: Date }>();

<Calendar
  mode="range"
  locale={locale}
  selected={range}
  onSelect={setRange}
  labels={CN_LABELS}
  numberOfMonths={2}
/>`}
      >
        <Calendar
          mode="range"
          locale={locale}
          selected={range}
          onSelect={(next) => setRange(next as Range | undefined)}
          labels={CN_LABELS}
        />
      </Preview>

      <H2>跨月与禁用</H2>
      <P>
        多个月份并排只需 numberOfMonths。禁用规则交给 DayPicker 的 disabled 数组 —— 它不是布尔, 而是
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> {"{ before } / { after } / 日期数组"}</code> 这几种 matcher。
      </P>
      <Preview
        align="start"
        code={`const today = new Date();
const monthAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
const monthLater = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

{/* 只能选前后各 30 天内的日子 */}
<Calendar
  mode="single"
  locale={locale}
  selected={date}
  onSelect={setDate}
  labels={CN_LABELS}
  numberOfMonths={2}
  disabled={[{ before: monthAgo }, { after: monthLater }]}
  startMonth={monthAgo}
  endMonth={monthLater}
/>`}
      >
        <Calendar
          mode="single"
          locale={locale}
          selected={single}
          onSelect={(day) => setSingle(day)}
          labels={CN_LABELS}
          numberOfMonths={2}
          disabled={[
            { before: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30) },
            { after: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30) },
          ]}
          startMonth={new Date(today.getFullYear(), today.getMonth() - 1)}
          endMonth={new Date(today.getFullYear(), today.getMonth() + 2)}
        />
      </Preview>

      <H2>DatePicker</H2>
      <P>
        把 Calendar 装进 Popover 的成品: 触发器是 outline 按钮 (带日历图标, 未选时文字走静默色),
        面板顶部一条标题, 中间一行"上月 / 月份 / 年份 / 下月"的导航, 底部一条"今天 / 清除"。
        月份与年份都是 Select, 选项超出容器才出现滚动按钮。
      </P>
      <Preview
        align="start"
        code={`const [date, setDate] = useState<Date | undefined>();
const [deadline, setDeadline] = useState<Date | undefined>();
const today = new Date();
const nextMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

<DatePicker
  label="截止日期"
  value={date}
  onChange={setDate}
  labels={PICKER_LABELS}
  locale={locale}
  className="w-56"
/>

{/* 限定范围: 超出 minDate~maxDate 的日子和"今天"都会被禁用 */}
<DatePicker
  label="排期"
  value={deadline}
  onChange={setDeadline}
  labels={PICKER_LABELS}
  locale={locale}
  minDate={today}
  maxDate={nextMonth}
  className="w-56"
/>`}
      >
        <DatePicker
          label="截止日期"
          value={picked}
          onChange={setPicked}
          labels={PICKER_LABELS}
          locale={locale}
          className="w-56"
        />
        <DatePicker
          label="排期"
          value={deadline}
          onChange={setDeadline}
          labels={PICKER_LABELS}
          locale={locale}
          minDate={today}
          maxDate={new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)}
          className="w-56"
        />
      </Preview>

      <H3>选中结果</H3>
      <Card variant="solid" className="my-4 w-72">
        <CardContent className="text-[12.5px] text-muted-foreground">
          单选: {single ? single.toLocaleDateString("zh-CN", DAY_FORMAT) : "未选择"}
          <br />
          区间: {range ? `${range.from.toLocaleDateString("zh-CN", DAY_FORMAT)} ~ ${(range.to ?? range.from).toLocaleDateString("zh-CN", DAY_FORMAT)}` : "未选择"}
          <br />
          截止日期: {picked ? picked.toLocaleDateString("zh-CN", DAY_FORMAT) : "未选择"}
          <br />
          排期: {deadline ? deadline.toLocaleDateString("zh-CN", DAY_FORMAT) : "未选择"}
        </CardContent>
      </Card>

      <Callout kind="warning" title="locale 只影响日历, 不影响触发器文案">
        触发器与 DayPicker 的日期格式都用 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">locale.code</code> 走
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> Intl.DateTimeFormat</code>;
        但面板底部的"今天 / 清除"、月份年份的 aria-label 全部来自你传进去的
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> labels</code> —— 不传就是中文占位也会缺。
      </Callout>

      <H2>属性</H2>
      <H3>Calendar</H3>
      <PropsTable
        rows={[
          { name: "mode", type: '"single" | "multiple" | "range"', desc: "选择模式。不传时为单选。" },
          { name: "selected / onSelect", type: "Date | Date[] | DateRange / handler", desc: "选中值与其变更回调。" },
          { name: "showOutsideDays", type: "boolean", default: "true", desc: "是否画出上/下月的日子。" },
          { name: "captionLayout", type: '"label" | "dropdown" | "dropdown-years"', default: '"label"', desc: "标题形态; dropdown 会把年月换成两个原生下拉。" },
          { name: "buttonVariant", type: "Button variant", default: '"ghost"', desc: "上一个/下一个月按钮的皮。" },
          { name: "locale", type: "Locale", desc: "语言与时区。传 react-day-picker/locale 里的对象。" },
          { name: "disabled", type: "Matcher | Matcher[]", desc: "禁用规则, 例如 [{ before: date }]。" },
          { name: "labels", type: "Partial<Labels>", desc: "无障碍标签与星期名。它由日期算出来, 所以必须是配置项而不是节点。" },
          { name: "startMonth / endMonth", type: "Date", desc: "可翻月份的下界与上界。" },
          { name: "numberOfMonths", type: "number", default: "1", desc: "并排显示的月份数。" },
        ]}
      />
      <H3>DatePicker</H3>
      <PropsTable
        rows={[
          { name: "value / onChange", type: "Date | undefined / (value: Date | undefined) => void", desc: "受控值。它是纯受控组件, 没有 defaultValue。" },
          { name: "label", type: "string", desc: "触发器 aria-label 与面板标题。" },
          { name: "labels", type: "DatePickerLabels", desc: "必填。8 个文案: placeholder / clear / today / selected / month / year / previousMonth / nextMonth。" },
          { name: "locale", type: "CalendarProps[\"locale\"]", desc: "透传给 Calendar。" },
          { name: "minDate / maxDate", type: "Date", desc: "可选日期上下界, 比较时只取日期部分, 忽略时分秒。" },
          { name: "disabled", type: "boolean", default: "false", desc: "禁用触发器。" },
          { name: "className", type: "string", desc: "触发器类串, 宽度给这里。" },
        ]}
      />
    </>
  );
}
