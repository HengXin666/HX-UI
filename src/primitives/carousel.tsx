"use client";

import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "./button";
import { prefersReducedMotion } from "./motion";
import { cn, isEditableTarget } from "./utils";
import { ARROW_KEY, BUTTON_TYPE, EMBLA_AXIS, EVENT, ORIENTATION, ROLE, TONE_VARIANT, UI_CLASSES, VARIANT } from "../constants";

type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];
type CarouselPlugin = Parameters<typeof useEmblaCarousel>[1];

interface CarouselProps {
	opts?: CarouselOptions;
	plugins?: CarouselPlugin;
	orientation?: "horizontal" | "vertical";
	setApi?: (api: CarouselApi) => void;
}

interface CarouselContextValue extends CarouselProps {
	carouselRef: ReturnType<typeof useEmblaCarousel>[0];
	api: CarouselApi;
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: boolean;
	canScrollNext: boolean;
	selectedIndex: number;
	snapCount: number;
	scrollTo: (index: number) => void;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

/** 取最近的 Carousel 上下文; 在 Carousel 外调用会抛错, 便于尽早发现组合写错. */
function useCarousel(): CarouselContextValue {
	const context = React.useContext(CarouselContext);
	if (!context) {
		throw new Error("useCarousel 必须在 <Carousel /> 内使用");
	}
	return context;
}

/**
 * 轮播 (embla-carousel).
 *
 * 拖拽 / 触控滑动带惯性, 左右方向键切换; 方向键在冒泡阶段处理, 内部控件先 preventDefault 就不再翻页;
 * 系统要求减弱动效时 embla 的 duration 置 0, 直接跳转.
 * 结构: Carousel > CarouselContent > CarouselItem, 加上 CarouselPrevious / CarouselNext / CarouselDots.
 */
function Carousel({
	orientation = ORIENTATION.horizontal,
	opts,
	setApi,
	plugins,
	className,
	children,
	...props
}: React.ComponentProps<"div"> & CarouselProps): React.JSX.Element {
	const horizontal = orientation === ORIENTATION.horizontal;
	const [carouselRef, api] = useEmblaCarousel(
		{ ...opts, axis: horizontal ? EMBLA_AXIS.x : EMBLA_AXIS.y, ...(prefersReducedMotion() ? { duration: 0 } : {}) },
		plugins,
	);
	const [canScrollPrev, setCanScrollPrev] = React.useState(false);
	const [canScrollNext, setCanScrollNext] = React.useState(false);
	const [selectedIndex, setSelectedIndex] = React.useState(0);
	const [snapCount, setSnapCount] = React.useState(0);

	const onSelect = React.useCallback((current: CarouselApi) => {
		if (!current) {
			return;
		}
		setCanScrollPrev(current.canScrollPrev());
		setCanScrollNext(current.canScrollNext());
		setSelectedIndex(current.selectedScrollSnap());
		setSnapCount(current.scrollSnapList().length);
	}, []);

	const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
	const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);
	const scrollTo = React.useCallback((index: number) => api?.scrollTo(index), [api]);

