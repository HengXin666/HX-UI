/**
 * @hx/ui  自维护 UI 库。
 *
 * 视觉沿用 open-vetta 那套设计语言: 组件源码整份取自上游, **视觉类名一个字没改**,
 * 只把包名引用改成相对路径。这就是"看起来一样"的唯一可靠来源  类名组合没法靠描述复现。
 *
 * 分两层:
 * - primitives/ 基础件 (按钮 / 输入 / 开关 / 弹层 / 下拉 ...), 建在 radix-ui 之上
 * - layout/ 版式件 (应用外壳 / 设置页一行式卡片 / 分段控件 ...), 决定页面长什么样
 */

// ── 基础件 ──
/**
 * HX-UI 接入 Agent Notes v2
 * .agents/notes/implemented/process/2026-10-08-repository-agent-notes-v2-adoption.md
 */
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
export {
  Tooltip, TooltipContent, TooltipHint, TooltipProvider, TooltipTrigger,
} from "./primitives/tooltip";
export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants, tabsTriggerVariants, type TabsVariant } from "./primitives/tabs";
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./primitives/accordion";
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./primitives/collapsible";
export { ScrollArea, ScrollBar } from "./primitives/scroll-area";
export { Progress, ProgressMeter } from "./primitives/progress";
export { Skeleton, SkeletonText } from "./primitives/skeleton";
export { Separator } from "./primitives/separator";
export { Textarea } from "./primitives/textarea";
export { TimePicker, type TimePickerProps } from "./primitives/time-picker";
export {
  ConfirmDialog, ConfirmDialogHost, confirmDialog, ConfirmContext, useConfirmPending,
  type ConfirmDialogOptions, type ConfirmDialogProps,
} from "./primitives/confirm-dialog";
/**
 * 管理页常用基础件与点按水波纹
 * .agents/notes/implemented/feature/2026-10-17-dark-dimmed-retheme.md
 */
export { Checkbox } from "./primitives/checkbox";
export { RadioGroup, RadioGroupItem } from "./primitives/radio-group";
export { Pagination, paginationRange, type PageItem, type PaginationLabels, type PaginationProps } from "./primitives/pagination";
export { Kbd, KbdGroup } from "./primitives/kbd";
export { Alert, AlertDescription, AlertTitle, alertVariants, type AlertVariant } from "./primitives/alert";
export { Ripple, spawnRipple, useRipple, type RippleComponentProps, type RippleSize, type UseRippleOptions } from "./primitives/ripple";
export { type ClassValue, cn } from "./primitives/utils";

