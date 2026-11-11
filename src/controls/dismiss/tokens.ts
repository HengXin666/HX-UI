/**
 * dismiss 族的手感合同: 每个数字只在这里写一次, 组件引用名字.
 * 数值是 docs/research/catalog/micro.md 各条目的规格值, 注释里写原规格名便于对照.
 */

import { cssCurve } from "../../motion/curves";

/** 本文件内重复出现的字面量, 只写一次. */
const N_10 = 10;
const N_0_3 = 0.3;
const N_0_4 = 0.4;
const N_200 = 200;
const N_160 = 160;
const N_16 = 16;
const N_0_55 = 0.55;
const N_0_6 = 0.6;
const N_8 = 8;
const N_24 = 24;
const N_0_5 = 0.5;
const N_12 = 12;
const N_40 = 40;
const N_30 = 30;
const N_6 = 6;
const N_320 = 320;
const N_0_05 = 0.05;
const N_0_1 = 0.1;
const N_0_08 = 0.08;
const N_240 = 240;
const N_4 = 4;

/** 族里五件共用的 CSS 收尾曲线 (各条目的 --*-ease-out). */
export const DISMISS_EASE_OUT = cssCurve("outStrong");

/* ── DrawerRow (规格 SwipeRow) ── */
export const ROW = {
	/** 判轴前允许的位移 (HYST). */
	axisLockPx: N_10,
	/** 速度超过它按方向判开合 (FLICK, px/s). */
	flickPxS: 110,
	/** 惯性投射的每毫秒衰减 (DECEL). */
	decel: 0.998,
	/** 松手速度上限 (VMAX, px/s). */
	maxVelocityPxS: 1500,
	/** 收起用的 UI 弹簧 (SPRING_UI: 0.3s, bounce 0). */
	closeDurationS: N_0_3,
	closeBounce: 0,
	/** 打开吸附弹簧时长, bounce 取 snapBounce. */
	openDurationS: N_0_4,
	/** 整行划走与回到全开的补间 (0.2s EASE_OUT). */
	commitTweenMs: N_200,
	/** 动作底色淡入 150ms, 动作按下 160ms. */
	fadeMs: 150,
	pressMs: N_160,
	height: 64,
	radius: N_16,
	actionWidth: 80,
	snapBounce: 0.2,
	resistance: N_0_55,
	collapseMs: N_200,
	commitAt: N_0_6,
	hapticMs: N_8,
} as const;

/* ── FlickNotice (规格 SwipeToast) ── */
export const NOTICE = {
	/** 下划速度阈值 (FLICK, px/ms). */
	flickPxMs: 0.11,
	/** 判定拖动前的死区 (DEAD_ZONE). */
	deadZonePx: 3,
	/** 反向拖动的渐近上限 (RESIST_PX). */
	resistPx: N_24,
	/** 高度收起 (COLLAPSE_MS). */
	collapseMs: N_200,
	/** 离场时长相对 slideMs 的比例 (EXIT); 入场位移 0.7, 透明度 0.6 / 离场透明度 0.5. */
	exitRatio: 0.7,
	enterOpacityRatio: N_0_6,
	exitOpacityRatio: N_0_5,
	/** 划走弹簧 0.3s bounce 0, 淡出 0.2s. */
	throwDurationS: N_0_3,
	fadeMs: N_200,
	/** 回弹弹簧 0.5s, bounce 取 settleBounce; 减弱动效改 0.2s 补间. */
	settleDurationS: N_0_5,
	buttonMs: N_160,
	width: 356,
	radius: N_12,
	slideMs: 400,
	settleBounce: 0.2,
	swipeDistance: N_40,
	duration: 4000,
} as const;

/* ── ShredBin (规格 Shredder) ── */
export const SHRED = {
	/** 拖动跟随的刚度系数与回位系数 (FOLLOW, SETTLE, 1/s). */
	follow: N_30,
	settle: N_16,
	/** 每咬一口的回拽幅度与衰减 (TUG, TUG_DECAY). */
	tug: 2.4,
	tugDecay: 0.14,
	/** 刀口可视高度, 送入后再多走的距离, 最细碎条 (SLIT, OVER, SLIVER). */
	slit: N_6,
	over: N_40,
	sliver: 2,
	/** 堆叠重排弹簧 (STACK_K, STACK_C) 与逐个错开 (STAGGER, s). */
	stackK: N_320,
	stackC: 22,
	stagger: 0.035,
	/** 越过刀口多少算送入, 退回要多退的滞回 (ENTER, HYSTERESIS). */
	enter: 22,
	hysteresis: N_8,
	/** 新卡逐个入场的间隔 (born * 0.05s). */
	bornDelay: N_0_05,
	/** 逐帧趋近的时间常数 (s): 拖动倾斜, 抬起, 送入时横向居中, 倾斜回正, 抬起回落, 碎条下落, 碎条散开. */
	tauTilt: 0.09,
	tauLift: 0.12,
	tauCenter: N_0_1,
	tauUntilt: N_0_08,
	tauDrop: N_0_1,
	tauFall: 0.25,
	tauSplay: N_0_4,
	splayPull: 0.25,
	/** 碎条淡出 280ms, 刀口滤镜 240ms. */
	fadeMs: 280,
	slitFilterMs: N_240,
	/** 一帧最长 50ms, 子步 240Hz. */
	maxDtS: N_0_05,
	substepHz: N_240,
	maxStrips: 48,
	width: 340,
	height: 460,
	inset: 14,
	gap: N_10,
	slitHeight: N_4,
	fallHeight: 140,
	feedSpeed: 180,
	bite: 18,
	stripWidth: N_10,
	curl: 1,
	dragTilt: N_6,
	lift: 1.02,
} as const;

