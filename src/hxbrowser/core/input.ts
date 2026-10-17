/**
 * 本机输入事件 -> 预览协议消息的纯函数, 以及按下态的记账.
 * 远端浏览器只认它收到的事件: 本机丢掉的释放事件必须由这里补发, 否则远端会一直按着.
 */

import {
	KEY_ACTION,
	LIVE_MSG,
	type LiveKeyMessage,
	type LiveMouseMessage,
	MOUSE_ACTION,
	MOUSE_BUTTONS,
	type MouseAction,
	type MouseButtonName,
} from "./protocol";

export interface ModifierState {
	altKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}

export interface SurfaceRect {
	left: number;
	top: number;
	width: number;
}

export interface PointerSample extends ModifierState {
	clientX: number;
	clientY: number;
}

export interface KeySample extends ModifierState {
	key: string;
	code: string;
	keyCode: number;
}

export function modifiers(e: ModifierState): Pick<LiveMouseMessage, "alt" | "ctrl" | "meta" | "shift"> {
	return { alt: e.altKey, ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey };
}

/** DOM MouseEvent.button (0/1/2) -> 协议按钮名; 其他键 (前进/后退侧键) 按左键处理. */
export function buttonName(button: number): MouseButtonName {
	return MOUSE_BUTTONS[button] ?? MOUSE_BUTTONS[0];
}

/** 坐标只给图像内像素和图像显示宽度; 换算到页面 CSS 像素与越界夹回都在服务端. */
export function mouseMessage(
	action: MouseAction,
	rect: SurfaceRect,
	e: PointerSample,
	extra: Partial<LiveMouseMessage> = {},
): LiveMouseMessage {
	return {
		type: LIVE_MSG.mouse,
		action,
		x: e.clientX - rect.left,
		y: e.clientY - rect.top,
		clientWidth: rect.width,
		...modifiers(e),
		...extra,
	};
}

export function keyMessage(action: LiveKeyMessage["action"], e: KeySample): LiveKeyMessage {
	return { type: LIVE_MSG.key, action, key: e.key, code: e.code, keyCode: e.keyCode, ...modifiers(e) };
}

const NO_MODIFIERS: ModifierState = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

/**
 * 已转发给远端但还没转发释放的鼠标按钮与按键.
 * 拖出画面后松开, 焦点移走后松开, 关闭键盘捕获, 组件卸载: 这些路径上本机收不到
 * 对应的释放事件, 由 releaseAll 一次补齐.
 */
export class HeldInputs {
	private button: MouseButtonName | null = null;
	private lastPointer: PointerSample | null = null;
	private readonly keys = new Map<string, KeySample>();

	get pressedButton(): MouseButtonName | null {
		return this.button;
	}

	get heldKeyCount(): number {
		return this.keys.size;
	}

	pressButton(button: MouseButtonName, at: PointerSample): void {
		this.button = button;
		this.lastPointer = at;
	}

	movePointer(at: PointerSample): void {
		this.lastPointer = at;
	}

	/** 释放鼠标; 返回被释放的按钮 (之前没有按下则为 null, 调用方不发 up). */
	releaseButton(): MouseButtonName | null {
		const b = this.button;
		this.button = null;
		return b;
	}

	pressKey(k: KeySample): void {
		this.keys.set(k.code || k.key, k);
	}

	/** 返回 true 表示这个键之前确实按下并转发过, 应当转发释放. */
	releaseKey(k: KeySample): boolean {
		return this.keys.delete(k.code || k.key);
	}

	/** 为所有仍按着的输入生成释放消息, 并清空记账. rect 为空时只补按键, 鼠标按下态保留. */
	releaseAll(rect: SurfaceRect | null): Array<LiveMouseMessage | LiveKeyMessage> {
		const out: Array<LiveMouseMessage | LiveKeyMessage> = [];
		const button = rect === null ? null : this.releaseButton();
		if (button !== null && rect !== null && this.lastPointer !== null) {
			out.push(
				mouseMessage(MOUSE_ACTION.up, rect, { ...this.lastPointer, ...NO_MODIFIERS }, { button, clickCount: 1 }),
			);
		}
		for (const k of this.keys.values()) {
			out.push(keyMessage(KEY_ACTION.up, { ...k, ...NO_MODIFIERS }));
		}
		this.keys.clear();
		return out;
	}
}
