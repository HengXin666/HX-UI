/**
 * kits/glass: FrostPanel (规格 GlassSurface). 色道位移量, 位移图, 渲染判定, 退回滤镜, SVG 滤镜结构, 减弱动效.
 */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FrostPanel, frostFallbackFilter, frostMap, frostScales, svgBackdropSupported } from "@src/kits/glass/FrostPanel";
import { mockReducedMotion } from "../stack/support";

const panel = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='frost-panel']") as HTMLElement;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FrostPanel 纯函数", () => {
  it("三道位移 = distortionScale + 各自偏移", () => {
    expect(frostScales(-180, 0, 10, 20)).toEqual([-180, -170, -160]);
  });

  it("位移图: 关键字颜色, 边缘按 borderWidth 收, 中心块透明度 = 亮度 × opacity", () => {
    const svg = frostMap(200, 80, 20, 0.07, 50, 0.93, 11, "difference");
    expect(svg).toContain('x="2.80" y="2.80" width="194.40" height="74.40"');
    expect(svg).toContain('fill="white" fill-opacity="0.465"');
    expect(svg).toContain("mix-blend-mode:difference");
    expect(svg).toContain('stop-color="red"');
    expect(svg).not.toMatch(/#[0-9a-f]{3}|rgb|hsl/i);
  });

  it("只有 Chromium 且 CSS.supports 认 url() 时用 SVG", () => {
    vi.stubGlobal("CSS", { supports: () => true });
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 AppleWebKit Version/17 Safari/605");
    expect(svgBackdropSupported()).toBe(false);
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Chrome/130 Safari/537");
    expect(svgBackdropSupported()).toBe(true);
  });

  it("退回滤镜", () => {
    expect(frostFallbackFilter(11, 1)).toBe("blur(11px) saturate(1.80) brightness(1.1)");
  });
});

describe("FrostPanel 渲染", () => {
  it("auto 在不支持时退回模糊, 无 SVG 滤镜", () => {
    render(<FrostPanel>Hi</FrostPanel>);
    expect(panel().dataset.renderer).toBe("fallback");
    expect(document.querySelector("[data-slot='frost-panel-filter']")).toBeNull();
    expect(panel().textContent).toBe("Hi");
  });

  it("svg: 三道位移按各自 scale, 共用通道选择, screen 合成", () => {
    render(<FrostPanel renderer="svg" xChannel="B" yChannel="A" />);
    expect(panel().dataset.renderer).toBe("svg");
    const maps = [...document.querySelectorAll("feDisplacementMap")];
    expect(maps.map((m) => m.getAttribute("scale"))).toEqual(["-180", "-170", "-160"]);
    expect(maps[0]?.getAttribute("xChannelSelector")).toBe("B");
    expect(maps[0]?.getAttribute("yChannelSelector")).toBe("A");
    expect([...document.querySelectorAll("feBlend")].map((x) => x.getAttribute("mode"))).toEqual(["screen", "screen"]);
    expect(document.querySelector("feImage")?.getAttribute("href")).toMatch(/^data:image\/svg\+xml,/);
  });

  it("出现时淡入 0.26s; 减弱动效时不过渡", () => {
    const { unmount } = render(<FrostPanel />);
    expect(panel().style.opacity).toBe("1");
    expect(panel().style.transition).toContain("opacity 260ms ease-out");
    unmount();
    mockReducedMotion(true);
    render(<FrostPanel />);
    expect(panel().style.transition).toBe("none");
  });
});
