"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./utils";
import { ALIGN, ARIA, ARIA_INVALID, BUTTON_TYPE, ROLE, UI_CLASSES, isString } from "../constants";

/** 下拉候选项. keywords 参与搜索但不显示 (拼音, 别名). */
interface ComboboxOption {
	value: string;
	label: React.ReactNode;
	keywords?: string[];
	disabled?: boolean;
}

interface ComboboxBaseProps {
	options: readonly ComboboxOption[];
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: React.ReactNode;
	disabled?: boolean;
	className?: string;
	contentClassName?: string;
	"aria-invalid"?: boolean;
}

interface ComboboxSingleProps extends ComboboxBaseProps {
	multiple?: false;
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
}

interface ComboboxMultipleProps extends ComboboxBaseProps {
	multiple: true;
	value?: string[];
	defaultValue?: string[];
	onValueChange?: (value: string[]) => void;
}

type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

/** 受控与非受控两用的值: 传 value 即受控, 否则内部记忆. */
function useControllable<T>(value: T | undefined, fallback: T, onChange?: (next: T) => void): [T, (next: T) => void] {
	const [inner, setInner] = React.useState(fallback);
	const current = value === undefined ? inner : value;
	const set = React.useCallback(
		(next: T) => {
			if (value === undefined) {
				setInner(next);
			}
			onChange?.(next);
		},
		[value, onChange],
	);
	return [current, set];
}

/**
 * 可搜索下拉 (Combobox).
 *
 * Popover + Command 组合: 触发器长得像 SelectTrigger, 展开后输入即过滤.
 * 单选时再点已选项会取消; multiple 时选中项以小标签显示在触发器里, 面板保持打开.
 * 选项超过一屏或需要按关键词找时用它, 十来个固定选项用 Select 就够.
 */
function Combobox(props: ComboboxProps): React.JSX.Element {
	const invalid = props[ARIA_INVALID];
	const { options, placeholder = "请选择", searchPlaceholder = "搜索...", emptyText = "没有匹配项", disabled, className, contentClassName } = props;
	const [open, setOpen] = React.useState(false);
	const toList = (value: string | string[] | undefined): string[] | undefined =>
		value === undefined ? undefined : Array.isArray(value) ? value : value ? [value] : [];
	const [selected, setSelected] = useControllable<string[]>(toList(props.value), toList(props.defaultValue) ?? [], (next) => {
		if (props.multiple === true) {
			props.onValueChange?.(next);
		} else {
			(props as ComboboxSingleProps).onValueChange?.(next[0] ?? "");
		}
	});
	const labelOf = (value: string): React.ReactNode => options.find((option) => option.value === value)?.label ?? value;

	const toggle = (value: string): void => {
		if (props.multiple) {
			setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
			return;
		}
		setSelected(selected[0] === value ? [] : [value]);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild disabled={disabled}>
				<button
					type={BUTTON_TYPE}
					role={ROLE.combobox}
					aria-expanded={open}
					aria-invalid={invalid}
					data-slot="combobox-trigger"
					className={cn(
						"flex min-h-8 w-56 items-center justify-between gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-left text-[12px] font-medium text-foreground outline-none",
						"transition-colors duration-(--duration-fast) hover:bg-accent focus-visible:border-primary/50 data-[state=open]:bg-accent",
						"disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
						className,
					)}
				>
					<span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
						{selected.length === 0 && <span className="truncate text-muted-foreground">{placeholder}</span>}
						{!props.multiple && selected[0] !== undefined && <span className={UI_CLASSES.truncate}>{labelOf(selected[0])}</span>}
						{props.multiple &&
							selected.map((value) => (
								<span
									key={value}
									data-slot="combobox-chip"
									className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-secondary px-1.5 py-px text-[11px] animate-in fade-in-0 zoom-in-95 duration-(--duration-fast)"
								>
									{labelOf(value)}
									<XIcon
										aria-hidden={ARIA.true}
										className="size-3 text-muted-foreground hover:text-foreground"
										onPointerDown={(event) => {
											event.preventDefault();
											event.stopPropagation();
											toggle(value);
										}}
									/>
								</span>
							))}
					</span>
					<ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
				</button>
			</PopoverTrigger>
			<PopoverContent className={cn("w-(--radix-popover-trigger-width) min-w-56 p-0", contentClassName)} align={ALIGN.start}>
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyText}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									keywords={[isString(option.label) ? option.label : option.value, ...(option.keywords ?? [])]}
									disabled={option.disabled}
									onSelect={() => toggle(option.value)}
								>
									<span className={UI_CLASSES.truncate}>{option.label}</span>
									<CheckIcon
										className={cn(
											"size-3.5 text-link transition-opacity duration-(--duration-fast)",
											selected.includes(option.value) ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export { Combobox, type ComboboxMultipleProps, type ComboboxOption, type ComboboxProps, type ComboboxSingleProps };
