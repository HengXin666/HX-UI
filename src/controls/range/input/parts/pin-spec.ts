// PinCells 的规格时序常数, 状态类型与输入清洗.
const SINK_S = 0.3;
const CHECK_RISE_PX = 8;

/** 漫底进场时长 (秒), ease-out. */
export const PIN_WASH_IN = SINK_S;
/** 漫底退场时长 (秒), ease-out, 延迟 PIN_WASH_OUT_DELAY. */
export const PIN_WASH_OUT = 0.2;
export const PIN_WASH_OUT_DELAY = 0.06;
/** 第一个字符下沉的延迟与逐格间隔 (秒). */
export const PIN_SINK_DELAY = 0.06;
export const PIN_SINK_STEP = 0.03;
/** 对勾升起前的延迟 (秒) 与升起距离 (px). */
export const PIN_CHECK_DELAY = 0.28;
export const PIN_CHECK_RISE = CHECK_RISE_PX;
/** 下沉后字符的不透明度. */
export const PIN_SINK_FADE = 0.6;
/** 下沉弹簧 { duration: 0.3, bounce: 0 }; 对勾 { duration: 0.35, bounce }; 对勾退场 0.15s. */
export const PIN_SINK_SPRING_S = SINK_S;
export const PIN_CHECK_SPRING_S = 0.35;
export const PIN_CHECK_OUT_S = 0.15;
/** 离开通过态时字符回位的延迟 (秒). */
export const PIN_RETURN_DELAY = 0.1;

export type PinStatus = "idle" | "success" | "error";

/** 去掉空白并截到 length. */
export function cleanCode(raw: string, length: number): string {
	return raw.replace(/\s+/g, "").slice(0, length);
}
