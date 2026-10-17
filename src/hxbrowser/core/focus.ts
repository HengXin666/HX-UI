/**
 * 平铺墙的聚焦判据 (纯函数): 远程输入只能落在用户亲自选中的那个副本上.
 */

import type { LiveEnv } from "./protocol";

/** 当前聚焦的副本; 不在列表里就是 null, 绝不回退到别的副本. */
export function findFocused(envs: readonly LiveEnv[], focusId: string): LiveEnv | null {
	if (focusId === "") return null;
	return envs.find((e) => e.id === focusId) ?? null;
}

/**
 * 聚焦中的副本是否已经停掉. 只有在列表确实读到过且本次没有读取错误时才下结论,
 * 读失败时保留上一次列表, 不能把网络抖动当成副本停止.
 */
export function focusedGone(envs: readonly LiveEnv[], focusId: string, loaded: boolean, error: string): boolean {
	return focusId !== "" && loaded && error === "" && findFocused(envs, focusId) === null;
}

/** 用户主动切到聚焦模式时选谁: 已选的仍在就用它, 否则第一个支持预览的副本. */
export function pickFocusTarget(envs: readonly LiveEnv[], focusId: string): LiveEnv | null {
	return findFocused(envs, focusId) ?? envs.find((e) => e.supported) ?? null;
}
