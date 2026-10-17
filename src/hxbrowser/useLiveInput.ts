/**
 * 聚焦视图画面上的鼠标 / 滚轮 / 键盘 / 粘贴 -> 预览协议消息.
 * 画面必须等比无留白显示 (w-full h-auto), 服务端只按宽度比换算坐标.
 */

import { useEffect, useRef } from "react";
import { buttonName, HeldInputs, keyMessage, mouseMessage } from "./core/input";
import { CLIPBOARD_TEXT, DOM_EVENT, PASTE_KEY } from "../constants/hxbrowser";
import { KEY_ACTION, LIVE_MSG, type LiveClientMessage, MOUSE_ACTION } from "./core/protocol";

type Send = (msg: LiveClientMessage) => boolean;

const { mousedown: MOUSEDOWN, mouseup: MOUSEUP, mousemove: MOUSEMOVE, keydown: KEYDOWN, keyup: KEYUP, blur: BLUR } = DOM_EVENT;

/**
 * 把输入监听挂到画面元素上. wheel 用非 passive 原生监听才能 preventDefault.
 * 鼠标按下后在 window 上接管 move/up: 拖出画面松开也会转发 up (坐标由服务端夹回页面).
 * 键盘只在 captureKeys 且画面有焦点时转发; 失焦, 关闭捕获, 卸载时为仍按着的键补发 keyUp.
 */
export function useLiveInput(surface: HTMLElement | null, send: Send, captureKeys: boolean): void {
	const held = useRef(new HeldInputs());
	const raf = useRef(0);

	useEffect(() => {
		if (!surface) return undefined;
		const h = held.current;
		const rect = () => surface.getBoundingClientRect();
		const flush = () => {
			for (const m of h.releaseAll(rect())) send(m);
			window.removeEventListener(MOUSEUP, onUp, true);
			window.removeEventListener(MOUSEMOVE, onWindowMove, true);
		};

		const onWindowBlur = () => flush();

		let lastMove: MouseEvent | null = null;
		const onMove = (e: MouseEvent) => {
			h.movePointer(e);
			lastMove = e;
			if (raf.current) return;
			// move 每帧最多发一次: 原生 mousemove 可达 100+Hz, 全转发会塞满 CDP 通道
			raf.current = window.requestAnimationFrame(() => {
				raf.current = 0;
				const move = lastMove;
				lastMove = null;
				if (!move) return;
				const pressed = h.pressedButton;
				send(mouseMessage(MOUSE_ACTION.move, rect(), move, { pressed: pressed !== null, button: pressed ?? undefined }));
			});
		};
		const onWindowMove = (e: MouseEvent) => {
			if (e.target !== surface && !surface.contains(e.target as Node)) onMove(e);
		};
		const onUp = (e: MouseEvent) => {
			const button = h.releaseButton(buttonName(e.button));
			if (button !== null) send(mouseMessage(MOUSE_ACTION.up, rect(), e, { button, clickCount: e.detail || 1 }));
			if (h.pressedButton === null) {
				window.removeEventListener(MOUSEUP, onUp, true);
				window.removeEventListener(MOUSEMOVE, onWindowMove, true);
			}
		};
		const onDown = (e: MouseEvent) => {
			e.preventDefault();
			surface.focus();
			const button = buttonName(e.button);
			if (!send(mouseMessage(MOUSE_ACTION.down, rect(), e, { button, clickCount: e.detail || 1 }))) return;
			h.pressButton(button, e);
			window.addEventListener(MOUSEUP, onUp, true);
			window.addEventListener(MOUSEMOVE, onWindowMove, true);
		};
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			send(mouseMessage(MOUSE_ACTION.wheel, rect(), e, { deltaX: e.deltaX, deltaY: e.deltaY }));
		};
		const onContext = (e: Event) => e.preventDefault();

		surface.addEventListener(MOUSEDOWN, onDown);
		surface.addEventListener(MOUSEMOVE, onMove);
		surface.addEventListener(DOM_EVENT.wheel, onWheel, { passive: false });
		surface.addEventListener(DOM_EVENT.contextmenu, onContext);
		window.addEventListener(BLUR, onWindowBlur);
		return () => {
			surface.removeEventListener(MOUSEDOWN, onDown);
			surface.removeEventListener(MOUSEMOVE, onMove);
			surface.removeEventListener(DOM_EVENT.wheel, onWheel);
			surface.removeEventListener(DOM_EVENT.contextmenu, onContext);
			window.removeEventListener(BLUR, onWindowBlur);
			window.removeEventListener(MOUSEUP, onUp, true);
			window.removeEventListener(MOUSEMOVE, onWindowMove, true);
			if (raf.current) window.cancelAnimationFrame(raf.current);
			raf.current = 0;
			flush();
		};
	}, [surface, send]);

	useEffect(() => {
		if (!surface || !captureKeys) return undefined;
		const h = held.current;
		const releaseKeys = () => {
			for (const m of h.releaseAll(null)) send(m);
		};
		const onDown = (e: KeyboardEvent) => {
			if (e.isComposing) return;
			// Ctrl/Cmd+V 放给本地粘贴: 转发成按键的话远端读的是远端自己的剪贴板
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === PASTE_KEY) return;
			e.preventDefault();
			if (send(keyMessage(KEY_ACTION.down, e))) h.pressKey(e);
		};
		const onUp = (e: KeyboardEvent) => {
			if (!h.releaseKey(e)) return;
			e.preventDefault();
			send(keyMessage(KEY_ACTION.up, e));
		};
		const onPaste = (e: ClipboardEvent) => {
			const text = e.clipboardData?.getData(CLIPBOARD_TEXT) ?? "";
			if (text === "") return;
			e.preventDefault();
			send({ type: LIVE_MSG.text, text });
		};
		surface.addEventListener(KEYDOWN, onDown);
		surface.addEventListener(KEYUP, onUp);
		surface.addEventListener(DOM_EVENT.paste, onPaste);
		surface.addEventListener(BLUR, releaseKeys);
		window.addEventListener(BLUR, releaseKeys);
		return () => {
			surface.removeEventListener(KEYDOWN, onDown);
			surface.removeEventListener(KEYUP, onUp);
			surface.removeEventListener(DOM_EVENT.paste, onPaste);
			surface.removeEventListener(BLUR, releaseKeys);
			window.removeEventListener(BLUR, releaseKeys);
			releaseKeys();
		};
	}, [surface, send, captureKeys]);
}
