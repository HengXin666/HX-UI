"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import { cn } from "./utils";
import { ROLE, UI_CLASSES } from "../constants";

/**
 * 一次性验证码输入.
 *
 * 底层是一个透明的真实 input (input-otp): 粘贴整串, 系统短信自动填充, 退格都是原生行为;
 * 看到的格子只是它的投影. 当前格子有闪烁光标, 填入字符时轻微放大淡入.
 */
function InputOTP({
	className,
	containerClassName,
	...props
}: React.ComponentProps<typeof OTPInput> & { containerClassName?: string }): React.JSX.Element {
	return (
		<OTPInput
			data-slot="input-otp"
			containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
			className={cn("disabled:cursor-not-allowed", className)}
			{...props}
		/>
	);
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="input-otp-group" className={cn("flex items-center", className)} {...props} />;
}

function InputOTPSlot({
	index,
	className,
	...props
}: React.ComponentProps<"div"> & { index: number }): React.JSX.Element {
	const context = React.useContext(OTPInputContext);
	const { char, hasFakeCaret, isActive } = context?.slots[index] ?? {};
	return (
		<div
			data-slot="input-otp-slot"
			data-active={isActive}
			className={cn(
				"relative flex size-9 items-center justify-center border-y border-r border-border/60 bg-muted/40 font-mono text-[15px] text-foreground",
				"transition-[border-color,background-color] duration-(--duration-fast) first:rounded-l-lg first:border-l last:rounded-r-lg",
				"data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:bg-transparent",
				"aria-invalid:border-destructive",
				className,
			)}
			{...props}
		>
			{char && <span className="animate-in fade-in-0 zoom-in-75 duration-(--duration-fast)">{char}</span>}
			{hasFakeCaret && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
				</div>
			)}
		</div>
	);
}

function InputOTPSeparator(props: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div data-slot="input-otp-separator" role={ROLE.separator} className={UI_CLASSES.muted} {...props}>
			<MinusIcon className="size-4" />
		</div>
	);
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
