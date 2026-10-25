import type { JSX } from "react";
import { SkeletonPage } from "../SkeletonPage";
import { AttachmentPage, BubblePage, MarkerPage, MessagePage } from "./chat";
import { MessageScrollerPage, QuestionnairePage } from "./agent";
import { TracePage } from "./trace";
import { CheckboxPage, KbdPage, LabelPage, RadioGroupPage, SeparatorPage, SpinnerPage } from "./basics";
import { CarouselPage, DirectionPage, ResizablePage } from "./display";
import { SidebarPage } from "./sidebar";
import { AlertPage, EmptyPage, PaginationPage, TypographyPage } from "./feedback";
import { FieldPage, FormPage, InputGroupPage } from "./form";
import { ComboboxPage, InputOTPPage, NativeSelectPage } from "./pickers";
import { AspectRatioPage, AvatarPage, ButtonGroupPage, ToggleGroupPage } from "./layout";
import { ItemPage, TablePage } from "./listing";
import { BreadcrumbDocPage, MenubarPage, NavigationMenuPage } from "./navigation";
import { ContextMenuPage } from "./context-menu";
import { AlertDialogPage, CommandPage, HoverCardPage, SheetPage } from "./overlay";

/**
 * 对标 shadcn 补齐的文档页, 按导航 id 查表.
 * 模板页 (templates-*) 只由 pages/templates 的 TEMPLATE_PAGES 登记, 不在这里重复.
 */
export const PARITY_PAGES: Readonly<Record<string, () => JSX.Element>> = {
  alert: AlertPage,
  "alert-dialog": AlertDialogPage,
  "aspect-ratio": AspectRatioPage,
  attachment: AttachmentPage,
  avatar: AvatarPage,
  breadcrumb: BreadcrumbDocPage,
  bubble: BubblePage,
  "button-group": ButtonGroupPage,
  carousel: CarouselPage,
  checkbox: CheckboxPage,
  combobox: ComboboxPage,
  command: CommandPage,
  "context-menu": ContextMenuPage,
  direction: DirectionPage,
  empty: EmptyPage,
  field: FieldPage,
  form: FormPage,
  "hover-card": HoverCardPage,
  "input-group": InputGroupPage,
  "input-otp": InputOTPPage,
  item: ItemPage,
  kbd: KbdPage,
  label: LabelPage,
  marker: MarkerPage,
  menubar: MenubarPage,
  message: MessagePage,
  "message-scroller": MessageScrollerPage,
  "native-select": NativeSelectPage,
  "navigation-menu": NavigationMenuPage,
  pagination: PaginationPage,
  questionnaire: QuestionnairePage,
  "radio-group": RadioGroupPage,
  resizable: ResizablePage,
  separator: SeparatorPage,
  sheet: SheetPage,
  sidebar: SidebarPage,
  skeleton: SkeletonPage,
  spinner: SpinnerPage,
  table: TablePage,
  "toggle-group": ToggleGroupPage,
  trace: TracePage,
  typography: TypographyPage,
};
