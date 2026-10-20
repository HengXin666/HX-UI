import { type JSX } from "react";
import { BUTTON_TYPE, SidebarNavIcon } from "@hx/ui";
import type { DocEntry } from "../nav";
import { DEFAULT_NAV_ICON, NAV_ICONS } from "../navIcons";

export interface DocsNavProps {
	readonly groups: readonly string[];
	readonly docs: readonly DocEntry[];
	readonly active: string;
	readonly openGroups: readonly string[];
	readonly onToggle: (group: string) => void;
	readonly onGo: (id: string) => void;
}

/** 分组 id 只允许 URL 安全字符: 分组名里有空格时 aria-controls 会被拆成两个 id. */
function groupIdOf(group: string, index: number): string {
	const slug = group.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
	return "docs-group-" + (slug || String(index));
}

/** 左侧分组导航: 每组可折叠, 当前页高亮. */
export function DocsNav({
	groups, docs, active, openGroups, onToggle, onGo,
}: DocsNavProps): JSX.Element {
	return (
		<nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2.5 pb-2.5">
			{groups.map((group, index) => {
				const open = openGroups.includes(group);
				const list = docs.filter((entry) => entry.group === group);
				const id = groupIdOf(group, index);
				return (
					<div key={group}>
						<button
							type={BUTTON_TYPE}
							aria-expanded={open}
							aria-controls={id}
							onClick={() => onToggle(group)}
							className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground/80 transition-colors hover:bg-accent/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
						>
							<span className="min-w-0 flex-1 truncate text-left">{group}</span>
							<span className="text-[10px] tabular-nums text-muted-foreground/50">{list.length}</span>
							<span
								aria-hidden
								className={`icon-[solar--alt-arrow-down-linear] size-3 shrink-0 bg-current transition-transform ${open ? "" : "-rotate-90"}`}
							/>
						</button>
						<div id={id} className={`${open ? "flex" : "hidden"} mt-0.5 flex-col gap-px`}>
							{list.map((entry) => (
								<a
									key={entry.id}
									href={`#/${entry.id}`}
									aria-current={entry.id === active ? "page" : undefined}
									onClick={(event) => {
										if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
										event.preventDefault();
										onGo(entry.id);
									}}
									className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
										entry.id === active
											? "bg-primary/10 font-semibold text-foreground ring-1 ring-inset ring-primary/25"
											: "text-foreground hover:bg-accent/50"
									}`}
								>
									<SidebarNavIcon icon={NAV_ICONS[entry.id] ?? DEFAULT_NAV_ICON} />
									<span className="min-w-0 flex-1 truncate">{entry.label}</span>
								</a>
							))}
						</div>
					</div>
				);
			})}
		</nav>
	);
}