// ── 蓝图 ──
export {
  createRegistry, defaultRegistry, BlueprintRegistryImpl,
  type BlueprintRegistryImpl as BlueprintRegistryClass,
} from "./blueprint/registry";
export {
  ANY, EXEC, BASE_TYPES,
  type DataTypeId, type DataTypeDef, type PortDef, type PortRef,
  type NodeTypeDef, type NodeValidator, type EvalContext, type ParamDef,
  type BlueprintNode, type BlueprintEdge, type BlueprintGraph,
  type IssueCode, type IssueLevel, type ValidationIssue,
  type NodeValidation, type GraphValidation,
} from "./blueprint/types";
export {
  canConnect, applyConnect, resolvePort, execOutIds, execOutLabel, EXEC_IN_PORT,
  type ConnectResult, type ConnectFailReason,
} from "./blueprint/connect";
export {
  validateGraph, findCycles, topoSort, upstreamOf, allPorts,
} from "./blueprint/validate";
export {
  useBlueprint, useSelection, makeId,
  type BlueprintApi, type UseBlueprintOptions,
} from "./blueprint/useBlueprint";
export {
  evaluateGraph, findEntries, type EvalResult,
} from "./blueprint/evaluate";
export {
  serializeGraph, parseGraph, toPseudoCode, FORMAT_VERSION, type SerializedGraph,
} from "./blueprint/serialize";
export {
  BlueprintCanvas, type BlueprintCanvasProps, type Viewport,
} from "./blueprint/BlueprintCanvas";
export {
  BlueprintNodeCard, type BlueprintNodeCardProps,
} from "./blueprint/BlueprintNode";
export {
  BlueprintPalette, groupByCategory, fuzzyMatch, PortDot,
  type BlueprintPaletteProps, type PaletteGroup,
} from "./blueprint/BlueprintPalette";
export {
  BlueprintEditor, type BlueprintEditorProps,
} from "./blueprint/BlueprintEditor";
export { useGraphValid } from "./blueprint/use-toolbar-props";
export {
  demoRegistry, createDemoRegistry, demoGraph, DEMO_NODES,
} from "./blueprint/demo";
export {
  collapseToSubgraph, expandSubgraph, subgraphAsGraph, writeSubgraph,
  subgraphRefCount, boundaryPorts, registerTunnels, TUNNEL_IN, TUNNEL_OUT,
} from "./blueprint/subgraph";
export {
  addComment, removeComment, updateComment, commentAround, moveCommentWithNodes,
  resizeComment, nodesInComment, commentContains,
} from "./blueprint/comment";
export {
  nodeShape, type ConnectableGraph, type MinimalNode,
} from "./blueprint/connect";
export type {
  NodePorts, SubGraphDef, BlueprintComment,
} from "./blueprint/types";
export * from "./blueprint/geometry";
export { SHORTCUTS, matchShortcut, shouldHandle, isTypingTarget, type ShortcutDef } from "./blueprint/shortcuts";
export { copySelection, pasteClip, alignNodes, isEmptyClip, type ClipboardPayload } from "./blueprint/clipboard";
export { downloadGraph, pickGraphFile, graphFromText, GRAPH_EXT } from "./blueprint/persist";
export { ShortcutHelp } from "./blueprint/ShortcutHelp";
export { BlueprintIssues } from "./blueprint/BlueprintIssues";
export { CanvasGrid, GRID_SIZE } from "./blueprint/CanvasGrid";
export { BlueprintFlow } from "./blueprint/BlueprintFlow";
export { toReactFlow, edgeFromRf, computeConnected, handleId, portOfHandle, graphMatchesRegistry } from "./blueprint/rf-adapter";
export { PinShape } from "./blueprint/PinShape";
export { nodeKindOf, titleStyle } from "./blueprint/node-style";
export { PortRow, ParamField } from "./blueprint/node-parts";
export {
  buildFromAgent, countOverlaps, describeGraph, describeRegistry, graphFromJson,
  type AgentNode, type AgentEdge, type AgentGraph, type AgentComment,
  type AgentBuildInput, type AgentBuildResult,
} from "./blueprint/agent";
export {
  useHistory, shouldCoalesce,
  type HistoryApi, type HistoryEntry, type UseHistoryOptions,
} from "./blueprint/history";
export {
  createBlueprintTools, toolManifest, dispatchTool,
  type ToolDef, type ToolResult, type ToolContext,
} from "./blueprint/tools";
export {
  SyncChannel, createBroadcastTransport, createStorageTransport,
  graphFromUrl, graphToHash,
  type SyncMessage, type SyncTransport, type SyncOptions,
} from "./blueprint/sync";
export {
  autoLayout, applyLayout, countCrossings,
  type LayoutOptions, type LayoutResult,
} from "./blueprint/layout";

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
export {
  DataTable, TableShell, useTableSearch,
  type DataTableProps, type DataTableColumn,
} from "./layout/DataTable";
export { StatCard, StatGrid, statValueVariants, type StatCardProps, type StatTone } from "./layout/StatCard";
export { EmptyState, DataBoundary, type EmptyStateProps, type EmptyKind } from "./layout/EmptyState";
export { PageHeader, type PageHeaderProps } from "./layout/PageHeader";
// ChatStream: 消费方 (HX-Jungle 的 console/hark) 一直在 import 它, 组件文件在
// src/layout/ 里, 但 index.ts 少了这一行导出, 于是 dev server 一重启就
// "does not provide an export named 'ChatStream'" 白屏 (实测 2026-10-15)。
export {
  ChatStream, type ChatStreamProps, type ChatMessage, type ChatRole, type ChatStatus,
} from "./layout/ChatStream";
export { Badge, badgeVariants, type BadgeProps } from "./layout/Badge";
export {
  CodeBlock, CODE_THEME, ONE_DARK_PRO, type CodeBlockProps,
} from "./layout/CodeBlock";
export {
  SidebarNavItemButton, SidebarNavIcon, SidebarNavBadgeView,
  type SidebarNavItem, type SidebarNavBadge, type SidebarNavItemButtonProps,
} from "./layout/SidebarNav";
export { IconSlot, type IconSource, type IconSlotProps } from "./layout/Icon";
export { TreeNav, type TreeNavProps } from "./layout/TreeNav";
export {
  TreeRow, flattenTree, indentFor, INDENT_VARS,
  type TreeNode, type FlatNode, type TreeRowProps,
} from "./layout/tree-parts";
export { InlineRename, type InlineRenameProps } from "./layout/InlineRename";
export { StateDot, type StateTone, type StateDotProps } from "./layout/StateDot";
/**
 * 行首状态指示 (执行中 / 待查看 / 等待输入) 与树的行尾附加位。
 * .agents/notes/implemented/feature/2026-10-12-session-status-indicator.md
 */
export {
  SessionStatusDot, type SessionStatus, type SessionStatusDotProps,
} from "./layout/SessionStatusDot";
/**
 * 可收起侧栏与顶栏导航。
 *
 * .agents/notes/implemented/feature/2026-10-12-collapsible-rail.md
 */
export {
  CollapsibleRail, type CollapsibleRailProps,
} from "./layout/CollapsibleRail";
export {
  NavTabs, type NavTabItem, type NavTabsProps,
} from "./layout/NavTabs";
/**
 * 树的行级动作: 右键菜单 + 拖放.
 *
 * .agents/notes/implemented/feature/2026-10-12-tree-context-menu.md
 * .agents/notes/implemented/feature/2026-10-12-tree-drag-and-drop.md
 */
export {
  ContextMenu, type ContextMenuProps, type MenuAction,
} from "./layout/ContextMenu";
export {
  DragDrop, type DragBindings, type DragDropProps, type DragDropState,
} from "./layout/DragDrop";
export {
  ProxyChain, ProxyLayerLegend, PROXY_LAYER_META,
  type ProxyChainProps, type ProxyLayer,
} from "./layout/ProxyChain";
export {
  SettingsSidebarView,
  type SettingsSidebarViewProps,
  type SettingsSidebarTabItem,
  type SettingsSidebarChildItem,
} from "./layout/SettingsSidebarView";

// ── 常量 ──
/**
 * 库与文档站共用同一份字面量 (PROJECT-CONST-DUP), 目前文档站的表格列用到 USER, 状态色示例用到 TONE.
 * .agents/notes/implemented/architecture/2026-10-15-constant-library.md
 */
export { TONE, USER } from "./constants";
