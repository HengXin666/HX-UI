"use client";

import { Check, Minus } from "lucide-react";
import * as React from "react";
import { MATRIX_CELL, MATRIX_CLASS as C, V105_CLASS as K, V105_SLOT, pickV105Text, type V105Text } from "../../constants/blocks-marketing-v105";
import { IconSlot } from "../../layout/Icon";
import { Switch } from "../../primitives/switch";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, IconName, Rich, SectionHeadingData } from "../_shared/types";

/** 单元格: true 有 / false 无 / 字符串文字 / 数字 (经 Intl 格式化) / 图标 (label 作可访问名称). */
export type MatrixValue = boolean | string | number | { icon: IconName; label: string };

export interface MatrixPlan {
  key: string;
  name: Rich;
  /** 列头下方的补充 (价格, 一句话). */
  description?: Rich;
}

export interface MatrixRow {
  key?: string;
  label: Rich;
  /** 行说明, 以 title 提示与读屏文本呈现. */
  tooltip?: string;
  values: Record<string, MatrixValue | undefined>;
}

export interface MatrixGroup {
  title: Rich;
  rows: MatrixRow[];
}

export interface ComparisonMatrixProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  plans: MatrixPlan[];
  groups: MatrixGroup[];
  /** 是否显示"仅显示差异"开关 (默认 true). */
  diffToggle?: boolean;
  /** 初始是否只显示差异行. */
  defaultOnlyDifferences?: boolean;
  /** 首列表头文案 (默认"功能"). */
  featureLabel?: Rich;
  messages?: Partial<V105Text>;
  ref?: React.Ref<HTMLElement>;
}

function kindOf(value: MatrixValue | undefined): (typeof MATRIX_CELL)[keyof typeof MATRIX_CELL] {
  if (value === true) return MATRIX_CELL.yes;
  if (value === false || value === undefined) return MATRIX_CELL.no;
  if (typeof value === "object") return MATRIX_CELL.icon;
  return MATRIX_CELL.text;
}

/** 一行在各档的值是否完全一致 (仅显示差异时隐藏). */
function isUniform(row: MatrixRow, plans: MatrixPlan[]): boolean {
  const keys = plans.map((plan) => JSON.stringify(row.values[plan.key] ?? false));
  return keys.every((key) => key === keys[0]);
}

function Cell({ value, text }: { value: MatrixValue | undefined; text: V105Text }): React.JSX.Element {
  const { formatNumber } = useBlocks();
  const kind = kindOf(value);
  if (kind === MATRIX_CELL.yes || kind === MATRIX_CELL.no) {
    const yes = kind === MATRIX_CELL.yes;
    return (
      <span className={C.cellValue} data-value={kind}>
        <IconSlot source={yes ? Check : Minus} className={yes ? K.check : K.cross} />
        <span className={K.srOnly}>{yes ? text.included : text.notIncluded}</span>
      </span>
    );
  }
  if (kind === MATRIX_CELL.icon && typeof value === "object") {
    return (
      <span className={C.cellValue} data-value={kind}>
        <IconSlot source={value.icon} className={K.check} />
        <span className={K.srOnly}>{value.label}</span>
      </span>
    );
  }
  return (
    <span className={C.cellValue} data-value={kind}>
      {typeof value === "number" ? formatNumber(value) : (value as string)}
    </span>
  );
}

function RowLabel({ row }: { row: MatrixRow }): React.JSX.Element {
  return (
    <span title={row.tooltip}>
      {row.label}
      {row.tooltip && <span className={K.srOnly}>{` (${row.tooltip})`}</span>}
    </span>
  );
}

interface ViewProps {
  plans: MatrixPlan[];
  groups: MatrixGroup[];
  text: V105Text;
  featureLabel: Rich;
}

