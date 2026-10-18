import type { JSX } from "react";
import { AccordionPage } from "../AccordionPage";
import { CalendarPage } from "../CalendarPage";
import { FeedbackPage } from "../FeedbackPage";
import { AttachmentPage, BubblePage, MarkerPage, MessagePage } from "./chat";
import { MessageScrollerPage, QuestionnairePage, TracePage } from "./agent";
import { CheckboxPage, KbdPage, LabelPage, RadioGroupPage, SeparatorPage, SpinnerPage } from "./basics";
import { CarouselPage, DirectionPage, ResizablePage, SidebarPage } from "./display";
import { AlertPage, EmptyPage, PaginationPage, TypographyPage } from "./feedback";
import { ComboboxPage, FieldPage, FormPage, InputGroupPage, InputOTPPage, NativeSelectPage } from "./form";
import { AspectRatioPage, AvatarPage, ButtonGroupPage, ItemPage, TablePage, ToggleGroupPage, TogglePage } from "./layout";
import { BreadcrumbDocPage, ContextMenuPage, MenubarPage, NavigationMenuPage } from "./navigation";
import { AlertDialogPage, CommandPage, HoverCardPage, SheetPage } from "./overlay";

/**
 * 对标 shadcn 补齐的文档页, 按导航 id 查表. 与已有页面共用一页的别名 (collapsible / date-picker / skeleton) 也登记在这里.
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
  collapsible: AccordionPage,
  combobox: ComboboxPage,
  command: CommandPage,
  "context-menu": ContextMenuPage,
  "date-picker": CalendarPage,
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
  skeleton: FeedbackPage,
  spinner: SpinnerPage,
  table: TablePage,
  toggle: TogglePage,
  "toggle-group": ToggleGroupPage,
  trace: TracePage,
  typography: TypographyPage,
};
