/**
 * kits/card: BadgeCard (规格 ProfileCard). 全息带, 视差, 入场扫光, 倾斜与归位, 光感, 联系按钮, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BadgeCard, badgeHolo, badgeIntro, badgeParallax } from "@src/kits/card/BadgeCard";
import { boxOf, manualFrames, mockReducedMotion } from "./support";

const card = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='badge-card']") as HTMLElement;
const v = (name: string): string => card().style.getPropertyValue(name);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("BadgeCard 纯函数", () => {
  it("全息带首尾同色闭合; 视差逆向; 扫光左到右再回中", () => {
    expect(badgeHolo(["var(--a)", "var(--b)"])).toBe("linear-gradient(115deg, var(--a) 0%, var(--b) 50%, var(--a) 100%)");
    expect(badgeParallax(1, -0.5, 8)).toEqual({ x: -8, y: 4 });
    expect(badgeIntro(0.3)).toBeCloseTo(0.5, 9);
    expect(badgeIntro(0.6)).toBe(1);
    expect(badgeIntro(0.9)).toBeCloseTo(0.75, 9);
    expect(badgeIntro(2)).toBe(0.5);
  });
});

describe("BadgeCard 交互", () => {
  it("指针右上: 卡面倾向指针, 头像逆向, 光感升满; 离开归位", () => {
    const frames = manualFrames();
    render(<BadgeCard name="Ada" avatarUrl="a.png" intro={false} />);
    boxOf(card(), 0, 0, 200, 280);
    act(() => {
      fireEvent.pointerMove(card(), { clientX: 200, clientY: 0 });
      frames.flush(300);
    });
    expect(v("--rx")).toBe("12.00deg");
    expect(v("--ry")).toBe("12.00deg");
    expect(v("--ax")).toBe("-8.00px");
    expect(v("--light")).toBe("1.000");
    expect(v("--px")).toBe("100.0%");
    act(() => {
      fireEvent.pointerLeave(card());
      frames.flush(400);
    });
    expect(v("--rx")).toBe("0.00deg");
    expect(v("--light")).toBe("0.000");
  });

  it("入场扫一次光后熄灭回中", () => {
    const frames = manualFrames();
    render(<BadgeCard name="Ada" />);
    act(() => frames.flush(30));
    expect(Number(v("--light"))).toBeGreaterThan(0.5);
    act(() => frames.flush(120));
    expect(v("--light")).toBe("0.000");
    expect(v("--px")).toBe("50.0%");
  });

  it("信息条与联系按钮", () => {
    manualFrames();
    const contact = vi.fn();
    render(<BadgeCard name="Ada" handle="ada" status="Online" contactText="Ping" onContactClick={contact} intro={false} />);
    expect(screen.getByRole("article", { name: "Ada" })).toBeTruthy();
    expect(screen.getByText("@ada")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ping" }));
    expect(contact).toHaveBeenCalledOnce();
  });

  it("减弱动效: 不倾斜, 无视差与扫光", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<BadgeCard name="Ada" />);
    boxOf(card(), 0, 0, 200, 280);
    act(() => {
      fireEvent.pointerMove(card(), { clientX: 200, clientY: 0 });
      frames.flush(3);
    });
    expect(v("--rx")).toBe("0.00deg");
    expect(v("--ax")).toBe("0.00px");
    expect(v("--light")).toBe("1.000");
  });
});
