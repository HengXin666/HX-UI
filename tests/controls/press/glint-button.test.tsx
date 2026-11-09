/**
 * GlintButton (规格 SpecularButton): 纯逻辑, 渲染, 键盘, 加载与禁用, 减弱动效终态, 指针跟随.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PRESS_SCALE } from "@src/craft/tokens";
import {
  arcDeg, edgeDistance, GLINT_DEFAULTS, GLINT_RATES, GLINT_REST_DEG, glintVars, pointerDeg, proximityLevel, ringGradient, shownLevel, stepGlint, wrapDeg,
  type GlintState,
} from "@src/controls/press/signal/glint";
import { GLINT_DISABLED_OPACITY, GLINT_SPIN_MS, GlintButton } from "@src/controls/press/signal/GlintButton";
import { mockReducedMotion, useFakeClock } from "./helpers";

const BOX = { left: 0, top: 0, width: 100, height: 40 };

function stubRect(el: HTMLElement): void {
  el.getBoundingClientRect = () => ({ ...BOX, x: 0, y: 0, right: 100, bottom: 40, toJSON: () => BOX }) as DOMRect;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("glint 纯逻辑", () => {
  it("规格常数", () => {
    expect(GLINT_RATES).toEqual({ spot: 8, level: 7, press: 5 });
    expect(GLINT_DEFAULTS).toMatchObject({ intensity: 1, idleIntensity: 0.35, shineSize: 10, shineFade: 34, glow: 1, speed: 0.35, proximity: 250, tintOpacity: 0.04, blur: 0 });
  });

  it("角度折叠与方位: 0 正上, 顺时针", () => {
    expect(wrapDeg(350)).toBeCloseTo(-10, 6);
    expect(wrapDeg(-190)).toBeCloseTo(170, 6);
    expect(wrapDeg(180)).toBe(180);
    expect(pointerDeg(BOX, 50, -10)).toBeCloseTo(0, 6);
    expect(pointerDeg(BOX, 200, 20)).toBeCloseTo(90, 6);
    expect(pointerDeg(BOX, 50, 100)).toBeCloseTo(180, 6);
    expect(pointerDeg(BOX, -50, 20)).toBeCloseTo(270, 6);
  });

  it("距离与亮度", () => {
    expect(edgeDistance(BOX, 50, 20)).toBe(0);
    expect(edgeDistance(BOX, 103, 44)).toBeCloseTo(5, 6);
    expect(proximityLevel(0, 250, 0.35, 1)).toBe(1);
    expect(proximityLevel(250, 250, 0.35, 1)).toBeCloseTo(0.35, 6);
    expect(proximityLevel(125, 250, 0.35, 1)).toBeCloseTo(0.675, 6);
  });

  it("stepGlint 走短边, 收敛并落定; 闪光衰减; 亮度钳到 1", () => {
    const s: GlintState = { spot: 350, level: 0, press: 1 };
    stepGlint(s, { spot: 10, level: 1 }, 1 / 60);
    expect(s.spot).toBeGreaterThan(350);
    expect(shownLevel({ spot: 0, level: 0.9, press: 1 })).toBe(1);
    let settled = false;
    for (let i = 0; i < 600 && !settled; i += 1) settled = stepGlint(s, { spot: 10, level: 1 }, 1 / 60);
    expect(settled).toBe(true);
    expect(s.spot).toBeCloseTo(10, 0);
  });

  it("弧长换角, 渐变串只读变量", () => {
    expect(arcDeg(28, 100, 40)).toBeCloseTo(36, 6);
    expect(arcDeg(10, 0, 0)).toBe(0);
    expect(ringGradient("primary")).toContain("var(--primary)");
    expect(ringGradient("primary")).toContain("var(--hx-glint-spot)");
    expect(glintVars({ spot: 90, level: 0.5, press: 0 })).toMatchObject({ "--hx-glint-spot": "90deg", "--hx-glint-level": "0.5", "--hx-glint-x": "100%" });
  });
});

describe("GlintButton", () => {
  it("渲染: 原生按钮, type=button, 点击回调", () => {
    const onClick = vi.fn();
    render(<GlintButton onClick={onClick}>Go</GlintButton>);
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("focus-visible:outline-offset-2");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("加载: 标签隐去仍占位, 圆点 800ms, 不响应点击", () => {
    const onClick = vi.fn();
    const { container } = render(<GlintButton loading onClick={onClick}>Save</GlintButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Save").className).toContain("invisible");
    expect(container.querySelector(".animate-spin")?.getAttribute("style")).toContain(`${GLINT_SPIN_MS}ms`);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("禁用: disabled, 不透明度 0.45, 按下不缩放", () => {
    const restore = mockReducedMotion(true);
    const { container } = render(<GlintButton disabled>Off</GlintButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.style.opacity).toBe(String(GLINT_DISABLED_OPACITY));
    fireEvent.pointerDown(button, { button: 0 });
    expect(container.querySelector("[data-slot=glint-face]")?.getAttribute("style") ?? "").not.toContain("scale");
    restore();
  });

  it("减弱动效: 高光停左上, 亮度 idle; 悬停直接到 intensity; 键盘按下直接到 0.97 + 1px", () => {
    const restore = mockReducedMotion(true);
    const { container } = render(<GlintButton>Key</GlintButton>);
    const button = screen.getByRole("button");
    expect(button.style.getPropertyValue("--hx-glint-spot")).toBe(`${GLINT_REST_DEG}deg`);
    expect(button.style.getPropertyValue("--hx-glint-level")).toBe("0.35");
    fireEvent.pointerEnter(button);
    expect(button.style.getPropertyValue("--hx-glint-level")).toBe("1");
    fireEvent.keyDown(button, { key: "Enter" });
    const face = container.querySelector("[data-slot=glint-face]") as HTMLElement;
    expect(face.style.transform).toContain(`scale(${PRESS_SCALE})`);
    expect(face.style.transform).toContain("1px");
    fireEvent.keyUp(button, { key: "Enter" });
    expect(face.style.transform).toContain("scale(1)");
    restore();
  });

  it("指针跟随: 高光转向指针方位, 亮度升向 intensity", () => {
    const restore = mockReducedMotion(false);
    useFakeClock();
    render(<GlintButton>Follow</GlintButton>);
    const button = screen.getByRole("button");
    stubRect(button);
    act(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 200, clientY: 20 }) as PointerEvent);
    });
    act(() => vi.advanceTimersByTime(2000));
    expect(parseFloat(button.style.getPropertyValue("--hx-glint-spot"))).toBeCloseTo(90, 0);
    expect(parseFloat(button.style.getPropertyValue("--hx-glint-level"))).toBeGreaterThan(0.6);
    restore();
  });
});
