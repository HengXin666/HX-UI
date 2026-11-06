"use client";

import type * as React from "react";
import { API_TABLE_SLOTS, DOCS_CLASS, DOCS_DEFAULT, DOCS_SLOT } from "../../constants/blocks-docs-v109";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../../primitives/table";
import { cn } from "../../primitives/utils";
import { BlockShell, resolveSlots } from "../_shared/BlockShell";
import { SectionHeading } from "../_shared/SectionHeading";
import type { ApiRow, BlockBaseProps, SectionHeadingData, SlotClassNames } from "../_shared/types";
import { ApiRowView } from "./parts/ApiRows";
import { useDocsText } from "./parts/labels";

export type ApiTableSlot = (typeof API_TABLE_SLOTS)[number];

export interface ApiTableProps extends Omit<BlockBaseProps, "classNames" | "labels"> {
  rows: ReadonlyArray<ApiRow>;
  heading?: SectionHeadingData;
  /** 表格标题 (读屏 caption); 默认取 heading.title 或 "API". */
  caption?: string;
  /** 类型串折叠阈值 (字符数); 0 关闭折叠. */
  collapseAt?: number;
  /** 必填项排在前面 (稳定排序). */
  requiredFirst?: boolean;
  classNames?: SlotClassNames<ApiTableSlot>;
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLElement>;
}

/**
 * Props 表 (mantine / ant.design 文档页的 API 段): 属性 / 类型 / 默认值 / 说明, 复用 primitives/table.
 * 长类型串折叠, 必填项星标 + 读屏文案; 窄容器内横向滚动, 不压扁列.
 */
export function ApiTable({ rows, heading, caption, collapseAt = DOCS_DEFAULT.typeCollapseAt, requiredFirst = false, classNames, labels, ref, pad = "none", width = "full", ...shell }: ApiTableProps): React.JSX.Element {
  const text = useDocsText(labels);
  const cls = resolveSlots<ApiTableSlot, void, string>(classNames, undefined);
  const ordered = requiredFirst ? [...rows].sort((a, b) => Number(Boolean(b.required)) - Number(Boolean(a.required))) : rows;
  const captionText = caption ?? (typeof heading?.title === "string" ? heading.title : text.apiCaption);
  return (
    <BlockShell {...shell} pad={pad} width={width} ref={ref} heading={heading} renderHeading={heading ? (h, hid) => <SectionHeading {...h} titleId={hid} /> : undefined}>
      <div data-slot={DOCS_SLOT.api} className={cn(DOCS_CLASS.apiWrap, cls.root)}>
        <Table className={cn(DOCS_CLASS.apiTable, cls.table)}>
          <TableCaption className={DOCS_CLASS.srOnly}>{captionText}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{text.apiName}</TableHead>
              <TableHead scope="col">{text.apiType}</TableHead>
              <TableHead scope="col">{text.apiDefault}</TableHead>
              <TableHead scope="col">{text.apiDescription}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className={DOCS_CLASS.apiEmpty}>
                  {text.empty}
                </TableCell>
              </TableRow>
            ) : (
              ordered.map((row) => <ApiRowView key={row.name} row={row} text={text} collapseAt={collapseAt} cls={cls} />)
            )}
          </TableBody>
        </Table>
      </div>
    </BlockShell>
  );
}
