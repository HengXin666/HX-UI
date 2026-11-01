import type { JSX, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { TONE } from "../constants";
import { isNumber } from "../constants/box";
import {
  SPARK_COORD_DECIMALS,
  SPARK_HEIGHT,
  SPARK_MIN_POINTS,
  SPARK_PAD_SIDES,
  SPARK_WIDTH,
  SVG_CURRENT_COLOR,
  SVG_NON_SCALING_STROKE,
  SVG_NONE,
  TREND_DIRECTION,
  TREND_TONE,
} from "../constants/polish";
import { cn } from "../primitives/utils";
import { Card, CardContent } from "./Card";

/**
 * 统计卡: 一个数 + 它的名字。
 *
 * 语气色 (tone) 的**全部**用途是"这个数说明好还是坏", 不是装饰。
 * 因此只有五档, 且默认档不染色  大多数指标本身没有好坏, 硬染色会让整页都在喊。
 *
 * 数字用 tabular-nums: 等宽数字, 轮询刷新时位数变化不会让整块面板左右抖。
 * 这一点在手写版本里几乎总被漏掉, 而它恰好是"数据面板看起来专业还是业余"的分水岭。
 */
const statValueVariants = cva("mt-0.5 text-[length:var(--fs-3xl)] font-semibold leading-none tabular-nums", {
  variants: {
    tone: {
      default: "text-foreground",
      good: TONE.successFg,
      bad: TONE.dangerFg,
      muted: "text-muted-foreground",
      accent: "text-link",
    },
  },
  defaultVariants: { tone: "default" },
});

export type StatTone = "default" | "good" | "bad" | "muted" | "accent";

/**
 * 变化趋势. value 是相对变化的百分数 (12.4 表示 +12.4%), 正负决定箭头方向.
 * better 说明 "涨是不是好事": 默认 up; 延迟, 错误率这类越低越好的指标传 down; neutral 不染色.
 */
export interface StatTrend {
  readonly value: number;
  readonly better?: "up" | "down" | "neutral";
  /** 跟在百分数后的说明, 例如 "较上周". */
  readonly label?: ReactNode;
}

type TrendTone = "good" | "bad" | "flat" | "brand";

/**
 * 趋势与迷你折线共用的语气色: 只表达好坏, 没有方向或不分好坏时走弱化色.
 * brand 只给没有趋势的迷你折线用, 让一条纯走势线有颜色而不暗示好坏.
 */
const trendToneVariants = cva("", {
  variants: {
    tone: {
      good: TONE.successFg,
      bad: TONE.dangerFg,
      flat: "text-muted-foreground/80",
      brand: "text-primary/90",
    },
  },
});

const TREND_ICON: Record<"up" | "down" | "flat", string> = {
  up: "icon-[solar--arrow-right-up-linear]",
  down: "icon-[solar--arrow-right-down-linear]",
  flat: "icon-[solar--arrow-right-linear]",
};

const TREND_FORMAT = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, signDisplay: "exceptZero" });

/** 迷你折线的画布: viewBox 固定 (SPARK_WIDTH x SPARK_HEIGHT), 由 preserveAspectRatio=none 拉伸到容器宽度.
 * 上下各留 1 个单位, 1px 线条贴边时不被裁掉一半. */
const SPARK_PAD = 1;

function trendDirection(value: number): "up" | "down" | "flat" {
  if (value > 0) return TREND_DIRECTION.up;
  return value < 0 ? TREND_DIRECTION.down : TREND_DIRECTION.flat;
}

function trendTone(trend: StatTrend): TrendTone {
  const direction = trendDirection(trend.value);
  if (direction === TREND_DIRECTION.flat || trend.better === "neutral") return TREND_TONE.flat;
  return direction === (trend.better ?? TREND_DIRECTION.up) ? TREND_TONE.good : TREND_TONE.bad;
}

/** 没有 trend 时迷你折线跟随卡片语气: 好坏照搬, 其余走主色. */
const SPARK_TONE: Record<StatTone, TrendTone> = {
  default: TREND_TONE.brand,
  good: TREND_TONE.good,
  bad: TREND_TONE.bad,
  muted: TREND_TONE.flat,
  accent: TREND_TONE.brand,
};

