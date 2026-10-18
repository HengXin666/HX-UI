import { MEDIA_REDUCED_MOTION } from "../constants";

/**
 * 系统是否要求减弱动效. 只在浏览器里有意义; 服务端渲染或测试环境缺 matchMedia 时按未开启处理.
 * JS 驱动的动效 (轮播滚动时长, 平滑滚动) 用它判断; CSS 动效由时长令牌在媒体查询里归零.
 */
export function prefersReducedMotion(): boolean {
	return globalThis.window?.matchMedia?.(MEDIA_REDUCED_MOTION).matches === true;
}
