"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../../constants";
import { DOCS_CLASS, DOCS_DEFAULT, DOCS_SLOT } from "../../../constants/blocks-docs-v109";
import { TableCell, TableRow } from "../../../primitives/table";
import { cn } from "../../../primitives/utils";
import type { ApiRow } from "../../_shared/types";
import type { DocsText } from "./labels";

/** 类型串: 超过阈值时折叠为首段 + 展开按钮 (union 按 | 分段, 展开后完整显示). */
export function ApiType({ type, collapseAt, text, className }: { type: string; collapseAt: number; text: DocsText; className?: string }): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const long = collapseAt > 0 && type.length > collapseAt;
  const head = long ? `${type.slice(0, collapseAt).trimEnd()}…` : type;
  return (
    <span data-slot={DOCS_SLOT.apiType} data-collapsed={long && !open ? "true" : undefined} className={DOCS_CLASS.apiTypeBox}>
      <code className={cn(DOCS_CLASS.apiType, DOCS_CLASS.apiCode, className)}>{open || !long ? type : head}</code>
      {long && (
        <button type={BUTTON_TYPE} aria-expanded={open} onClick={() => setOpen((v) => !v)} className={cn(DOCS_CLASS.apiTypeToggle, DOCS_CLASS.focus)}>
          {open ? text.collapseType : text.expandType}
        </button>
      )}
    </span>
  );
}

export interface ApiRowViewProps {
  row: ApiRow;
  text: DocsText;
  collapseAt?: number;
  cls: Partial<Record<"row" | "name" | "type" | "default" | "description", string>>;
}

/** ApiTable 的一行: 名称 (必填星标 + 读屏文案), 类型 (可折叠), 默认值, 说明. */
export function ApiRowView({ row, text, collapseAt = DOCS_DEFAULT.typeCollapseAt, cls }: ApiRowViewProps): React.JSX.Element {
  return (
    <TableRow data-slot={DOCS_SLOT.apiRow} data-required={row.required ? "true" : undefined} className={cls.row}>
      <TableCell className={cn(DOCS_CLASS.apiName, cls.name)}>
        {row.deprecated !== undefined ? <s>{row.name}</s> : row.name}
        {row.required && (
          <>
            <span aria-hidden className={DOCS_CLASS.apiRequired}>*</span>
            <span className={DOCS_CLASS.srOnly}>{` (${text.apiRequired})`}</span>
          </>
        )}
      </TableCell>
      <TableCell className={cls.type}>
        <ApiType type={row.type} collapseAt={collapseAt} text={text} />
      </TableCell>
      <TableCell className={cn(DOCS_CLASS.apiDefault, cls.default)}>
        {row.default !== undefined ? <code className={DOCS_CLASS.apiCode}>{row.default}</code> : <span aria-hidden>–</span>}
      </TableCell>
      <TableCell className={cn(DOCS_CLASS.apiDescription, cls.description)}>
        {row.description}
        {row.deprecated !== undefined && <div className={DOCS_CLASS.apiEmpty}>{row.deprecated}</div>}
      </TableCell>
    </TableRow>
  );
}
