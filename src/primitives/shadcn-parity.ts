/**
 * 对标 shadcn/ui 补齐的基础件出口: 表单, 弹层, 导航, 菜单, 布局与排版, 由 src/index.ts 整体导出.
 */
export { Label } from "./label";
export { AspectRatio } from "./aspect-ratio";
export { DirectionProvider, useDirection } from "./direction";
export {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, avatarVariants,
} from "./avatar";
export { Toggle, toggleVariants } from "./toggle";
export { ToggleGroup, ToggleGroupItem } from "./toggle-group";
export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants } from "./button-group";
export {
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText,
  InputGroupTextarea, inputGroupAddonVariants,
} from "./input-group";
export { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "./native-select";
export {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader,
  SheetOverlay, SheetPortal, SheetTitle, SheetTrigger, type SheetSide,
} from "./sheet";
export {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogPortal,
  AlertDialogTitle, AlertDialogTrigger,
} from "./alert-dialog";
export { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
export {
  Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "./breadcrumb";
/** 组合式右键菜单: 根组件叫 ContextMenuRoot, 声明式的 ContextMenu 仍从版式件导出. */
export {
  ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel,
  ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuRoot, ContextMenuSeparator,
  ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from "./context-menu";
export {
  Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarItem, MenubarLabel, MenubarMenu,
  MenubarPortal, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub,
  MenubarSubContent, MenubarSubTrigger, MenubarTrigger,
} from "./menubar";
export {
  NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink,
  NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport, navigationMenuTriggerStyle,
} from "./navigation-menu";
export {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
  CommandSeparator, CommandShortcut,
} from "./command";
export {
  Combobox, type ComboboxMultipleProps, type ComboboxOption, type ComboboxProps, type ComboboxSingleProps,
} from "./combobox";
export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "./input-otp";
export { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";
export {
  Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious,
  useCarousel, type CarouselApi,
} from "./carousel";
export {
  Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader,
  ItemMedia, ItemSeparator, ItemTitle, itemVariants,
} from "./item";
export {
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend,
  FieldSeparator, FieldSet, FieldTitle,
} from "./field";
export {
  Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "./table";
export {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField,
} from "./form";
export {
  TypographyBlockquote, TypographyH1, TypographyH2, TypographyH3, TypographyH4, TypographyInlineCode,
  TypographyLarge, TypographyLead, TypographyList, TypographyMuted, TypographyP, TypographySmall,
} from "./typography";
export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty";
export { Spinner } from "./spinner";
/** 组合式应用侧栏: 与 SidebarNavItemButton / CollapsibleRail / AppFrame 并存. */
export {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInput, SidebarInset,
  SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useIsMobile, useSidebar,
} from "./sidebar";
export {
  SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu,
  SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, sidebarMenuButtonVariants,
} from "./sidebar-menu";
