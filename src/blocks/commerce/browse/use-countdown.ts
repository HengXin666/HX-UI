"use client";

import * as React from "react";
import { BROWSE_NUMBERS, COUNTDOWN_INTL, COUNTDOWN_UNITS } from "../../../constants/blocks-commerce-v107";

const MS_PER_MINUTE = BROWSE_NUMBERS.msPerSecond * BROWSE_NUMBERS.secondsPerMinute;
const MS_PER_HOUR = MS_PER_MINUTE * BROWSE_NUMBERS.minutesPerHour;
const MS_PER_DAY = MS_PER_HOUR * BROWSE_NUMBERS.hoursPerDay;
const UNIT_MS = [MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, BROWSE_NUMBERS.msPerSecond] as const;

export interface Countdown {
  /** 剩余毫秒, 不小于 0. 首帧 (服务端) 为 null, 避免水合不一致. */
  remaining: number | null;
  done: boolean;
  /** Intl 格式化的剩余时长 ("2天 3小时 5分 9秒" / "2d 3h 5m 9s"). */
  text: string;
  /** ISO 时间, 给 <time dateTime>. */
  iso: string;
}

/**
 * 倒计时: 每秒刷新, 到点停. 每段数字经 Intl.NumberFormat(style: unit), 段与段经 Intl.ListFormat(type: unit) 连接,
 * 不手拼单位与分隔符. 最高位为 0 的段省略.
 */
export function useCountdown(endsAt: Date | number | string | undefined, locale: string): Countdown {
  const end = endsAt === undefined ? Number.NaN : new Date(endsAt).getTime();
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (Number.isNaN(end)) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= end) clearInterval(timer);
    }, BROWSE_NUMBERS.tickMs);
    return () => clearInterval(timer);
  }, [end]);

  return React.useMemo(() => {
    const iso = Number.isNaN(end) ? "" : new Date(end).toISOString();
    if (now === null || Number.isNaN(end)) return { remaining: null, done: false, text: "", iso };
    const remaining = Math.max(end - now, 0);
    let rest = remaining;
    const parts: string[] = [];
    COUNTDOWN_UNITS.forEach((unit, i) => {
      const value = Math.floor(rest / UNIT_MS[i]);
      rest -= value * UNIT_MS[i];
      if (value === 0 && parts.length === 0 && i < COUNTDOWN_UNITS.length - 1) return;
      parts.push(
        new Intl.NumberFormat(locale, {
          style: COUNTDOWN_INTL.unit,
          unit,
          unitDisplay: COUNTDOWN_INTL.narrow,
          minimumIntegerDigits: parts.length === 0 ? 1 : BROWSE_NUMBERS.twoDigits,
        }).format(value),
      );
    });
    const text = new Intl.ListFormat(locale, { type: COUNTDOWN_INTL.unit, style: COUNTDOWN_INTL.narrow }).format(parts);
    return { remaining, done: remaining === 0, text, iso };
  }, [end, now, locale]);
}
