/**
 * @hx/ui 自维护 UI 库: primitives/ 基础件建在 radix-ui 之上, layout/ 版式件决定页面版式, 视觉沿用 open-vetta.
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
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue } from "./primitives/select";
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "./primitives/dialog";
export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger } from "./primitives/drawer";
export {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "./primitives/dropdown-menu";
export { Popover, PopoverAnchor, PopoverArrow, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./primitives/popover";
export { Tooltip, TooltipContent, TooltipHint, TooltipProvider, TooltipTrigger } from "./primitives/tooltip";
export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants, tabsTriggerVariants, type TabsVariant } from "./primitives/tabs";
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./primitives/accordion";
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./primitives/collapsible";
export { ScrollArea, ScrollBar } from "./primitives/scroll-area";
export { Progress, ProgressMeter } from "./primitives/progress";
export { Skeleton, SkeletonText } from "./primitives/skeleton";
export { Separator } from "./primitives/separator";
export { Textarea } from "./primitives/textarea";
export { TimePicker, type TimePickerProps } from "./primitives/time-picker";
export { ConfirmDialog, ConfirmDialogHost, confirmDialog, ConfirmContext, useConfirmPending, type ConfirmDialogOptions, type ConfirmDialogProps } from "./primitives/confirm-dialog";
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
export { prefersReducedMotion, playLayout, readLayout, type LayoutBox } from "./primitives/motion";
export { MotionList, type MotionListItem } from "./primitives/motion-list";
export { layoutDelta, gestureDelta, scrollProgress, presenceDuration, retainedIds, type MotionPoint } from "./primitives/motion-math";
export { bindGesture } from "./primitives/gesture";
export { bindScrollProgress } from "./primitives/scroll-link";
export { MotionPresence } from "./primitives/presence";
export { type ClassValue, cn } from "./primitives/utils";
export { deprecate, type DeprecationNotice } from "./primitives/deprecate";
/**
 * 对标 shadcn/ui 补齐的基础件, 名单见 primitives/shadcn-parity.ts; 已有同名能力的组件 (ConfirmDialog,
 * 声明式 ContextMenu, EmptyState, Spin, DataTable, SidebarNavItemButton) 原导出不变, 组合式版本与之并存.
 * .agents/notes/implemented/feature/2026-10-18-shadcn-parity-components.md
 */
export {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogPortal,
  AlertDialogTitle, AlertDialogTrigger, AspectRatio, Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, ButtonGroup, ButtonGroupSeparator, ButtonGroupText, Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious,
  Combobox, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, ContextMenuCheckboxItem, ContextMenuContent,
  ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuRoot, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub,
  ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger, DirectionProvider, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Field, FieldContent,
  FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, HoverCard,
  HoverCardContent, HoverCardTrigger, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot,
  Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle, Label, Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup,
  MenubarItem, MenubarLabel, MenubarMenu, MenubarPortal, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger,
  NativeSelect, NativeSelectOptGroup, NativeSelectOption, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList,
  NavigationMenuTrigger, NavigationMenuViewport, ResizableHandle, ResizablePanel, ResizablePanelGroup, Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay,
  SheetPortal, SheetTitle, SheetTrigger, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset,
  SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail,
  SidebarSeparator, SidebarTrigger, Spinner, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, Toggle, ToggleGroup, ToggleGroupItem, TypographyBlockquote,
  TypographyH1, TypographyH2, TypographyH3, TypographyH4, TypographyInlineCode, TypographyLarge, TypographyLead, TypographyList, TypographyMuted, TypographyP, TypographySmall, avatarVariants,
  buttonGroupVariants, inputGroupAddonVariants, itemVariants, navigationMenuTriggerStyle, sidebarMenuButtonVariants, toggleVariants, useCarousel, useDirection, useFormField, useIsMobile, useSidebar,
} from "./primitives/shadcn-parity";
export type { CarouselApi, ComboboxMultipleProps, ComboboxOption, ComboboxProps, ComboboxSingleProps, SheetSide } from "./primitives/shadcn-parity";