/** md 及以上: 宽表, 表头与首列粘性 (滚动容器内). */
function MatrixTable({ plans, groups, text, featureLabel }: ViewProps): React.JSX.Element {
  return (
    <div data-slot={V105_SLOT.matrixTable} className={C.scroller}>
      <table className={C.table}>
        <thead>
          <tr>
            <th scope="col" className={C.corner}>{featureLabel}</th>
            {plans.map((plan) => (
              <th key={plan.key} scope="col" className={C.headCell}>
                {plan.name}
                {plan.description !== undefined && <span className={cn(C.block, K.muted)}>{plan.description}</span>}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group, gi) => (
          <tbody key={typeof group.title === "string" ? group.title : gi}>
            <tr>
              <th scope="colgroup" colSpan={plans.length + 1} className={C.groupCell}>{group.title}</th>
            </tr>
            {group.rows.map((row, ri) => (
              <tr key={row.key ?? ri}>
                <th scope="row" className={C.rowHead}><RowLabel row={row} /></th>
                {plans.map((plan) => (
                  <td key={plan.key} className={C.cell}><Cell value={row.values[plan.key]} text={text} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/** md 以下: 每档一张卡, 横向滑动逐张对比 (纯 CSS scroll-snap, 无 JS). */
function MatrixCards({ plans, groups, text }: ViewProps): React.JSX.Element {
  return (
    <div data-slot={V105_SLOT.matrixCards} className={C.cards}>
      {plans.map((plan) => (
        <article key={plan.key} className={C.card} aria-label={typeof plan.name === "string" ? plan.name : undefined}>
          <div>
            <h3 className={K.groupTitle}>{plan.name}</h3>
            {plan.description !== undefined && <p className={K.muted}>{plan.description}</p>}
          </div>
          {groups.map((group, gi) => (
            <section key={typeof group.title === "string" ? group.title : gi}>
              <h4 className={K.muted}>{group.title}</h4>
              <dl>
                {group.rows.map((row, ri) => (
                  <div key={row.key ?? ri} className={C.cardRow}>
                    <dt><RowLabel row={row} /></dt>
                    <dd><Cell value={row.values[plan.key]} text={text} /></dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </article>
      ))}
    </div>
  );
}

/**
 * 功能对比矩阵: 分组行, 粘性表头与首列, 单元格 有/无/文字/图标 (数字经 Intl),
 * "仅显示差异"开关; 手机上宽表不可用, md 以下退化为按档位逐张卡片.
 */
export function ComparisonMatrix({
  heading,
  plans,
  groups,
  diffToggle = true,
  defaultOnlyDifferences = false,
  featureLabel,
  messages,
  labels: _labels,
  ref,
  ...shell
}: ComparisonMatrixProps): React.JSX.Element {
  const { locale } = useBlocks();
  const text = React.useMemo(() => pickV105Text(locale, messages), [locale, messages]);
  const [onlyDiff, setOnlyDiff] = React.useState(defaultOnlyDifferences);
  const switchId = React.useId();
  const visible = React.useMemo(
    () =>
      onlyDiff
        ? groups.map((group) => ({ ...group, rows: group.rows.filter((row) => !isUniform(row, plans)) })).filter((group) => group.rows.length > 0)
        : groups,
    [groups, plans, onlyDiff],
  );
  const view: ViewProps = { plans, groups: visible, text, featureLabel: featureLabel ?? text.feature };
  return (
    <BlockShell ref={ref} heading={heading} renderHeading={renderSectionHeading} {...shell}>
      <div data-slot={V105_SLOT.matrix} data-only-differences={onlyDiff || undefined}>
        {diffToggle && (
          <div data-slot={V105_SLOT.matrixDiff} className={C.toolbar}>
            <label htmlFor={switchId}>{text.onlyDifferences}</label>
            <Switch id={switchId} checked={onlyDiff} onCheckedChange={setOnlyDiff} />
          </div>
        )}
        <MatrixTable {...view} />
        <MatrixCards {...view} />
      </div>
    </BlockShell>
  );
}