	const handleKeyDown = React.useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.defaultPrevented || isEditableTarget(event.target)) {
				return;
			}
			if (event.key === ARROW_KEY.left) {
				event.preventDefault();
				scrollPrev();
			} else if (event.key === ARROW_KEY.right) {
				event.preventDefault();
				scrollNext();
			}
		},
		[scrollPrev, scrollNext],
	);

	React.useEffect(() => {
		if (api && setApi) {
			setApi(api);
		}
	}, [api, setApi]);

	React.useEffect(() => {
		if (!api) {
			return;
		}
		onSelect(api);
		api.on(EVENT.reInit, onSelect);
		api.on(EVENT.select, onSelect);
		return () => {
			api.off(EVENT.select, onSelect);
			api.off(EVENT.reInit, onSelect);
		};
	}, [api, onSelect]);

	return (
		<CarouselContext.Provider
			value={{
				carouselRef, api, opts, orientation, scrollPrev, scrollNext, canScrollPrev, canScrollNext,
				selectedIndex, snapCount, scrollTo,
			}}
		>
			<div
				onKeyDown={handleKeyDown}
				className={cn(UI_CLASSES.relative, className)}
				role={ROLE.region}
				aria-roledescription="carousel"
				data-slot="carousel"
				{...props}
			>
				{children}
			</div>
		</CarouselContext.Provider>
	);
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	const { carouselRef, orientation } = useCarousel();
	return (
		<div ref={carouselRef} className="min-w-0 overflow-hidden" data-slot="carousel-content">
			<div data-orientation={orientation} className={cn("flex -ml-4 data-[orientation=vertical]:-mt-4 data-[orientation=vertical]:ml-0 data-[orientation=vertical]:flex-col", className)} {...props} />
		</div>
	);
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	const { orientation } = useCarousel();
	return (
		<div
			role={ROLE.group}
			aria-roledescription={ROLE.slide}
			data-slot="carousel-item"
			data-orientation={orientation}
			className={cn("min-w-0 shrink-0 grow-0 basis-full pl-4 data-[orientation=vertical]:pt-4 data-[orientation=vertical]:pl-0", className)}
			{...props}
		/>
	);
}

/** 上一张 / 下一张的共用实现: type 固定为 button, 调用方 onClick 先执行, 未 preventDefault 时再翻页. */
function CarouselArrow({
	previous = false,
	className,
	variant = TONE_VARIANT.outline,
	size = VARIANT.iconSm,
	onClick,
	...props
}: React.ComponentProps<typeof Button> & { previous?: boolean }): React.JSX.Element {
	const { orientation, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();
	const horizontal = orientation === ORIENTATION.horizontal;
	const placement = previous
		? horizontal ? "top-1/2 -left-10 -translate-y-1/2" : "-top-10 left-1/2 -translate-x-1/2 rotate-90"
		: horizontal ? "top-1/2 -right-10 -translate-y-1/2" : "-bottom-10 left-1/2 -translate-x-1/2 rotate-90";
	return (
		<Button
			data-slot={previous ? "carousel-previous" : "carousel-next"}
			variant={variant}
			size={size}
			className={cn("absolute rounded-full", placement, className)}
			disabled={previous ? !canScrollPrev : !canScrollNext}
			{...props}
			type={BUTTON_TYPE}
			onClick={(event) => {
				onClick?.(event);
				if (!event.defaultPrevented) {
					(previous ? scrollPrev : scrollNext)();
				}
			}}
		>
			{previous ? <ArrowLeftIcon /> : <ArrowRightIcon />}
			<span className={UI_CLASSES.srOnly}>{previous ? "上一张" : "下一张"}</span>
		</Button>
	);
}

function CarouselPrevious(props: React.ComponentProps<typeof Button>): React.JSX.Element {
	return <CarouselArrow previous {...props} />;
}

function CarouselNext(props: React.ComponentProps<typeof Button>): React.JSX.Element {
	return <CarouselArrow {...props} />;
}

/** 分页圆点: 当前页拉长成胶囊, 宽度变化走过渡. */
function CarouselDots({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	const { snapCount, selectedIndex, scrollTo } = useCarousel();
	return (
		<div data-slot="carousel-dots" className={cn("flex items-center justify-center gap-1.5 pt-3", className)} {...props}>
			{Array.from({ length: snapCount }, (_, index) => (
				<button
					key={index}
					type={BUTTON_TYPE}
					aria-label={`第 ${index + 1} 张`}
					aria-current={index === selectedIndex}
					onClick={() => scrollTo(index)}
					className={cn(
						"h-1.5 rounded-full transition-[width,background-color] duration-(--duration-base) ease-out",
						index === selectedIndex ? "w-5 bg-link" : "w-1.5 bg-border hover:bg-muted-foreground",
					)}
				/>
			))}
		</div>
	);
}

export { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious, useCarousel, type CarouselApi };