/** 把数列折成折线与面积两条 path; 少于两个点时不画. */
function sparkPaths(points: ReadonlyArray<number>): { line: string; area: string } | null {
  if (points.length < SPARK_MIN_POINTS) return null;
  const min = Math.min(...points);
  const span = Math.max(...points) - min || 1;
  const step = SPARK_WIDTH / (points.length - 1);
  const usable = SPARK_HEIGHT - SPARK_PAD * SPARK_PAD_SIDES;
  const coords = points.map((n, i) => `${(i * step).toFixed(SPARK_COORD_DECIMALS)},${(SPARK_PAD + usable - ((n - min) / span) * usable).toFixed(SPARK_COORD_DECIMALS)}`);
  const line = `M${coords.join("L")}`;
  return { line, area: `${line}L${SPARK_WIDTH},${SPARK_HEIGHT}L0,${SPARK_HEIGHT}Z` };
}

/** 迷你折线: 1px 描边 + 极淡的面积填充, 颜色取 currentColor, 由外层语气色决定. */
function Sparkline({ points, className }: { points: ReadonlyArray<number>; className?: string }): JSX.Element | null {
  const paths = sparkPaths(points);
  if (!paths) return null;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      preserveAspectRatio={SVG_NONE}
      className={cn("mt-2 block h-7 w-full overflow-visible", className)}
    >
      <path d={paths.area} className="fill-current opacity-10" />
      <path
        d={paths.line}
        fill={SVG_NONE}
        stroke={SVG_CURRENT_COLOR}
        strokeWidth={1}
        vectorEffect={SVG_NON_SCALING_STROKE}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface StatCardProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly hint?: ReactNode;
  /** 图标类名 (iconify, 例如 icon-[solar--users-group-rounded-linear])。 */
  readonly icon?: string;
  readonly tone?: StatTone;
  /** 右上角小徽章之类的补充信息。 */
  readonly extra?: ReactNode;
  /** 变化趋势 (可选). 传数字是 { value } 的简写: 正数涨, 负数跌, 涨视为好事. */
  readonly trend?: number | StatTrend;
  /** 迷你折线的数据点 (可选), 按时间先后排列, 至少两个点才画. */
  readonly sparkline?: ReadonlyArray<number>;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  extra,
  trend,
  sparkline,
  className,
  ...props
}: StatCardProps): JSX.Element {
  const trendInfo = isNumber(trend) ? { value: trend } : trend;
  const trendClass = trendInfo ? trendToneVariants({ tone: trendTone(trendInfo) }) : undefined;
  return (
    <Card className={className} {...props}>
      <CardContent className="pt-3">
        <div className="flex items-start gap-2.5">
          {icon ? (
            <span
              aria-hidden
              className={cn(icon, "mt-0.5 size-4 shrink-0 bg-current", statValueVariants({ tone }))}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-[length:var(--fs-xs)] leading-tight text-muted-foreground">{label}</div>
              {extra ? <div className="ml-auto shrink-0">{extra}</div> : null}
            </div>
            <div className={statValueVariants({ tone })}>{value}</div>
            {trendInfo ? (
              <div className="mt-1.5 flex items-center gap-1 text-[length:var(--fs-2xs)] tabular-nums">
                <span className={cn("inline-flex items-center gap-0.5 font-medium", trendClass)}>
                  <span aria-hidden className={cn(TREND_ICON[trendDirection(trendInfo.value)], "size-3 bg-current")} />
                  {`${TREND_FORMAT.format(trendInfo.value)}%`}
                </span>
                {trendInfo.label ? <span className="truncate text-muted-foreground/80">{trendInfo.label}</span> : null}
              </div>
            ) : null}
            {hint ? (
              <div className="mt-1 truncate text-[length:var(--fs-2xs)] text-muted-foreground/80">{hint}</div>
            ) : null}
            {sparkline ? <Sparkline points={sparkline} className={trendClass ?? trendToneVariants({ tone: SPARK_TONE[tone] })} /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 指标栅格。手写时每个页面都在写 same 的 grid-cols-4 + gap-2 且断点写法每次不一样,
 * 这里固定四档: 2 / 3 / 4 / 5 列 (窄屏一律先掉到 2 列)。
 */
export function StatGrid({
  columns = 4,
  className,
  children,
}: {
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  children: ReactNode;
}): JSX.Element {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-5",
  }[columns];
  return <div className={cn("grid grid-cols-1 gap-2", cols, className)}>{children}</div>;
}

export { statValueVariants };