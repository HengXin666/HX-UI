/**
 * kits/card: FoilCard (规格 HoloCard). 色带, 图案, 闲置漂移, 色带横移, 倾斜与放大, 翻面, 闲置, 减弱动效.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOIL_SPECTRUM, FoilCard, foilIdle, foilPattern, foilRainbow, foilShift } from "@src/kits/card/FoilCard";
import { boxOf, manualFrames, mockReducedMotion } from "./support";

const face = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='foil-card-face']") as HTMLElement;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FoilCard 纯函数", () => {
  it("色带六段闭合, 只引用光谱令牌", () => {
    const g = foilRainbow(90);
    expect(g.startsWith("linear-gradient(90deg, var(--spectrum-1) 0.0%")).toBe(true);
    expect(g.endsWith("var(--spectrum-1) 100.0%)")).toBe(true);
    expect(FOIL_SPECTRUM).toHaveLength(6);
    expect(g.replace(/var\(--spectrum-\d\)/g, "")).not.toMatch(/#|rgb|hsl|oklch|[a-z]{4,}\s\d/);
  });

  it("光谱令牌在亮暗两套里都有值", () => {
    const css = readFileSync(resolve("src/tokens.css"), "utf8");
    for (const mode of [':root, [data-mode="dark"] {', '[data-mode="light"] {']) {
      const at = css.indexOf(`${mode}\n    --spectrum-1:`);
      expect(at, mode).toBeGreaterThan(0);
      const body = css.slice(at, css.indexOf("}", at));
      for (let i = 1; i <= 6; i += 1) expect(body).toMatch(new RegExp(`--spectrum-${i}: var\\(--palette-`));
    }
  });

  it("图案随 scale 放大格距", () => {
    expect(foilPattern("dots", 2)).toContain("/ 18.0px 18.0px");
    expect(foilPattern("plain", 1)).toBe("linear-gradient(black, black)");
  });

  it("闲置幅度 = tiltMax × 0.3; 倾满时色带到一端", () => {
    expect(foilIdle(0, 14)).toEqual({ rx: 0, ry: 0 });
    expect(foilIdle(7 / 4, 10).ry).toBeCloseTo(3, 9);
    expect(foilShift(14, -14, 14)).toEqual({ x: 100, y: 100 });
  });
});

describe("FoilCard 交互", () => {
  it("指针左上: 倾向左上并放大, 色带横移; 离开归位", () => {
    const frames = manualFrames();
    render(<FoilCard image="a.png" alt="card" idle={false} />);
    boxOf(face(), 0, 0, 320, 447);
    act(() => {
      fireEvent.pointerMove(face(), { clientX: 0, clientY: 0 });
      frames.flush(300);
    });
    expect(face().style.transform).toBe("rotateX(14.00deg) rotateY(-14.00deg) scale(1.0400)");
    expect(face().style.getPropertyValue("--fx")).toBe("0.0%");
    act(() => {
      fireEvent.pointerLeave(face());
      frames.flush(400);
    });
    expect(face().style.transform).toBe("rotateX(0.00deg) rotateY(0.00deg) scale(1.0000)");
  });

  it("无背面是 img; 有背面点击与键盘翻面", () => {
    const frames = manualFrames();
    const { unmount } = render(<FoilCard image="a.png" alt="front" idle={false} />);
    expect(screen.getByRole("img", { name: "front" })).toBeTruthy();
    unmount();
    render(<FoilCard image="a.png" backImage="b.png" alt="card" idle={false} />);
    const btn = screen.getByRole("button", { name: "card" });
    fireEvent.click(btn);
    act(() => frames.flush(400));
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(btn.style.transform).toContain("rotateY(180.00deg)");
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("idle: 无指针时漂移", () => {
    const frames = manualFrames();
    render(<FoilCard image="a.png" />);
    act(() => frames.flush(60));
    expect(face().style.transform).not.toBe("rotateX(0.00deg) rotateY(0.00deg) scale(1.0000)");
  });

  it("减弱动效: 不漂移不倾斜", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<FoilCard image="a.png" />);
    boxOf(face(), 0, 0, 320, 447);
    act(() => {
      fireEvent.pointerMove(face(), { clientX: 0, clientY: 0 });
      frames.flush(60);
    });
    expect(face().style.transform).toBe("rotateX(0.00deg) rotateY(0.00deg) scale(1.0000)");
  });
});
