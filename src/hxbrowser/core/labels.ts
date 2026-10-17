/**
 * 实时预览组件的界面文案. 默认中文, 使用方通过 labels 属性按键覆盖.
 */

import type { LiveStatus } from "./connection";

export interface BrowserLiveLabels {
	status: Record<LiveStatus, string>;
	sandbox: string;
	process: string;
	unsupported: string;
	waitingFirstFrame: string;
	frameHint: string;
	refused: string;
	failed: string;
	reconnect: string;
	openFocus: string;
	backToGrid: string;
	grid: string;
	focus: string;
	refresh: string;
	captureKeys: string;
	back: string;
	forward: string;
	reload: string;
	addressPlaceholder: string;
	sendTextPlaceholder: string;
	sendText: string;
	surface: string;
	envCount: (n: number) => string;
	wallHint: string;
	loadingEnvs: string;
	noEnvs: string;
	noEnvsHint: string;
	listError: string;
	focusedGone: string;
}

export const DEFAULT_LIVE_LABELS: BrowserLiveLabels = {
	status: {
		idle: "未连接",
		connecting: "连接中",
		live: "实时",
		paused: "已暂停",
		reconnecting: "已断开, 重连中",
		refused: "已拒绝",
		failed: "重连失败",
	},
	sandbox: "沙箱",
	process: "进程",
	unsupported: "不支持实时预览",
	waitingFirstFrame: "等待首帧",
	frameHint: "画面由浏览器经 CDP 推送, 与显示层无关",
	refused: "预览连接被拒绝",
	failed: "多次重连失败, 已停止重试",
	reconnect: "重新连接",
	openFocus: "进入聚焦视图 (可操作)",
	backToGrid: "返回平铺",
	grid: "平铺",
	focus: "聚焦",
	refresh: "刷新列表",
	captureKeys: "捕获键盘",
	back: "后退",
	forward: "前进",
	reload: "刷新页面",
	addressPlaceholder: "输入地址后回车",
	sendTextPlaceholder: "发送文本 (支持输入法)",
	sendText: "把文本输入到远端当前焦点",
	surface: "远程操作",
	envCount: (n) => `${n} 个在跑副本`,
	wallHint: "平铺只看不操作, 进入聚焦视图后可用鼠标和键盘直接操作",
	loadingEnvs: "读取在跑副本",
	noEnvs: "没有在跑的浏览器副本",
	noEnvsHint: "启动副本后会自动出现在这里",
	listError: "读取在跑副本失败",
	focusedGone: "正在操作的副本已停止, 已返回平铺 (不会自动切到其他副本)",
};

/** 合并使用方的部分覆盖; status 也按键合并. */
export function resolveLabels(over?: Partial<BrowserLiveLabels>): BrowserLiveLabels {
	if (!over) return DEFAULT_LIVE_LABELS;
	return { ...DEFAULT_LIVE_LABELS, ...over, status: { ...DEFAULT_LIVE_LABELS.status, ...over.status } };
}
