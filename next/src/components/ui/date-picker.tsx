import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useFieldControl } from "@/components/ui/field"

const fmt = (d: Date) => d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")

type TriggerProps = { id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean | "true" | "false"; "aria-required"?: boolean | "true" | "false"; disabled?: boolean }

function Trigger({ text, placeholder, clearable, onClear, className, ...rest }: TriggerProps & { text?: string; placeholder: string; clearable?: boolean; onClear: () => void; className?: string }) {
  // 按钮不允许 aria-required (读屏校验会报错), 必填由 Field 的星号和错误信息表达
  const { "aria-required": _req, ...props } = useFieldControl(rest)
  void _req
  return (
    <div className={cn("relative w-full", className)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          {...props}
          data-empty={!text || undefined}
          className="w-full justify-start gap-2 pr-9 font-normal tabular-nums data-[empty]:text-muted-foreground aria-invalid:border-destructive"
        >
          <CalendarIcon className="text-muted-foreground" />
          {text ?? placeholder}
        </Button>
      </PopoverTrigger>
      {clearable && text && !props.disabled && (
        <button type="button" onClick={onClear} aria-label="清除日期" className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export interface DatePickerProps extends TriggerProps {
  value?: Date
  onChange: (d: Date | undefined) => void
  placeholder?: string
  clearable?: boolean
  /** 不可选的日期, 如 { before: new Date() } */
  disabled?: boolean
  disabledDays?: React.ComponentProps<typeof Calendar>["disabled"]
  className?: string
}

/** 选一个日期. 选完自动关闭; 放进 Field 自动连好标签 */
function DatePicker({ value, onChange, placeholder = "选择日期", clearable = true, disabledDays, className, ...rest }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger {...rest} className={className} text={value ? fmt(value) : undefined} placeholder={placeholder} clearable={clearable} onClear={() => onChange(undefined)} />
      <PopoverContent className="w-auto p-0" align="start" aria-label="选择日期">
        <Calendar mode="single" selected={value} defaultMonth={value} disabled={disabledDays} onSelect={(d) => { onChange(d); setOpen(false) }} autoFocus />
      </PopoverContent>
    </Popover>
  )
}

export interface DateRangePreset { label: string; range: () => DateRange }

const day = (n: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d }
/** 报表常用的快捷区间 */
export const RANGE_PRESETS: DateRangePreset[] = [
  { label: "今天", range: () => ({ from: day(0), to: day(0) }) },
  { label: "最近 7 天", range: () => ({ from: day(-6), to: day(0) }) },
  { label: "最近 30 天", range: () => ({ from: day(-29), to: day(0) }) },
  { label: "本月", range: () => { const t = day(0); return { from: new Date(t.getFullYear(), t.getMonth(), 1), to: t } } },
]

export interface DateRangePickerProps extends TriggerProps {
  value?: DateRange
  onChange: (r: DateRange | undefined) => void
  placeholder?: string
  /** 左侧快捷区间; 传 [] 关闭 */
  presets?: DateRangePreset[]
  /** 并排显示几个月 */
  months?: number
  clearable?: boolean
  disabledDays?: React.ComponentProps<typeof Calendar>["disabled"]
  className?: string
}

/** 选一段日期. 左侧快捷区间, 右侧双月日历 */
function DateRangePicker({ value, onChange, placeholder = "选择日期范围", presets = RANGE_PRESETS, months = 2, clearable = true, disabledDays, className, ...rest }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const text = value?.from ? `${fmt(value.from)} 至 ${value.to ? fmt(value.to) : "…"}` : undefined
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger {...rest} className={className} text={text} placeholder={placeholder} clearable={clearable} onClear={() => onChange(undefined)} />
      <PopoverContent className="flex w-auto p-0 max-sm:flex-col" align="start" aria-label="选择日期范围">
        {presets.length > 0 && (
          <div className="flex gap-1 border-b p-2 sm:w-32 sm:flex-col sm:border-r sm:border-b-0" role="group" aria-label="快捷区间">
            {presets.map((p) => (
              <Button key={p.label} variant="ghost" size="sm" className="justify-start font-normal" onClick={() => { onChange(p.range()); setOpen(false) }}>
                {p.label}
              </Button>
            ))}
          </div>
        )}
        <Calendar mode="range" selected={value} defaultMonth={value?.from} onSelect={onChange} numberOfMonths={months} disabled={disabledDays} autoFocus className="max-sm:[&_.rdp-months]:flex-col" />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DateRangePicker }
export type { DateRange }