// ── 蓝图 ──
export { createRegistry, defaultRegistry, BlueprintRegistryImpl, type BlueprintRegistryImpl as BlueprintRegistryClass } from "./blueprint/registry";
export {
  ANY, EXEC, BASE_TYPES, type DataTypeId, type DataTypeDef, type PortDef, type PortRef, type NodeTypeDef, type NodeValidator, type EvalContext, type ParamDef, type BlueprintNode, type BlueprintEdge,
  type BlueprintGraph, type IssueCode, type IssueLevel, type ValidationIssue, type NodeValidation, type GraphValidation,
} from "./blueprint/types";
export { canConnect, applyConnect, resolvePort, execOutIds, execOutLabel, EXEC_IN_PORT, type ConnectResult, type ConnectFailReason } from "./blueprint/connect";
export { validateGraph, findCycles, topoSort, upstreamOf, allPorts } from "./blueprint/validate";
export { useBlueprint, useSelection, makeId, type BlueprintApi, type UseBlueprintOptions } from "./blueprint/useBlueprint";
export { evaluateGraph, findEntries, type EvalResult } from "./blueprint/evaluate";
export { serializeGraph, parseGraph, toPseudoCode, FORMAT_VERSION, type SerializedGraph } from "./blueprint/serialize";
export { BlueprintCanvas, type BlueprintCanvasProps, type Viewport } from "./blueprint/BlueprintCanvas";
export { BlueprintNodeCard, type BlueprintNodeCardProps } from "./blueprint/BlueprintNode";
export { BlueprintPalette, groupByCategory, fuzzyMatch, PortDot, type BlueprintPaletteProps, type PaletteGroup } from "./blueprint/BlueprintPalette";
export { BlueprintEditor, type BlueprintEditorProps } from "./blueprint/BlueprintEditor";
export { useGraphValid } from "./blueprint/use-toolbar-props";
export { demoRegistry, createDemoRegistry, demoGraph, DEMO_NODES } from "./blueprint/demo";
export { collapseToSubgraph, expandSubgraph, subgraphAsGraph, writeSubgraph, subgraphRefCount, boundaryPorts, registerTunnels, TUNNEL_IN, TUNNEL_OUT } from "./blueprint/subgraph";
export { addComment, removeComment, updateComment, commentAround, moveCommentWithNodes, resizeComment, nodesInComment, commentContains } from "./blueprint/comment";
export { nodeShape, type ConnectableGraph, type MinimalNode } from "./blueprint/connect";
export type { NodePorts, SubGraphDef, BlueprintComment } from "./blueprint/types";
export {
  BODY_TOP, CURVE_MIN, HEADER_H, NODE_WIDTH, PORT_R, PORT_ROW, arrowFillClass, arrowHead, detourPath, edgePath, edgePathFrom, graphBounds, hitNode, hitPort, nodeHeight, nodeWidth, portPos,
  rectsIntersect, shouldDetour, toGraphPt, toScreen, wireStyle,
} from "./blueprint/geometry";
export type { Point, WireStyle } from "./blueprint/geometry";
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
  buildFromAgent, countOverlaps, describeGraph, describeRegistry, graphFromJson, type AgentNode, type AgentEdge, type AgentGraph, type AgentComment, type AgentBuildInput, type AgentBuildResult,
} from "./blueprint/agent";
export { useHistory, shouldCoalesce, type HistoryApi, type HistoryEntry, type UseHistoryOptions } from "./blueprint/history";
export { createBlueprintTools, toolManifest, dispatchTool, type ToolDef, type ToolResult, type ToolContext } from "./blueprint/tools";
export { SyncChannel, createBroadcastTransport, createStorageTransport, graphFromUrl, graphToHash, type SyncMessage, type SyncTransport, type SyncOptions } from "./blueprint/sync";
export { autoLayout, applyLayout, countCrossings, type LayoutOptions, type LayoutResult } from "./blueprint/layout";

// ── 代码编辑器 (monaco + One Dark Pro Darker) ──
export { CODE_THEME_ID, CodeEditor, DiffEditor, defineTheme, readPalette } from "./editor";
export type { CodeEditorProps, DiffEditorProps, DiffLineNote, DiffSide, Monaco } from "./editor";

