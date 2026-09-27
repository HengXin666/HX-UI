/**
 * @hx/ui —— 自维护 UI 库。
 *
 * 视觉沿用 open-vetta 那套设计语言: 组件源码整份取自上游, **视觉类名一个字没改**,
 * 只把包名引用改成相对路径。这就是"看起来一样"的唯一可靠来源 —— 类名组合没法靠描述复现。
 *
 * 分两层:
 *   primitives/ 基础件 (按钮 / 输入 / 开关 / 弹层 / 下拉 ...), 建在 radix-ui 之上
 *   layout/     版式件 (应用外壳 / 设置页一行式卡片 / 分段控件 ...), 决定页面长什么样
 */

// ── 基础件 ──
export { Button, buttonVariants } from "./primitives/button";
export { Input } from "./primitives/input";
export { Switch } from "./primitives/switch";
export { Spin, SPIN_VARIANTS, type SpinProps, type SpinSize, type SpinVariant } from "./primitives/spin";
export { Slider, type SliderProps } from "./primitives/slider";
export { Calendar, CalendarDayButton, type CalendarProps } from "./primitives/calendar";
export { DatePicker, type DatePickerProps, type DatePickerLabels } from "./primitives/date-picker";
export {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectScrollDownButton, SelectScrollUpButton, SelectSeparator,
  SelectTrigger, SelectValue,
} from "./primitives/select";
export {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger,
} from "./primitives/dialog";
export {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter,
  DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger,
} from "./primitives/drawer";
export {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "./primitives/dropdown-menu";
export {
  Popover, PopoverAnchor, PopoverArrow, PopoverContent, PopoverDescription,
  PopoverHeader, PopoverTitle, PopoverTrigger,
} from "./primitives/popover";
export { type ClassValue, cn } from "./primitives/utils";

// ── 版式件 ──
export { AppFrame, type AppFrameProps } from "./layout/AppFrame";
export {
  SettingRow, SettingSection, SettingHeading, type SettingSectionMeta,
} from "./layout/SettingChrome";
export {
  SelectField, InputField, TextareaField, SETTINGS_SELECT_TRIGGER_CLASS,
} from "./layout/SettingsFormFields";
export { MotionSelect, type MotionSelectProps } from "./layout/MotionSelect";
export {
  SegmentedControl, type SegmentedControlProps, type SegmentedControlItem,
} from "./layout/SegmentedControl";
export { CollapsePanel, type CollapsePanelProps } from "./layout/CollapsePanel";
// ── 图表 (基于 Recharts 3) ──
export { ChartFrame, ChartChrome, ChartTooltip, CHART_THEME, CHART_AXIS, CHART_GRID, seriesColor } from "./charts/ChartFrame";
export { useChartAnimation } from "./charts/useChartAnimation";
export {
  buildAnimationProps, shouldDisableAnimation, ANIMATION_POINT_LIMIT,
  type ChartAnimationOptions, type AnimationMatchMode, type MatchSpec,
} from "./charts/animation";
export {
  HxLineChart, HxAreaChart, HxBarChart, HxPieChart, HxRadarChart, HxRadialChart,
  type SeriesDef,
  type LineChartProps, type AreaChartProps, type BarChartProps,
  type PieChartProps, type RadarChartProps, type RadialChartProps,
} from "./charts/Charts";
export {
  Stepper, StepContent, StepDots,
  type StepItem, type StepStatus, type StepperProps,
} from "./layout/Stepper";
export {
  LogViewer, networkLogLine,
  type LogLine, type LogLevel, type LogDirection, type LogViewerProps,
} from "./layout/LogViewer";
export {
  Toaster, ToastContext, toast, showToast, dismissToast, dismissAllToasts, useToast,
  type ToastItem, type ToastVariant, type ToastPosition, type ToastAction,
  type ShowToastInput, type ToastViewportProps,
} from "./layout/Toast";
export {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  cardVariants, type CardProps,
} from "./layout/Card";
export { Badge, badgeVariants, type BadgeProps } from "./layout/Badge";
export {
  CodeBlock, CODE_THEME, ONE_DARK_PRO, type CodeBlockProps,
} from "./layout/CodeBlock";
export {
  SidebarNavItemButton, SidebarNavIcon, SidebarNavBadgeView,
  type SidebarNavItem, type SidebarNavBadge, type SidebarNavItemButtonProps,
} from "./layout/SidebarNav";
export {
  SettingsSidebarView,
  type SettingsSidebarViewProps,
  type SettingsSidebarTabItem,
  type SettingsSidebarChildItem,
} from "./layout/SettingsSidebarView";
