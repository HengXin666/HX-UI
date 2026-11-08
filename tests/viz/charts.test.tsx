/**
 * 可视化层: 渲染语义, 键盘在柱子与流程节点间移动, aria-live 读数跟随当前项.
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BarChart } from "@src/viz/charts/BarChart";
import { Ring } from "@src/viz/charts/Ring";
import { Trend } from "@src/viz/charts/Trend";
import { FlowGraph } from "@src/viz/flow/FlowGraph";
import { Funnel } from "@src/viz/flow/Funnel";
import { Timeline } from "@src/viz/flow/Timeline";

const bars = [
  { id: "mon", label: "周一", value: 12 },
  { id: "tue", label: "周二", value: 30 },
  { id: "wed", label: "周三", value: 18 },
];

describe("BarChart", () => {
  it("moves with arrow keys and announces the active bar", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BarChart data={bars} label="本周订单" onValueChange={onValueChange} />);
    expect(screen.getByRole("group", { name: "本周订单" })).toBeTruthy();
    const first = screen.getByRole("button", { name: "周一 12" });
    expect(first.getAttribute("aria-pressed")).toBe("true");
    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith("tue");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "周二 30" }));
    expect(screen.getByText("周二: 30")).toBeTruthy();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith("wed");
  });

  it("keeps rendering when data grows past the axis", () => {
    const { rerender } = render(<BarChart data={bars} label="本周订单" />);
    rerender(<BarChart data={[...bars, { id: "thu", label: "周四", value: 240 }]} label="本周订单" />);
    expect(screen.getByRole("button", { name: "周四 240" })).toBeTruthy();
  });
});

describe("Trend / Ring / Funnel", () => {
  it("reads the latest value", () => {
    render(<Trend values={[1, 4, 3, 9]} label="日活" />);
    expect(screen.getByText("9")).toBeTruthy();
  });

  it("exposes progressbar semantics", () => {
    render(<Ring value={42} label="完成度" />);
    const bar = screen.getByRole("progressbar", { name: "完成度" });
    expect(bar.getAttribute("aria-valuenow")).toBe("42");
  });

  it("writes stage-to-stage conversion", () => {
    render(
      <Funnel
        label="转化"
        stages={[
          { id: "visit", label: "访问", value: 1000 },
          { id: "cart", label: "加购", value: 250 },
        ]}
      />,
    );
    expect(screen.getByText("25.0%")).toBeTruthy();
  });
});

describe("FlowGraph", () => {
  it("walks nodes column first and shows the detail", async () => {
    const user = userEvent.setup();
    render(
      <FlowGraph
        label="订单流程"
        nodes={[
          { id: "a", label: "下单", detail: "用户提交订单" },
          { id: "b", label: "支付", detail: "第三方支付回调" },
        ]}
        edges={[{ from: "a", to: "b" }]}
      />,
    );
    expect(screen.getByText("用户提交订单")).toBeTruthy();
    screen.getByRole("button", { name: "下单" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "支付" }));
    expect(screen.getByText("第三方支付回调")).toBeTruthy();
  });
});

describe("Timeline", () => {
  it("marks the active milestone", () => {
    render(
      <Timeline
        label="路线图"
        items={[
          { id: "1", when: "Q1", title: "内测", status: "done" },
          { id: "2", when: "Q2", title: "公测", status: "active" },
        ]}
      />,
    );
    const active = screen.getByText("公测").closest("li");
    expect(active?.getAttribute("aria-current")).toBe("step");
  });
});

void React;