// ── 版式件 ──
export { AppFrame, type AppFrameProps } from "./layout/AppFrame";
export { SettingRow, SettingSection, SettingHeading, type SettingSectionMeta } from "./layout/SettingChrome";
export { SelectField, InputField, TextareaField, SETTINGS_SELECT_TRIGGER_CLASS } from "./layout/SettingsFormFields";
export { MotionSelect, type MotionSelectProps } from "./layout/MotionSelect";
export { SegmentedControl, type SegmentedControlProps, type SegmentedControlItem } from "./layout/SegmentedControl";
export { CollapsePanel, type CollapsePanelProps } from "./layout/CollapsePanel";
// ── 图表 (基于 Recharts 3) ──
export { ChartFrame, ChartChrome, ChartTooltip, CHART_THEME, CHART_AXIS, CHART_GRID, seriesColor } from "./charts/ChartFrame";
export { useChartAnimation } from "./charts/useChartAnimation";
export { buildAnimationProps, shouldDisableAnimation, ANIMATION_POINT_LIMIT, type ChartAnimationOptions, type AnimationMatchMode, type MatchSpec } from "./charts/animation";
export {
  HxLineChart, HxAreaChart, HxBarChart, HxPieChart, HxRadarChart, HxRadialChart, type SeriesDef, type LineChartProps, type AreaChartProps, type BarChartProps, type PieChartProps, type RadarChartProps,
  type RadialChartProps,
} from "./charts/Charts";
export { Stepper, StepContent, StepDots, type StepItem, type StepStatus, type StepperProps } from "./layout/Stepper";
export { LogViewer, networkLogLine, type LogLine, type LogLevel, type LogDirection, type LogViewerProps } from "./layout/LogViewer";
export {
  Toaster, ToastContext, toast, showToast, dismissToast, dismissAllToasts, useToast, type ToastItem, type ToastVariant, type ToastPosition, type ToastAction, type ShowToastInput,
  type ToastViewportProps,
} from "./layout/Toast";
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants, type CardProps } from "./layout/Card";
export { DataTable, TableShell, useTableSearch, type DataTableProps, type DataTableColumn } from "./layout/DataTable";
export { StatCard, StatGrid, statValueVariants, type StatCardProps, type StatTone } from "./layout/StatCard";
export { EmptyState, DataBoundary, type EmptyStateProps, type EmptyKind } from "./layout/EmptyState";
export { PageHeader, type PageHeaderProps } from "./layout/PageHeader";
// ChatStream: 消费方 (HX-Jungle 的 console/hark) 一直在 import 它, 组件文件在
// src/layout/ 里, 但 index.ts 少了这一行导出, 于是 dev server 一重启就
// "does not provide an export named 'ChatStream'" 白屏 (实测 2026-10-15).
export { ChatStream, type ChatStreamProps, type ChatMessage, type ChatRole, type ChatStatus } from "./layout/ChatStream";
export { Badge, badgeVariants, type BadgeProps } from "./layout/Badge";
export { CodeBlock, CODE_THEME, ONE_DARK_PRO, type CodeBlockProps } from "./layout/CodeBlock";
export { SidebarNavItemButton, SidebarNavIcon, SidebarNavBadgeView, type SidebarNavItem, type SidebarNavBadge, type SidebarNavItemButtonProps } from "./layout/SidebarNav";
export { IconSlot, type IconSource, type IconSlotProps } from "./layout/Icon";
export { TreeNav, type TreeNavProps } from "./layout/TreeNav";
export { TreeRow, flattenTree, indentFor, INDENT_VARS, type TreeNode, type FlatNode, type TreeRowProps } from "./layout/tree-parts";
export { InlineRename, type InlineRenameProps } from "./layout/InlineRename";
export { StateDot, type StateTone, type StateDotProps } from "./layout/StateDot";
/**
 * 行首状态指示 (执行中 / 待查看 / 等待输入) 与树的行尾附加位.
 * .agents/notes/implemented/feature/2026-10-12-session-status-indicator.md
 */
export { SessionStatusDot, type SessionStatus, type SessionStatusDotProps } from "./layout/SessionStatusDot";
/**
 * 可收起侧栏与顶栏导航.
 *
 * .agents/notes/implemented/feature/2026-10-12-collapsible-rail.md
 */
export { CollapsibleRail, type CollapsibleRailProps } from "./layout/CollapsibleRail";
export { NavTabs, type NavTabItem, type NavTabsProps } from "./layout/NavTabs";
/**
 * 树的行级动作: 右键菜单 + 拖放.
 *
 * .agents/notes/implemented/feature/2026-10-12-tree-context-menu.md
 * .agents/notes/implemented/feature/2026-10-12-tree-drag-and-drop.md
 */
export { ContextMenu, type ContextMenuProps, type MenuAction } from "./layout/ContextMenu";
export { DragDrop, type DragBindings, type DragDropProps, type DragDropState } from "./layout/DragDrop";
export { ProxyChain, ProxyLayerLegend, PROXY_LAYER_META, type ProxyChainProps, type ProxyLayer } from "./layout/ProxyChain";
export { SettingsSidebarView, type SettingsSidebarViewProps, type SettingsSidebarTabItem, type SettingsSidebarChildItem } from "./layout/SettingsSidebarView";

// ── 会话 (AUI) ──
/** 会话组合件 (附件 / 气泡 / 标记 / 消息 / 滚动容器 / 问卷 / 推理轨迹), 对标 shadcn 同名组件; 整面板仍用 ChatStream. */
export {
  Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentImage, AttachmentMedia, AttachmentTitle, Bubble, BubbleCollapsible,
  BubbleContent, BubbleGroup, BubbleReactions, Marker, MarkerContent, MarkerIcon, Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader, MessageScroller,
  MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, Questionnaire, Trace, TraceLive, TraceSources, TraceStep, attachmentVariants, bubbleVariants, markerVariants, useMessageScroller,
} from "./chat";
export type { AttachmentState, QuestionnaireAnswers, QuestionnaireChoice, QuestionnaireLabels, QuestionnaireQuestion, TraceLiveItem, TraceStatus } from "./chat";

// ── hx-browser 实时预览 ──
/**
 * hx-browser 多副本实时预览与远程操作: 协议客户端, 钩子与平铺墙 / 聚焦视图组件.
 *
 * .agents/notes/implemented/feature/2026-10-17-hx-browser-live-view.md
 */
