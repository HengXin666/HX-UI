"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { motion, useReducedMotion } from "motion/react";
import { SPRING_THUMB, THUMB_PRESS_SCALE, THUMB_TRAVEL_PX } from "../craft/tokens";
import { cn } from "./utils";

function Switch({
	className,
	size = "default",
	checked,
	defaultChecked,
	onCheckedChange,
	onPointerDown,
	onPointerUp,
	onPointerCancel,
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
	size?: "sm" | "default";
}) {
	const reduced = useReducedMotion();
	const [on, setOn] = React.useState(defaultChecked === true);
	const [pressed, setPressed] = React.useState(false);
	const isOn = checked ?? on;
	const travel = size === "sm" ? 8 : THUMB_TRAVEL_PX;
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			data-size={size}
			checked={checked}
			defaultChecked={defaultChecked}
			onCheckedChange={(next) => {
				setOn(next);
				onCheckedChange?.(next);
			}}
			onPointerDown={(event) => {
				setPressed(true);
				onPointerDown?.(event);
			}}
			onPointerUp={(event) => {
				setPressed(false);
				onPointerUp?.(event);
			}}
			onPointerCancel={(event) => {
				setPressed(false);
				onPointerCancel?.(event);
			}}
			className={cn(
				"peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent px-0.5 transition-[background-color,border-color,box-shadow,opacity] duration-(--duration-fast) ease-out outline-none focus-visible:border-ring aria-invalid:border-destructive data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-6 dark:aria-invalid:border-destructive/50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb asChild>
				<motion.span
					data-slot="switch-thumb"
					className="pointer-events-none block size-4 rounded-full bg-background group-data-[size=sm]/switch:size-3 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
					animate={{ x: isOn ? travel : 0, scale: pressed ? THUMB_PRESS_SCALE : 1 }}
					transition={reduced ? { duration: 0 } : { type: "spring", stiffness: SPRING_THUMB.stiffness, damping: SPRING_THUMB.damping, mass: SPRING_THUMB.mass }}
				/>
			</SwitchPrimitive.Thumb>
		</SwitchPrimitive.Root>
	);
}

export { Switch };