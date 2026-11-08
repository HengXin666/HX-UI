/**
 * TestimonialMarquee: 默认横向不变; direction=vertical 时多列纵向, 相邻列反向, 按列时长, 窄屏只留第一列.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TestimonialMarquee } from "@src/blocks/marketing/social-proof/TestimonialTracks";

const LABELS = { previous: "上一条", next: "下一条", pause: "暂停", play: "播放" };
const SLIDES = ["a", "b", "c", "d", "e", "f"].map((id) => <p key={id}>{id}</p>);
const DURATION_VAR = "--hx-marquee-duration";

function tracks(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".hx-marquee"));
}

describe("TestimonialMarquee", () => {
  it("默认横向: 一条轨道, 用 duration, 不带纵向标记", () => {
    const { container } = render(<TestimonialMarquee slides={SLIDES} duration={30} labels={LABELS} />);
    const [only, ...rest] = tracks(container);
    expect(rest).toHaveLength(0);
    expect(only.getAttribute("data-orientation")).toBe("horizontal");
    expect(only.style.getPropertyValue(DURATION_VAR)).toBe("30s");
    expect(container.firstElementChild?.hasAttribute("data-orientation")).toBe(false);
  });

  it("纵向三列: 相邻列反向, 每列时长取 durations, 第二列起窄屏隐藏", () => {
    const { container } = render(
      <TestimonialMarquee slides={SLIDES} rows={3} direction="vertical" durations={[70, 86]} duration={50} labels={LABELS} />,
    );
    const lanes = tracks(container);
    expect(lanes).toHaveLength(3);
    expect(lanes.every((lane) => lane.getAttribute("data-orientation") === "vertical")).toBe(true);
    expect(lanes.map((lane) => lane.hasAttribute("data-reverse"))).toEqual([false, true, false]);
    expect(lanes.map((lane) => lane.style.getPropertyValue(DURATION_VAR))).toEqual(["70s", "86s", "50s"]);
    expect(lanes[0].className).not.toContain("hidden");
    expect(lanes[1].className).toContain("hidden");
    expect(lanes[2].className).toContain("hidden");
    expect(lanes.every((lane) => lane.hasAttribute("data-pause-on-hover"))).toBe(true);
    expect(container.firstElementChild?.getAttribute("data-orientation")).toBe("vertical");
  });

  it("纵向最多四列, 暂停键照旧可用", async () => {
    const user = userEvent.setup();
    const { container } = render(<TestimonialMarquee slides={SLIDES} rows={6} direction="vertical" labels={LABELS} />);
    expect(tracks(container)).toHaveLength(4);
    await user.click(screen.getByRole("button", { name: "暂停" }));
    expect(screen.getByRole("button", { name: "播放" })).toBeTruthy();
  });
});
