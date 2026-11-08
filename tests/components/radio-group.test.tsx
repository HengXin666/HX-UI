/**
 * RadioGroup: 默认圆点指示器不变, indicator 可替换或关掉 (整张卡当选项), 方向键与 aria 仍由 RadioGroup 管.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RadioGroup, RadioGroupItem } from "@src/primitives/radio-group";

const INDICATOR = "[data-slot='radio-group-indicator']";

describe("RadioGroupItem", () => {
	it("默认渲染圆点指示器与圆形外形", () => {
		const { container } = render(
			<RadioGroup aria-label="尺寸" defaultValue="s">
				<RadioGroupItem value="s" aria-label="小" />
				<RadioGroupItem value="m" aria-label="中" />
			</RadioGroup>,
		);
		const item = screen.getByRole("radio", { name: "小" });
		expect(item.className).toContain("rounded-full");
		expect(container.querySelectorAll(INDICATOR)).toHaveLength(1);
	});

	it("indicator 给节点时替换圆点", () => {
		render(
			<RadioGroup aria-label="尺寸" defaultValue="s">
				<RadioGroupItem value="s" aria-label="小" indicator={<span data-testid="tick">ok</span>} />
			</RadioGroup>,
		);
		expect(screen.getByTestId("tick").closest(INDICATOR)).not.toBeNull();
	});

	it("indicator=false 不出指示器, 整张卡可选, 方向键漫游与 aria-checked 照旧", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<RadioGroup aria-label="背景预设" defaultValue="grid">
				<RadioGroupItem value="grid" indicator={false} className="rounded-lg border border-border p-2">
					网格
				</RadioGroupItem>
				<RadioGroupItem value="dots" indicator={false} className="rounded-lg border border-border p-2">
					圆点
				</RadioGroupItem>
			</RadioGroup>,
		);
		expect(container.querySelector(INDICATOR)).toBeNull();
		const grid = screen.getByRole("radio", { name: "网格" });
		const dots = screen.getByRole("radio", { name: "圆点" });
		expect(grid.className).not.toContain("rounded-full");
		expect(grid).toHaveAttribute("aria-checked", "true");
		await user.tab();
		expect(grid).toHaveFocus();
		await user.keyboard("{ArrowDown}");
		expect(dots).toHaveFocus();
		// happy-dom 下 radix 不在方向键聚焦时自动选中, 用 Space 选中 (APG 同样允许)
		await user.keyboard(" ");
		expect(dots).toHaveAttribute("aria-checked", "true");
		expect(grid).toHaveAttribute("aria-checked", "false");
		await expect(document.body).toHaveNoSeriousA11yViolations();
	});
});
