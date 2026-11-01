"use client";

import { useId, useRef, useState, type ClipboardEvent, type JSX, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BUTTON_TYPE, STEP_BACK, TONE, UI_CLASSES } from "../constants";
import { LIVE_POLITE, TAG_CLASSES as C, TAG_SPLIT, WIDGET_CLASSES, WIDGET_ICON, WIDGET_KEY, WIDGET_MOTION, WIDGET_TEXT } from "../constants/widgets";
import { cn } from "../primitives/utils";

export interface TagInputProps {
	/** 受控标签列表. 不传时组件自己记, 初值取 defaultValue. */
	readonly value?: readonly string[];
	readonly defaultValue?: readonly string[];
	readonly onChange?: (tags: string[]) => void;
	readonly placeholder?: string;
	/** 最多几个标签, 到上限后输入框只读并给出提示. */
	readonly maxTags?: number;
	/** 允许重复标签. 默认 false, 重复的输入会留在框里并标红, 不会悄悄丢掉. */
	readonly allowDuplicates?: boolean;
	/** 自定义校验, 返回 false 的输入不建签. */
	readonly validate?: (tag: string) => boolean;
	/** 失焦时把框里剩下的文字建成标签. 默认 true. */
	readonly addOnBlur?: boolean;
	readonly disabled?: boolean;
	/** 输入框的可访问名. */
	readonly label?: string;
	readonly className?: string;
}

const DEFAULT_LABEL = "添加标签";
const REMOVE_PREFIX = "移除标签 ";

/**
 * 标签输入. 回车或逗号 (含全角) 建签, 粘贴的多行或逗号文本一次拆成多个签.
 * 键盘全流程: 输入框为空时 Backspace 删最后一个签; 光标在最前时 ArrowLeft 进入标签行,
 * 标签之间用左右方向键移动, Backspace / Delete 删除当前签, 越过最后一个回到输入框.
 * 标签进出用 AnimatePresence 做缩放淡入淡出, 增删都有屏幕阅读器播报.
 */