export {
  BrowserLiveEnvBadges, BrowserLiveStatus, BrowserLiveTile, BrowserLiveView, BrowserLiveWall, DEFAULT_LIVE_LABELS, DEFAULT_RETRY, FRAME_DATA_URL_PREFIX, HEADER_API_KEY, HeldInputs, KEY_ACTION,
  LIVE_CLOSE, LIVE_ENVS_PATH, LIVE_EVT, LIVE_MSG, LIVE_PRESET, LIVE_STATUS, LiveConnection, MOUSE_ACTION, MOUSE_BUTTONS, NAV_ACTION, NO_RETRY_CLOSE_CODES, QUERY_KEY, QUERY_PRESET, backoffDelay,
  buttonName, fetchLiveEnvs, findFocused, focusedGone, keyMessage, liveEnvsUrl, liveSessionPath, liveSessionUrl, mouseMessage, parseServerEvent, pickFocusTarget, resolveBrowserLiveLabels,
  useDocumentVisible, useElementInView, useHxBrowserLive, useHxBrowserLiveEnvs, useLiveInput,
} from "./hxbrowser";
export type {
  BrowserLiveEnvBadgesProps, BrowserLiveLabels, BrowserLiveStatusProps, BrowserLiveTileProps, BrowserLiveViewProps, BrowserLiveWallProps, FetchLike, HxBrowserLive, HxBrowserLiveEnvs,
  HxBrowserTransport, KeyAction, KeySample, LiveActivateMessage, LiveClientMessage, LiveConnectionOptions, LiveEnv, LiveErrorEvent, LiveFlowMessage, LiveFrameEvent, LiveKeyMessage, LiveMeta,
  LiveMetaEvent, LiveMouseMessage, LiveNavigateMessage, LivePreset, LiveQualityMessage, LiveRetryPolicy, LiveServerEvent, LiveSnapshot, LiveStatus, LiveTab, LiveTabsEvent, LiveTextMessage, LiveTimers,
  ModifierState, MouseAction, MouseButtonName, NavAction, PointerSample, SurfaceRect, UseHxBrowserLiveEnvsOptions, UseHxBrowserLiveOptions, WebSocketCtor,
} from "./hxbrowser";

// ── AI 交互 (agent) ──
/** Agent 交互过程组件: 工具调用卡, 流式文本, 用量计量, 变更对比, 思考过程, 子代理与任务树. */
export { DiffView, InlineApproval, StreamingMarkdown, StreamingText, TOOL_CALL_STATUS, ToolCallCard, UsageMeter } from "./agent";
export { Thinking, extractHeadline, StatusGlyph, TodoTree, deriveTodoStatus, SubagentCard, SubagentGroup, ThinkingBranches } from "./agent";
export type { DiffLine, DiffLineType, DiffViewProps, InlineApprovalProps, StreamingMarkdownProps, StreamingTextProps, ToolCallCardProps, ToolCallStatus, UsageMeterProps } from "./agent";
export type { ThinkingProps, ThinkingStatus, TodoNode, TodoStatus, TodoTreeProps, SubagentCardProps, SubagentGroupProps, ThinkingBranch, ThinkingBranchesProps } from "./agent";

// ── 动效引擎 (motion/react 预设, 入场, 交错, 数字滚动, 页面转场) ──
/**
 * UI 丰富度改造 phase 1 的四个新目录由集成分片 Z 接进公共入口, 名字逐个写出 (check-api-snapshot 不许 export *).
 * .agents/notes/implemented/feature/2026-11-01-motion-engine.md
 */
export {
  INSTANT, MOTION_PRESETS, SPRING, presetVariants, readMotionTokens, timingTransition, useMotionTokens, Reveal, MOTION_ELEMENTS, Stagger, StaggerItem, AnimatedNumber, FadeSwap, PageTransition,
} from "./motion";
export type {
  MotionPresetName, MotionTiming, MotionTokens, SpringName, MotionTag, RevealProps, StaggerItemProps, StaggerProps, AnimatedNumberProps, FadeSwapProps, PageTransitionProps, PresenceMode,
} from "./motion";

// ── 布局原语 (Stack / Grid / Container / Bento / SplitView) ──
export {
  Stack, HStack, VStack, Spacer, stackVariants, Grid, AutoGrid, gridVariants, Container, Section, Center, BOX_WIDTH, containerVariants, sectionVariants, centerVariants, Bento, BentoItem,
  bentoItemVariants, SplitView,
} from "./box";
export type {
  StackProps, StackTag, HStackProps, VStackProps, SpacerProps, GridProps, GridColumns, AutoGridProps, BoxWidth, ContainerProps, SectionProps, CenterProps, BentoProps, BentoItemProps, SplitViewProps,
} from "./box";

