"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
import { VARIANT } from "../constants";

const avatarVariants = cva(
	"group/avatar relative flex shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted select-none",
	{
		variants: {
			size: {
				sm: "size-6 text-[10px]",
				default: "size-8 text-[12px]",
				lg: "size-10 text-[14px]",
			},
		},
		defaultVariants: { size: VARIANT.default },
	},
);

/**
 * 头像.
 *
 * 图片加载成功前显示 AvatarFallback (首字母或图标); 图片到达后淡入, 不闪白.
 * size 三档, 组合进 AvatarGroup 时自动叠放并加一圈页面底色描边.
 */
function Avatar({
	className,
	size = VARIANT.default,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & VariantProps<typeof avatarVariants>): React.JSX.Element {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			data-size={size}
			className={cn(avatarVariants({ size }), className)}
			{...props}
		/>
	);
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>): React.JSX.Element {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn(
				"aspect-square size-full object-cover animate-in fade-in-0 duration-(--duration-base)",
				className,
			)}
			{...props}
		/>
	);
}

function AvatarFallback({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>): React.JSX.Element {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"flex size-full items-center justify-center rounded-full bg-secondary font-medium text-muted-foreground",
				"[&_svg:not([class*='size-'])]:size-[55%]",
				className,
			)}
			{...props}
		/>
	);
}

/** 头像右下角的状态点 (在线 / 忙碌), 颜色由调用方用语义类传入, 例如 bg-success. */
function AvatarBadge({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return (
		<span
			data-slot="avatar-badge"
			className={cn(
				"absolute right-0 bottom-0 size-2.5 rounded-full border border-background bg-success",
				"group-data-[size=sm]/avatar:size-2",
				className,
			)}
			{...props}
		/>
	);
}

/** 一排叠放的头像. */
function AvatarGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="avatar-group"
			className={cn(
				"group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-1 *:data-[slot=avatar]:ring-background",
				"*:data-[slot=avatar]:transition-transform *:data-[slot=avatar]:duration-(--duration-fast) *:data-[slot=avatar]:hover:-translate-y-0.5",
				className,
			)}
			{...props}
		/>
	);
}

/** 叠放头像末尾的 "+N" 计数. */
function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="avatar-group-count"
			className={cn(
				"relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary text-[11px] font-medium text-muted-foreground ring-1 ring-background",
				className,
			)}
			{...props}
		/>
	);
}

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, avatarVariants };
