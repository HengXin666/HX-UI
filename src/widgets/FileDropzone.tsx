"use client";

import { useEffect, useId, useRef, useState, type DragEvent, type JSX, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ARIA, BUTTON_TYPE, CLASSES, SPACE, UI_CLASSES } from "../constants";
import {
	DROPZONE_CLASSES as C, FILE_INPUT_TYPE, IMAGE_MIME_PREFIX, LIVE_POLITE, REJECT_REASON, TONE_CLASSES, WIDGET_CLASSES, WIDGET_ICON, WIDGET_MOTION,
	WIDGET_TEXT, formatBytes, matchesAccept, type RejectReason,
} from "../constants/widgets";
import { cn } from "../primitives/utils";

/** 一条被拒收的文件与原因. */
export interface FileRejection {
	readonly file: File;
	readonly reason: RejectReason;
	readonly message: string;
}

export interface FileDropzoneProps {
	/** 与 input 的 accept 同语法: ".png,image/*,application/pdf". 拖入与选择都按它校验. */
	readonly accept?: string;
	/** 单个文件的体积上限 (字节). */
	readonly maxSize?: number;
	/** 列表最多容纳的文件数. 不传不限. */
	readonly maxFiles?: number;
	/** 允许一次选多个. 默认 true. */
	readonly multiple?: boolean;
	readonly disabled?: boolean;
	/** 收下的文件列表变化 (新增或移除) 时回调, 参数是完整列表. */
	readonly onFilesChange?: (files: File[]) => void;
	/** 有文件被拒收时回调. 组件自己也会把原因显示在投放区下方. */
	readonly onReject?: (rejections: FileRejection[]) => void;
	/** 投放区主文案. */
	readonly title?: ReactNode;
	/** 投放区副文案, 默认根据 accept 与 maxSize 生成. */
	readonly hint?: ReactNode;
	readonly className?: string;
}

interface Entry {
	readonly key: string;
	readonly file: File;
	readonly preview?: string;
}

const DEFAULT_TITLE = "拖入文件, 或点击选择";
const REMOVE_LABEL = "移除 ";

/** 把拒收原因写成人话. 不只说 "失败", 要说清楚为什么, 用户才知道该换哪个文件. */
function describe(reason: RejectReason, accept?: string, maxSize?: number, maxFiles?: number): string {
	if (reason === REJECT_REASON.type) return "类型不在允许范围" + WIDGET_TEXT.open + (accept ?? "") + WIDGET_TEXT.close;
	if (reason === REJECT_REASON.size) return "超过单个文件上限 " + formatBytes(maxSize ?? 0);
	return "超出数量上限 " + String(maxFiles ?? 0) + " 个";
}

/**
 * 拖放上传区. 只负责收集与校验, 不负责上传: 收下的文件经 onFilesChange 交给调用方.
 * 投放区本身是一个 button, Tab 聚焦后 Enter / Space 打开系统文件选择框, 键盘与拖放走同一套校验.
 * 被拒收的文件逐条列在 role="alert" 区里, 失败不会被静默吞掉.
 */
