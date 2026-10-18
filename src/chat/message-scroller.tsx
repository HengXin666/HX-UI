"use client";

import * as React from "react";
import { ArrowDownIcon } from "lucide-react";
import { ALIGN, SCROLL_BEHAVIOR, STICK_TOLERANCE, VARIANT } from "../constants";
import { Button } from "../primitives/button";
import { prefersReducedMotion } from "../primitives/motion";
import { cn } from "../primitives/utils";

interface MessageScrollerContextValue {
	/** 视口当前是否贴在底部. */
	atBottom: boolean;
	/** 滚到底部; smooth 为 false 时直接跳. */
	scrollToBottom: (smooth?: boolean) => void;
	/** 滚到指定 id 的消息 (MessageScrollerItem 的 id). */
	scrollToItem: (id: string) => void;
	viewportRef: React.RefObject<HTMLDivElement | null>;
}

const MessageScrollerContext = React.createContext<MessageScrollerContextValue | null>(null);

/** 读滚动状态与跳转函数. 必须在 MessageScroller 内调用. */
function useMessageScroller(): MessageScrollerContextValue {
	const context = React.useContext(MessageScrollerContext);
	if (!context) {
		throw new Error("useMessageScroller 必须在 <MessageScroller> 内使用");
	}
	return context;
}

/** 系统要求减弱动效时一律直接跳转, 不做平滑滚动. */
function scrollBehavior(smooth: boolean): ScrollBehavior {
	return smooth && !prefersReducedMotion() ? SCROLL_BEHAVIOR.smooth : SCROLL_BEHAVIOR.instant;
}

/**
 * 会话滚动容器 (对标 shadcn MessageScroller).
 *
 * 贴底跟随: 用户停在底部时, 新消息或流式增长的内容会把视口一直带到底;
 * 用户往上翻看历史时不再跟随, 并出现 "回到最新" 按钮. 在顶部插入历史消息时
 * 保持当前可见内容不跳动 (按插入前后的滚动高度差补偿). 打开已有会话时直接定位到底部.
 */
function MessageScroller({
	className,
	children,
	...props
}: React.ComponentProps<"div">): React.JSX.Element {
	const viewportRef = React.useRef<HTMLDivElement | null>(null);
	const [atBottom, setAtBottom] = React.useState(true);
	const stickRef = React.useRef(true);
	const heightRef = React.useRef(0);

	const scrollToBottom = React.useCallback((smooth = true) => {
		const viewport = viewportRef.current;
		if (viewport) {
			viewport.scrollTo({ top: viewport.scrollHeight, behavior: scrollBehavior(smooth) });
		}
	}, []);

	const scrollToItem = React.useCallback((id: string) => {
		const target = viewportRef.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(id)}"]`);
		target?.scrollIntoView({ block: ALIGN.center, behavior: scrollBehavior(true) });
	}, []);

	React.useLayoutEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		viewport.scrollTop = viewport.scrollHeight;
		heightRef.current = viewport.scrollHeight;
		const content = viewport.firstElementChild;
		if (!content) {
			return;
		}
		const observer = new ResizeObserver(() => {
			const grownAtTop = viewport.scrollTop < STICK_TOLERANCE && viewport.scrollHeight > heightRef.current && !stickRef.current;
			if (stickRef.current) {
				viewport.scrollTop = viewport.scrollHeight;
			} else if (grownAtTop) {
				viewport.scrollTop += viewport.scrollHeight - heightRef.current;
			}
			heightRef.current = viewport.scrollHeight;
		});
		observer.observe(content);
		return () => observer.disconnect();
	}, []);

	const onScroll = (): void => {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		const bottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= STICK_TOLERANCE;
		stickRef.current = bottom;
		setAtBottom(bottom);
	};

	const value = React.useMemo(() => ({ atBottom, scrollToBottom, scrollToItem, viewportRef }), [atBottom, scrollToBottom, scrollToItem]);

	return (
		<MessageScrollerContext.Provider value={value}>
			<div data-slot="message-scroller" className={cn("relative flex min-h-0 flex-col", className)} {...props}>
				<div ref={viewportRef} onScroll={onScroll} data-slot="message-scroller-viewport" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
					{children}
				</div>
			</div>
		</MessageScrollerContext.Provider>
	);
}

function MessageScrollerContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="message-scroller-content" className={cn("flex flex-col gap-4 p-4", className)} {...props} />;
}

/** 一条可被 scrollToItem 定位的消息. messageId 写到 data-message-id. */
function MessageScrollerItem({
	messageId,
	className,
	...props
}: React.ComponentProps<"div"> & { messageId: string }): React.JSX.Element {
	return <div data-slot="message-scroller-item" data-message-id={messageId} className={cn("scroll-mt-4", className)} {...props} />;
}

/** "回到最新" 浮动按钮: 只在用户离开底部时出现, 进出带缩放淡入. */
function MessageScrollerButton({ className, children, ...props }: React.ComponentProps<typeof Button>): React.JSX.Element | null {
	const { atBottom, scrollToBottom } = useMessageScroller();
	if (atBottom) {
		return null;
	}
	return (
		<Button
			data-slot="message-scroller-button"
			variant={VARIANT.default}
			size={VARIANT.sm}
			className={cn(
				"absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-md",
				"animate-in fade-in-0 zoom-in-90 slide-in-from-bottom-2 duration-(--duration-base)",
				className,
			)}
			onClick={() => scrollToBottom(true)}
			{...props}
		>
			{children ?? (
				<>
					<ArrowDownIcon />
					回到最新
				</>
			)}
		</Button>
	);
}

export { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, useMessageScroller };