/* ── CrushSheet (规格 PaperCrumple) ── */
export const CRUSH = {
	/** 跟随率 omega = 8 / duration, duration 下限 0.06s. */
	settleRate: N_8,
	settleFloorS: 0.06,
	/** 非主通道 (光照, 拖动) 的跟随时长. */
	sideDurationS: 0.42,
	/** 折痕权重的 smoothstep 边: 0.88 - (1 - sharpness) * 0.18 到 0.98; 光照 0 到 0.4. */
	creaseEdge: 0.88,
	creaseSoften: 0.18,
	creaseTop: 0.98,
	lightTop: N_0_4,
	/** 拖动速度采样的最小 dt (s). */
	dragMinDtS: 0.008,
	/** 揉到底时整体缩到原来的比例与下沉. */
	shrink: N_0_55,
	width: N_320,
	height: 400,
	sceneHeight: 560,
	crumpleAmount: 0.85,
	crumpleDuration: N_0_55,
	releaseDuration: N_0_4,
	foldCount: N_6,
	foldSharpness: N_0_6,
	wrinkleDepth: 0.65,
	creaseStrength: 0.18,
	roughness: 0.92,
	paperTexture: N_0_08,
	lightIntensity: 1.8,
	lightAngle: -35,
	shadowOpacity: N_0_08,
	dragRotation: N_10,
	/** 位移贴图的像素尺度与噪声基频. */
	displacePx: N_40,
	baseFrequency: 0.012,
} as const;

/* ── RipStub (规格 TearTicket) ── */
export const RIP = {
	/** 悬停倾斜弹簧 (TILT_SPRING). */
	tiltSpring: { stiffness: 220, damping: N_24, mass: N_0_6 },
	/** 撕下后的重力 (GRAVITY, px/s^2). */
	gravity: 2400,
	/** 票面插图内缩与宽度占比 (ART_INSET, ART_SPAN). */
	artInset: N_8,
	artSpan: 0.78,
	/** 松手回缩时主票面反冲的速度比例 (RETRACT). */
	retract: 0.17,
	/** 趋近时间常数 (s): 角度跟手, 存根跟手, 撕下后跟手, 撕下后垂角, 回位. */
	tauAngle: 0.035,
	tauFollow: N_0_05,
	tauFree: 0.045,
	tauHang: 0.12,
	tauHome: 0.07,
	/** 垂摆弹簧与主票面反冲弹簧 (单位质量). */
	hangK: 300,
	hangC: N_24,
	bodyK: 520,
	bodyC: N_30,
	/** 一帧 dt 钳在 1ms 到 34ms, 指针速度平滑 0.35, 采样最小 4ms. */
	minDtS: 0.001,
	maxDtS: 0.034,
	pointerSmooth: 0.35,
	pointerMinDtS: 0.004,
	/** 倾斜复位 650ms, 滤镜 700ms, 淡出 500ms. */
	tiltResetMs: 650,
	tiltResetEase: cssCurve("outQuint"),
	filterMs: 700,
	fadeMs: 500,
	width: 460,
	height: 250,
	stubSize: 150,
	radius: N_16,
	holes: N_12,
	holeSize: N_6,
	notch: 3,
	imageRadius: N_8,
	tearAngle: N_30,
	stretch: N_30,
	resistance: 0.45,
	rotate: N_4,
	tiltMax: 9,
	/** 飞出视野多远算落定. */
	fallOutPx: 600,
} as const;

/* ── EvadeZone (规格 DodgeField) ── */
export const EVADE = {
	/** 逃逸强度越过它记一次躲闪 (COUNT_LINE). */
	countLine: N_0_55,
	/** 指针位移小于它不重算 (DEAD_ZONE). */
	deadZonePx: N_6,
	/** 抓到后停住的时间 (CAUGHT_HOLD_MS). */
	caughtHoldMs: 760,
	/** 墙内缩 (INSET). */
	insetPx: N_12,
	/** 按下 160ms, 颜色 220ms, 提示 200ms. */
	pressMs: N_160,
	colorMs: 220,
	noticeMs: N_200,
	fieldHeight: N_240,
	reach: 72,
	radius: 120,
	falloff: 2,
	fleeDuration: 130,
	returnDuration: 620,
	returnBounce: N_0_1,
	patience: N_4,
} as const;

/* ── StashFolder (规格 FolderFloat) ── */
export const STASH = {
	/** 纸片水平内边距, 每字符估宽, 间距, 行高, 拖动阈值, 活动区内边距 (PAD, CHAR, GAP, ROW, DRAG_MIN, ZONE_PAD). */
	pad: 28,
	charPx: 6.8,
	gap: N_12,
	row: 52,
	dragMin: N_4,
	zonePad: N_8,
	stagger: 45,
	/** 打开回弹曲线 cubic-bezier(0.34, 1 + bounce * 1.9, 0.64, 1); 1.57 对应 bounce 0.3. */
	bounce: N_0_3,
	bounceGain: 1.9,
	/** 收起时逆序错开减半, 淡出在收起的 0.45 处开始. */
	closeStaggerRatio: N_0_5,
	closeFadeAt: 0.45,
	fadeMs: N_160,
	labelFadeMs: N_200,
	popMs: N_320,
	driftS: 3.2,
	driftPhaseS: 0.7,
	/** 物理开始前额外等待与最长一帧. */
	liveDelayMs: 80,
	maxDtMs: 32,
	/** 漂移力的两路角频率与相位倍数. */
	driftWx: 0.9,
	driftWy: 1.3,
	driftPhaseY: 1.7,
	drift: N_0_5,
	width: N_200,
	height: 148,
	radius: 14,
	spread: 180,
	lift: 26,
	tilt: N_8,
	flapAngle: 34,
	restAngle: N_16,
} as const;
