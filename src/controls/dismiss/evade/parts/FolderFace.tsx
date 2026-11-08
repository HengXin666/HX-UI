// StashFolder 的文件夹本体: 底板, 露出的纸, 按开合角翻转的前盖与标题; 整块是打开菜单的按钮.
import type { JSX } from "react";
import { DISMISS_EASE_OUT, STASH } from "../../tokens";

const TWO = 2;
const ARIA_TRUE = "true";

interface FolderFaceProps {
	readonly menuId: string;
	readonly open: boolean;
	readonly setOpen: (open: boolean) => void;
	readonly label: string;
	readonly sublabel: string;
	readonly radius: number;
	readonly lift: number;
	readonly flapAngle: number;
	readonly restAngle: number;
	/** 打开曲线 (带回弹的 cubic-bezier). */
	readonly curve: string;
	readonly openMs: number;
	readonly closeMs: number;
}

export function FolderFace({ menuId, open, setOpen, label, sublabel, radius, lift, flapAngle, restAngle, curve, openMs, closeMs }: FolderFaceProps): JSX.Element {
	return (
		<button
			type="button"
			aria-haspopup="menu"
			aria-expanded={open}
			aria-controls={menuId}
			onClick={() => setOpen(!open)}
			onKeyDown={(event) => {
				if (event.key === "Escape") setOpen(false);
				if (event.key === "ArrowDown" && !open) {
					event.preventDefault();
					setOpen(true);
				}
			}}
			className="absolute inset-0 outline-none focus-visible:ring-1 focus-visible:ring-ring"
			style={{ borderRadius: radius }}
		>
			<span aria-hidden={ARIA_TRUE} className="absolute inset-0 border border-border bg-muted" style={{ borderRadius: radius }} />
			<span
				aria-hidden={ARIA_TRUE}
				className="absolute inset-x-3 top-3 bottom-6 rounded-md border border-border bg-card"
				style={{ transform: open ? `translateY(-${lift / TWO}px)` : undefined, transition: `transform ${openMs}ms ${curve}` }}
			/>
			<span
				className="absolute inset-x-0 bottom-0 flex h-3/5 flex-col justify-end border border-border bg-secondary p-3 text-left text-secondary-foreground motion-reduce:transition-none"
				style={{
					borderRadius: radius,
					transformOrigin: "50% 100%",
					transform: `rotateX(${open ? flapAngle : restAngle}deg)`,
					transition: `transform ${open ? openMs : closeMs}ms ${open ? curve : DISMISS_EASE_OUT}`,
				}}
			>
				<span className="text-sm font-medium">{label}</span>
				{sublabel ? (
					<span className="text-xs text-muted-foreground" style={{ opacity: open ? 1 : 0, transition: `opacity ${STASH.labelFadeMs}ms ease` }}>
						{sublabel}
					</span>
				) : null}
			</span>
		</button>
	);
}