// ── 视觉效果件 (样式在 effects.css, 由 styles.css 引入) ──
export { SpotlightCard, BorderBeam, Marquee, Backdrop, GlassPanel, glassVariants } from "./effects";
export type { SpotlightCardProps, BorderBeamProps, MarqueeProps, BackdropProps, GlassPanelProps } from "./effects";

// ── 富交互件 ──
export { Timeline, TimelineItem, Rating, FileDropzone, TagInput, ColorSwatch } from "./widgets";
export type { TimelineProps, TimelineItemProps, RatingProps, FileDropzoneProps, FileRejection, TagInputProps, ColorSwatchOption, ColorSwatchProps } from "./widgets";

/**
 * V0 十项与 V1 区块层由集成任务 V0-Z 接进公共入口 (0.7.0). 名字逐个写出 (check-api-snapshot 不许 export *),
 * 同名不同物的件按层加前缀别名 (site* / Commerce* / Blocks*), 区块层另有 Blocks 命名空间对象.
 */
// ── 运行时主题 (HxProvider / createTheme / useTheme / getThemeScript) ──
/**
 * .agents/notes/implemented/feature/2026-11-02-runtime-theme-provider.md
 */
export { HxProvider, createTheme, varsToCss, isHxTheme, useTheme, useDefaults, mergeDefaults, HxThemeContext, getThemeScript } from "./provider";
export type { HxProviderProps, HxSeed, HxTheme, HxThemeVars, HxThemeCssSelectors, HxResolvedMode, HxMode, HxDensity, HxDefaults, HxThemeValue, HxThemeScriptOptions } from "./provider";

// ── 国际化 (LocaleProvider / useLocale / format*) ──
export {
  LocaleProvider, useLocale, useLocaleText, directionOf, mergeMessages, resolveText, formatCurrency, formatDate, formatDateTime, formatNumber, formatRelative, monthNames, weekdayNames, zhCN, enUS,
} from "./locale";
export type {
  LocaleProviderProps, LocaleState, ComboboxMessages, CommerceMessages, CommonMessages, ConfirmMessages, DateMessages, DatePresetMessages, DialogMessages, LocaleDomain, LocaleMessages, LocalePack,
  PaginationMessages, PartialMessages, TableMessages, TextDirection, UploadMessages, WeekStart, DateInput,
} from "./locale";

// ── 共享 hooks (state / dom / browser / input 四类, 直接转出 hooks/index.ts 桶) ──
/**
 * .agents/notes/implemented/architecture/2026-11-02-shared-hooks.md
 */
export {
  useControllableState, useDisclosure, useDebouncedValue, useEventCallback, assignRef, mergeRefs, useMergeRefs, useResizeObserver, useEventListener, useClickOutside, useMediaQuery, useBreakpoint,
  useReducedMotion, useLocalStorage, useClipboard, useIntersection, useIsomorphicLayoutEffect, getHotkeyHandler, matchHotkey, parseHotkey, useHotkeys,
} from "./hooks";
export type {
  ControllableStateSetter, UseControllableStateOptions, UseControllableStateReturn, DisclosureHandlers, UseDisclosureCallbacks, UseDisclosureReturn, UseDebouncedValueOptions, UseDebouncedValueReturn,
  EventCallback, PossibleRef, ObserverRect, UseResizeObserverReturn, EventListenerTarget, UseMediaQueryOptions, BreakpointMap, BreakpointName, BreakpointValue, UseLocalStorageOptions,
  UseLocalStorageReturn, UseClipboardOptions, UseClipboardReturn, UseIntersectionReturn, HotkeyHandler, HotkeyItem, HotkeyItemOptions, ParsedHotkey,
} from "./hooks";

// ── 皮肤与密度 (样式在 skins/index.css, 由 styles.css 引入) ──
/**
 * .agents/notes/implemented/feature/2026-11-02-skins-density.md
 */
export {
  isSkinName, isDensityName, applySkin, applyDensity, readSkin, readSkinVariant, readDensity, DENSITY, DENSITY_LIST, SKIN, SKIN_ATTR, SKIN_LIST, SKIN_VARIANT, SKIN_NAMES, DENSITY_NAMES,
} from "./skins";
export type { DensityName, SkinName, SkinVariant, ApplySkinOptions } from "./skins";

// ── 营销排版 (Display / Eyebrow / Kicker / Lead / GradientText / Prose) ──
export { Display, Eyebrow, Kicker, Lead, GradientText, Prose, DISPLAY_SIZE, DISPLAY_WEIGHT, TEXT_SIZE, TEXT_TONE, LEAD_MEASURE, KICKER_MARKER, CJK_MODE, detectCjk } from "./typography";
export type {
  DisplayProps, EyebrowProps, KickerProps, LeadProps, GradientTextProps, GradientTextState, ProseProps, ProseState, DisplaySize, DisplayWeight, TextSize, TextTone, LeadMeasure, KickerMarker, CjkMode, GradientStop,
  DisplayTag, LineTag, ProseTag,
} from "./typography";

