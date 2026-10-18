"use client";

import * as React from "react";
import { AspectRatio as AspectRatioPrimitive } from "radix-ui";

/**
 * 固定宽高比容器: ratio 取宽 / 高, 例如 16 / 9. 子元素铺满容器,
 * 图片配 object-cover 即可裁切而不变形.
 */
function AspectRatio(props: React.ComponentProps<typeof AspectRatioPrimitive.Root>): React.JSX.Element {
	return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