export function TagInput({
	value, defaultValue = [], onChange, placeholder, maxTags, allowDuplicates = false, validate, addOnBlur = true, disabled = false,
	label = DEFAULT_LABEL, className,
}: TagInputProps): JSX.Element {
	const [inner, setInner] = useState<readonly string[]>(defaultValue);
	const [draft, setDraft] = useState("");
	const [invalid, setInvalid] = useState(false);
	const [announce, setAnnounce] = useState("");
	const tags = value ?? inner;
	const field = useRef<HTMLInputElement>(null);
	const chips = useRef<Array<HTMLButtonElement | null>>([]);
	const hintId = useId();
	const full = maxTags !== undefined && tags.length >= maxTags;

	const commit = (next: string[]): void => {
		if (value === undefined) setInner(next);
		onChange?.(next);
	};

	/** 把若干候选文本并入列表, 返回没收下的那部分 (重复, 校验失败或超额), 留在框里给用户改. */
	const add = (candidates: string[]): string[] => {
		const next = [...tags];
		const left: string[] = [];
		for (const raw of candidates) {
			const tag = raw.trim();
			if (!tag) continue;
			const ok = (allowDuplicates || !next.includes(tag)) && (validate?.(tag) ?? true) && (maxTags === undefined || next.length < maxTags);
			if (ok) next.push(tag);
			else left.push(tag);
		}
		if (next.length !== tags.length) {
			commit(next);
			setAnnounce("已添加 " + next.slice(tags.length).join(WIDGET_TEXT.listJoin));
		}
		setInvalid(left.length > 0);
		return left;
	};

	const removeAt = (index: number, focusAfter: boolean): void => {
		const gone = tags[index];
		commit(tags.filter((_, at) => at !== index));
		setAnnounce("已移除 " + gone);
		if (!focusAfter) return;
		const target = index < tags.length - 1 ? index : index - 1;
		if (target >= 0) requestAnimationFrame(() => chips.current[target]?.focus());
		else field.current?.focus();
	};

	const flush = (): void => {
		const left = add([draft]);
		setDraft(left.join(WIDGET_TEXT.listJoin));
	};

	const onFieldKey = (event: KeyboardEvent<HTMLInputElement>): void => {
		const atStart = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0;
		if (event.key === WIDGET_KEY.enter || event.key === WIDGET_KEY.comma || event.key === WIDGET_KEY.commaWide) {
			if (event.nativeEvent.isComposing) return;
			event.preventDefault();
			flush();
		} else if (event.key === WIDGET_KEY.backspace && draft === "" && tags.length > 0) {
			event.preventDefault();
			removeAt(tags.length - 1, false);
		} else if (event.key === WIDGET_KEY.left && atStart && tags.length > 0) {
			event.preventDefault();
			chips.current[tags.length - 1]?.focus();
		}
	};

	const onChipKey = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
		if (event.key === WIDGET_KEY.backspace || event.key === WIDGET_KEY.delete) removeAt(index, true);
		else if (event.key === WIDGET_KEY.left) chips.current[Math.max(index - 1, 0)]?.focus();
		else if (event.key === WIDGET_KEY.right) (index + 1 < tags.length ? chips.current[index + 1] : field.current)?.focus();
		else return;
		event.preventDefault();
	};

	const onPaste = (event: ClipboardEvent<HTMLInputElement>): void => {
		const text = event.clipboardData.getData(WIDGET_TEXT.clipboard);
		if (!TAG_SPLIT.test(text)) return;
		event.preventDefault();
		const left = add((draft + text).split(TAG_SPLIT));
		setDraft(left.join(WIDGET_TEXT.listJoin));
	};

	return (
		<div className={cn(WIDGET_CLASSES.column, className)}>
			<div
				onClick={() => field.current?.focus()}
				aria-disabled={disabled || undefined}
				className={cn(
					WIDGET_CLASSES.field,
					C.box,
					C.motion,
					invalid && C.invalid,
					disabled && C.disabled,
				)}
			>
				<AnimatePresence initial={false}>
					{tags.map((tag, index) => (
						<motion.span
							key={`${tag}#${tags.slice(0, index).filter((earlier) => earlier === tag).length}`}
							layout
							initial={{ opacity: 0, scale: WIDGET_MOTION.popScale }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: WIDGET_MOTION.popScale }}
							transition={WIDGET_MOTION.spring}
							className={C.chip}
						>
							<span className={WIDGET_CLASSES.truncate}>{tag}</span>
							<button
								ref={(node) => { chips.current[index] = node; }}
								type={BUTTON_TYPE}
								aria-label={REMOVE_PREFIX + tag}
								tabIndex={STEP_BACK}
								disabled={disabled}
								onClick={(event) => { event.stopPropagation(); removeAt(index, false); field.current?.focus(); }}
								onKeyDown={(event) => onChipKey(event, index)}
								className={cn(WIDGET_CLASSES.iconButton, C.remove, WIDGET_CLASSES.focusRing)}
							>
								<span aria-hidden className={cn(WIDGET_ICON.remove, WIDGET_CLASSES.iconSm)} />
							</button>
						</motion.span>
					))}
				</AnimatePresence>
				<input
					ref={field}
					value={draft}
					disabled={disabled}
					readOnly={full}
					aria-label={label}
					aria-invalid={invalid || undefined}
					aria-describedby={hintId}
					placeholder={full ? undefined : placeholder}
					onChange={(event) => { setDraft(event.target.value); setInvalid(false); }}
					onKeyDown={onFieldKey}
					onPaste={onPaste}
					onBlur={() => addOnBlur && draft.trim() && flush()}
					className={C.input}
				/>
			</div>
			<span id={hintId} className={cn(WIDGET_CLASSES.hint, invalid && TONE.dangerFg)}>
				{invalid ? "有内容未添加: 重复, 不合规则或已到上限" : full ? `已到上限 ${maxTags} 个` : "回车或逗号添加, 可粘贴多行"}
			</span>
			<span aria-live={LIVE_POLITE} className={UI_CLASSES.srOnly}>{announce}</span>
		</div>
	);
}