export function FileDropzone({
	accept, maxSize, maxFiles, multiple = true, disabled = false, onFilesChange, onReject, title = DEFAULT_TITLE, hint, className,
}: FileDropzoneProps): JSX.Element {
	const [entries, setEntries] = useState<Entry[]>([]);
	const [errors, setErrors] = useState<FileRejection[]>([]);
	const [isDragging, setDragging] = useState(false);
	const depth = useRef(0);
	const input = useRef<HTMLInputElement>(null);
	const zone = useRef<HTMLButtonElement>(null);
	const hintId = useId();
	const errorId = useId();
	const entriesRef = useRef(entries);
	entriesRef.current = entries;

	useEffect(() => () => entriesRef.current.forEach((entry) => entry.preview && URL.revokeObjectURL(entry.preview)), []);

	const take = (list: FileList | null): void => {
		if (!list || disabled) return;
		const accepted: Entry[] = [];
		const rejected: FileRejection[] = [];
		const limit = multiple ? maxFiles : 1;
		const room = limit === undefined ? Infinity : multiple ? limit - entries.length : limit;
		for (const file of Array.from(list)) {
			let reason: RejectReason | undefined;
			if (!matchesAccept(file, accept)) reason = REJECT_REASON.type;
			else if (maxSize !== undefined && file.size > maxSize) reason = REJECT_REASON.size;
			else if (accepted.length >= room) reason = REJECT_REASON.count;
			if (reason) {
				rejected.push({ file, reason, message: describe(reason, accept, maxSize, limit) });
				continue;
			}
			const preview = file.type.startsWith(IMAGE_MIME_PREFIX) ? URL.createObjectURL(file) : undefined;
			accepted.push({ key: `${file.name}:${file.size}:${file.lastModified}:${Math.random()}`, file, preview });
		}
		setErrors(rejected);
		if (rejected.length > 0) onReject?.(rejected);
		if (accepted.length > 0) {
			const next = multiple ? [...entries, ...accepted] : accepted;
			if (!multiple) entries.forEach((entry) => entry.preview && URL.revokeObjectURL(entry.preview));
			setEntries(next);
			onFilesChange?.(next.map((entry) => entry.file));
		}
	};

	const remove = (key: string): void => {
		const gone = entries.find((entry) => entry.key === key);
		if (gone?.preview) URL.revokeObjectURL(gone.preview);
		const next = entries.filter((entry) => entry.key !== key);
		setEntries(next);
		onFilesChange?.(next.map((entry) => entry.file));
		zone.current?.focus();
	};

	const onDragEnter = (event: DragEvent): void => {
		event.preventDefault();
		depth.current += 1;
		if (!disabled) setDragging(true);
	};
	const onDragLeave = (event: DragEvent): void => {
		event.preventDefault();
		depth.current = Math.max(depth.current - 1, 0);
		if (depth.current === 0) setDragging(false);
	};
	const onDrop = (event: DragEvent): void => {
		event.preventDefault();
		depth.current = 0;
		setDragging(false);
		take(event.dataTransfer.files);
	};

	const autoHint = [accept && "支持 " + accept, maxSize !== undefined && "单个不超过 " + formatBytes(maxSize)].filter(Boolean).join(WIDGET_TEXT.listJoin);

	return (
		<div className={cn(CLASSES.stack, className)}>
			<button
				ref={zone}
				type={BUTTON_TYPE}
				disabled={disabled}
				data-dragging={isDragging || undefined}
				aria-describedby={errors.length > 0 ? hintId + SPACE + errorId : hintId}
				aria-invalid={errors.length > 0 || undefined}
				onClick={() => input.current?.click()}
				onDragEnter={onDragEnter}
				onDragOver={(event) => event.preventDefault()}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				className={cn(
					WIDGET_CLASSES.field,
					WIDGET_CLASSES.focusRing,
					C.zone,
					C.motion,
					C.states,
					C.dragging,
					errors.length > 0 && C.invalid,
				)}
			>
				<span aria-hidden className={cn(WIDGET_ICON.upload, C.glyph, isDragging ? TONE_CLASSES.primary.text : WIDGET_CLASSES.muted)} />
				<span className={C.title}>{isDragging ? "松手即可添加" : title}</span>
				<span id={hintId} className={WIDGET_CLASSES.hint}>{hint ?? autoHint}</span>
			</button>
			<input ref={input} type={FILE_INPUT_TYPE} hidden accept={accept} multiple={multiple} disabled={disabled}
				onChange={(event) => { take(event.target.files); event.target.value = ""; }} />
			{errors.length > 0 && (
				<ul id={errorId} role={ARIA.alert} className={C.errors}>
					{errors.map(({ file, message }, index) => (
						<li key={`${file.name}-${index}`} className={C.error}>
							<span aria-hidden className={cn(WIDGET_ICON.error, WIDGET_CLASSES.iconSm, C.errorIcon)} />
							<span className={C.errorText}><b className={WIDGET_CLASSES.strong}>{file.name}</b>: {message}</span>
						</li>
					))}
				</ul>
			)}
			<ul className={WIDGET_CLASSES.list} aria-label="已选文件">
				<AnimatePresence initial={false}>
					{entries.map(({ key, file, preview }) => (
						<motion.li key={key} layout initial={{ opacity: 0, y: -WIDGET_MOTION.rise }} animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: WIDGET_MOTION.popScale }} transition={WIDGET_MOTION.spring}
							className={cn(WIDGET_CLASSES.field, C.file)}>
							{preview ? (
								<img src={preview} alt="" className={C.thumb} />
							) : (
								<span aria-hidden className={C.placeholder}>
									<span className={cn(WIDGET_ICON.file, WIDGET_CLASSES.icon, WIDGET_CLASSES.muted)} />
								</span>
							)}
							<span className={WIDGET_CLASSES.grow}>
								<span className={C.name}>{file.name}</span>
								<span className={cn(WIDGET_CLASSES.hint, WIDGET_CLASSES.nums)}>{formatBytes(file.size)}</span>
							</span>
							<button type={BUTTON_TYPE} aria-label={REMOVE_LABEL + file.name} onClick={() => remove(key)}
								className={cn(WIDGET_CLASSES.iconButton, C.remove, WIDGET_CLASSES.focusRing)}>
								<span aria-hidden className={cn(WIDGET_ICON.remove, WIDGET_CLASSES.icon)} />
							</button>
						</motion.li>
					))}
				</AnimatePresence>
			</ul>
			<span aria-live={LIVE_POLITE} className={UI_CLASSES.srOnly}>
				{entries.length > 0 ? `已选 ${entries.length} 个文件` : ""}
			</span>
		</div>
	);
}