// ── 媒体原语 (Image / ThemedImage / Video / Gallery / Lightbox / DeviceFrame / BrowserFrame / ProductMockFrame) ──
/**
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export {
  Image, ThemedImage, useImageStatus, Video, Gallery, Lightbox, DeviceFrame, BrowserFrame, resolveSlots, BROWSER_FRAME_SLOTS, DEVICE, DEVICE_FRAME_SLOTS, GALLERY_SLOTS, IMAGE_FIT, IMAGE_PLACEHOLDER,
  IMAGE_SLOTS, IMAGE_STATUS, LIGHTBOX_SLOTS, MEDIA_LABELS, MEDIA_MODE, THEMED_IMAGE_SLOTS, VIDEO_SLOTS,
  ProductMockFrame, PRODUCT_MOCK_DEFAULT, PRODUCT_MOCK_FADE, PRODUCT_MOCK_FRAME_SLOTS,
} from "./media";
export type {
  ImageProps, ImageSizing, ThemedImageProps, UseImageStatusReturn, VideoProps, VideoSource, GalleryProps, LightboxProps, LightboxState, MediaItem, LightboxIndexChange, DeviceFrameProps,
  BrowserFrameProps, SlotResolver, DeviceKind, ImageFit, ImageStatus, MediaLabels, MediaMode, SlotClassNames, SlotStyles,
  ProductMockFrameProps, ProductMockMedia, ProductMockFade,
} from "./media";

// ── 商业页背景与遮罩 (MeshGradient / Grain / Beam / GridLines / MaskFade / GradientBorder) ──
export { MeshGradient, Grain, Beam, GridLines, MaskFade, GradientBorder } from "./effects";
export type { MeshGradientProps, GrainProps, BeamProps, GridLinesProps, MaskFadeProps, GradientBorderProps } from "./effects";

// ── 滚动与文字动效 (ScrollProgress / Parallax / StickyScroll / RotatingText / SplitText / 编排) ──
export {
  ScrollProgress, useScrollProgress, useScrollProgressValue, Parallax, StickyScroll, RotatingText, SplitText, ORCHESTRATION_PRESETS, orchestrate, readStaggerStep, useOrchestration,
} from "./motion";
export type {
  ScrollAxis, ScrollBarPosition, ScrollProgressOptions, ScrollProgressProps, MotionDirection, ParallaxProps, StickyLayout, StickyScrollProps, RotateTrigger, RotatingTextProps, SplitBy,
  SplitTextProps, OrchestrationDelays, OrchestrationOptions, OrchestrationOrder, OrchestrationPresetName, OrchestrationRole,
} from "./motion";

// ── 站点外壳零件 (SiteHeader / MegaMenu / MobileNav / AnnouncementBar / LocaleSwitcher / SearchOverlay / SiteFooter / ThemeSwitcher) ──
export {
  resolveSlots as siteResolveSlots, SiteHeader, useSiteScroll, AnnouncementBar, MegaMenu, MobileNav, LocaleSwitcher, SearchOverlay, SiteFooter, ThemeSwitcher, THEME_MODES, isThemeMode, useThemeMode,
  ANNOUNCEMENT_BAR_SLOTS, LOCALE_SWITCHER_SLOTS, MEGA_MENU_SLOTS, MOBILE_NAV_SLOTS, SEARCH_OVERLAY_SLOTS, SITE_COLLAPSE, SITE_CONTAINER, SITE_FOOTER_SLOTS, SITE_HEADER_SLOTS, SITE_HEIGHT,
  SITE_OVERLAY_MODE, SITE_STORAGE, SITE_THEME_VARIANT, SITE_TONE, THEME_SWITCHER_SLOTS,
} from "./site";
export type {
  SiteCollapse, SiteContainerSize, SiteFeatured, SiteHeightSize, SiteLink, SiteLinkGroup, SiteNavItem, SiteSocialLink, SiteTone, SlotClassNames as SiteSlotClassNames, SlotProps,
  SlotResolver as SiteSlotResolver, SlotStyles as SiteSlotStyles, SiteHeaderProps, SiteHeaderSlot, SiteHeaderState, SiteScrollState, AnnouncementBarLabels, AnnouncementBarProps, AnnouncementBarSlot,
  MegaMenuLabels, MegaMenuProps, MegaMenuSlot, MobileNavLabels, MobileNavProps, MobileNavSlot, MobileNavState, LocaleGroup, LocaleOption, LocaleSwitcherLabels, LocaleSwitcherProps,
  LocaleSwitcherSlot, SearchOverlayGroup, SearchOverlayItem, SearchOverlayLabels, SearchOverlayProps, SearchOverlaySlot, SearchOverlayTerm, SiteFooterLabels, SiteFooterProps, SiteFooterSlot,
  ThemeSwitcherLabels, ThemeSwitcherProps, ThemeSwitcherSlot, ResolvedThemeMode, ThemeMode, UseThemeModeOptions, UseThemeModeReturn,
} from "./site";

// ── 商业语义原子 (Price / PromoBadge / ProductSwatch / SizeSelector / RatingSummary) ──
export {
  Price, PromoBadge, ProductSwatch, SizeSelector, RatingSummary, discountRate, useCommerceFormat, COMMERCE_SIZE, COMMERCE_TONE, COMMERCE_VARIANT, NEWSLETTER_STATUS, PRICE_PERIOD, PROMO_KIND,
  PROMO_PLACEMENT, RAIL_ITEM_SIZE,
} from "./commerce";
export type {
  PriceProps, PriceSlot, PriceState, PromoBadgeProps, PromoBadgeSlot, PromoBadgeState, ProductSwatchOption, ProductSwatchProps, ProductSwatchSlot, ProductSwatchState, SizeOption, SizeSelectorProps,
  SizeSelectorSlot, SizeSelectorState, RatingSummaryProps, RatingSummarySlot, RatingSummaryState, CommerceFormat, SlotClassNames as CommerceSlotClassNames, SlotProps as CommerceSlotProps,
  SlotStyles as CommerceSlotStyles, RovingApi, RovingItem, CommerceSize, CommerceTone, CommerceVariant, NewsletterStatus, PricePeriod, PromoKind, PromoPlacement, RailItemSize,
} from "./commerce";

// ── 区块层基座 (BlockShell / SectionHeading / BlocksProvider / PageComposer 与区块类型) ──
export {
  BlockShell, resolveSlots as blocksResolveSlots, useBlockShell, SectionHeading, CtaButton, CtaGroup, renderSectionHeading, BlocksProvider, useBlocks, useBlockLabels, PageComposer,
} from "./blocks/_shared";
export type {
  BlockShellContextValue, SectionHeadingState, BlockTone, BlockPad, BlockWidth, BlockAlign, BlockReveal, BlockTag, BlockTitleSize, BlockDensity, BackdropVariant, HeadingLevel,
  SlotClassNames as BlocksSlotClassNames, SlotStyles as BlocksSlotStyles, BlockShellSlot, SectionHeadingSlot, CtaGroupSlot, PageComposerSlot, BlockShellState, Rich, IconName, Cta, MediaRatio, Media,
  LinkItem, LinkGroup, MoneyPeriod, Money, Person, Logo, Badge as BlocksBadge, Stat, MaskSpec, BackdropSpec, BackdropLayerProps, BackdropRenderer, BlockBaseProps, BlockSlots, SectionHeadingData,
  BlockLabels, BlocksContextValue, BlockRegistry, BlockNode, BlockShellProps, SectionHeadingProps, CtaGroupProps, CtaButtonProps, BlocksProviderProps, PageComposerProps, ProfileHeroLayout,
  ProjectGridLayout, ProfileData, ExperienceItem, ProjectItem, PostItem, CalloutKind, TocItem, ApiRow, SearchSpec, DocsHomeCard,
} from "./blocks/_shared";

// ── 站点区块 (与 src/site 同名的件在平铺层带 Blocks 前缀, 分类写法见 Blocks.Site) ──
export {
  AnnouncementBar as BlocksAnnouncementBar, MegaMenuPanel, MobileNav as BlocksMobileNav, SiteFooter as BlocksSiteFooter, SiteHeader as BlocksSiteHeader, isMegaSpec, toNavItems, useSiteAria,
  siteBlockRegistry,
} from "./blocks/site";
export type {
  AnnouncementBlockProps, MegaMenuFeatured, MegaMenuPanelBlockProps, MegaMenuPanelData, MegaMenuSpec, MobileNavBlockProps, SearchSpec as BlocksSearchSpec, SiteBlockAriaLabels, SiteBrand,
  SiteFooterBlockProps, SiteHeaderBlockProps, SiteNavEntry, SiteNewsletter, SiteStatusState,
} from "./blocks/site";

// ── 营销区块 (分类写法 Blocks.Marketing.Hero 与平铺别名并存) ──
export {
  BentoFeatures, CaseStudies, ChangelogList, CodeShowcase, ComparisonMatrix, CtaBanner, Faq, FeatureAlternating, FeatureGrid, FigureGrid, Hero, InstallBlock, LogoWall, Newsletter, Pricing, Showcase,
  StatBand, Testimonials, TweetWall,
} from "./blocks/marketing";
export type {
  BentoFeaturesItem, BentoFeaturesProps, CaseStudiesVariant, CaseStudyItem, CaseStudiesProps, ChangelogVariant, ChangelogGroupBy, ChangelogEntry, ChangelogListProps, CodeShowcaseSlot, CodeSample,
  CodeShowcaseTab, CodeShowcaseProps, MatrixValue, MatrixPlan, MatrixRow, MatrixGroup, ComparisonMatrixProps, CtaBannerVariant, CtaBannerFill, CtaBannerProps, FaqItem, FaqGroup, FaqContact, FaqProps,
  FeatureAlternatingItem, FeatureAlternatingProps, FeatureGridItem, FeatureGridProps, FigureGridItem, FigureGridProps, HeroLayout, HeroPill, HeroTrust, HeroProps, InstallBlockSlot, InstallCommand,
  InstallPlatform, InstallAlternative, InstallBlockProps, LogoWallMode, LogoWallProps, NewsletterStatus as BlocksNewsletterStatus, NewsletterVariant, NewsletterProps, PricingFeature, PricingPlan,
  PricingBilling, PricingProps, ShowcaseItem, ShowcaseFeature, ShowcaseProps, StatBandItem, StatBandProps, TestimonialsVariant, TestimonialItem, TestimonialsProps, TweetItem, TweetWallProps,
} from "./blocks/marketing";

// ── 电商区块 ──
export { CampaignHero, CartSummary, CategoryTiles, CheckoutSteps, ProductCard, ProductDetail, ProductGrid, ProductRail, PromoStrip, SearchResults } from "./blocks/commerce";
export type {
  CampaignSlideData, CampaignHeroProps, CartLineData, CartTotalData, CartPromoSpec, CartSummaryData, CartSummaryProps, CategoryTileData, CategoryTilesProps, CheckoutStepData, CheckoutStepsProps,
  ProductBadgeData, ProductSwatchData, ProductCardData, ProductCardProps, DetailOptionValue, DetailOption, ProductDetailData, ProductDetailProps, ProductGridStateData, ProductGridCardOptions,
  ProductGridProps, ProductRailProps, PromoStripItemData, PromoStripProps, SearchFilterOption, SearchFilter, SearchSortSpec, SearchQueryState, SearchResultsProps,
} from "./blocks/commerce";

// ── 文档区块 ──
export { DocsShell, DocsToc, DocsPager, ApiTable, Callout, DocsHome, useActiveHeading, useCollectedHeadings, hashTarget, useDocsText, CALLOUT_KIND, DOCS_WIDTH_VAR } from "./blocks/docs";
export type {
  DocsShellProps, DocsShellSlot, DocsShellState, DocsTocProps, DocsTocSlot, DocsPagerProps, DocsPagerSlot, ApiTableProps, ApiTableSlot, CalloutProps, CalloutSlot, DocsHomeCards, DocsHomeHero,
  DocsHomeProps, DocsHomeSlot, ActiveHeadingOptions, DocsText,
} from "./blocks/docs";

// ── 作品集区块 ──
export {
  ProfileHero, StickyProfileLayout, ExperienceTimeline, ProjectGrid, PostList, HoverPreviewLink, useScrollSpy, hashTarget as blocksHashTarget, groupPostsByYear, PORTFOLIO_HERO_LAYOUT,
  PORTFOLIO_PROJECT_LAYOUT,
} from "./blocks/portfolio";
export type {
  ProfileHeroProps, StickyProfileAside, StickyProfileLayoutProps, ExperienceTimelineProps, ProjectGridProps, PostListProps, HoverPreviewLinkProps, ScrollSpyOptions, PostYearGroup,
} from "./blocks/portfolio";

// ── 区块层命名空间 (Blocks.Site / Blocks.Marketing / Blocks.Commerce / Blocks.Docs / Blocks.Portfolio) ──
export { Blocks } from "./blocks/namespace";

// ── 常量 ──
/** 库与文档站共用的字面量 (PROJECT-CONST-DUP), 导出清单见 public-constants.ts. */
export {
  AGENT_AUTO_RIGHT, AGENT_DEMO_STATUS, AGENT_NEWLINE, AGENT_ROW, AGENT_STREAMING_LABEL, AGENT_STREAM_LABEL, AGENT_TEXT_MUTED, ALIGN, BUTTON_TYPE, DIFF_KIND, DOC, DOC_KEY, DOC_SAMPLE, DOC_STREAMING_PROPS, DOC_TAB,
  DOC_EVENT, DOC_PAGE_ID, DOC_SHELL_CLS, EVENT, NAV_ICON, OPEN_STATE, ORIENTATION, OVERVIEW_DEMO, OVERVIEW_VIEW, PROCESS_DEMO, QUESTION_TYPE, SELECT_MODE, SIDE, SIZE, TASK_STATUS, THINK_DEMO, TODO_STATUS, TOOL_STATE, TONE, TONE_VARIANT, UI_CLASSES, USER, VARIANT,
} from "./public-constants";
export type { DocPropRow } from "./public-constants";
