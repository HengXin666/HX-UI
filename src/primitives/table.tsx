import * as React from "react";
import { cn } from "./utils";

/**
 * 表格原语 (对标 shadcn Table): 只给语义元素加样式, 排序 / 分页 / 空态由调用方组合.
 *
 * 需要粘性表头, 空 / 加载态与行点击的完整数据表时用 DataTable, 它内部同样是原生 table.
 * 外层 div 负责横向滚动, 窄屏下表格不会把页面撑宽.
 */
function Table({ className, ...props }: React.ComponentProps<"table">): React.JSX.Element {
	return (
		<div data-slot="table-container" className="relative w-full overflow-x-auto">
			<table data-slot="table" className={cn("w-full caption-bottom text-[13px]", className)} {...props} />
		</div>
	);
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">): React.JSX.Element {
	return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">): React.JSX.Element {
	return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">): React.JSX.Element {
	return <tfoot data-slot="table-footer" className={cn("border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">): React.JSX.Element {
	return (
		<tr
			data-slot="table-row"
			className={cn("border-b border-border-muted transition-colors duration-(--duration-fast) hover:bg-accent/40 data-[state=selected]:bg-accent/60", className)}
			{...props}
		/>
	);
}

function TableHead({ className, ...props }: React.ComponentProps<"th">): React.JSX.Element {
	return (
		<th
			data-slot="table-head"
			className={cn(
				"h-9 px-3 text-left align-middle text-[12px] font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
				className,
			)}
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.ComponentProps<"td">): React.JSX.Element {
	return <td data-slot="table-cell" className={cn("px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0", className)} {...props} />;
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">): React.JSX.Element {
	return <caption data-slot="table-caption" className={cn("mt-3 text-[12.5px] text-muted-foreground", className)} {...props} />;
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
