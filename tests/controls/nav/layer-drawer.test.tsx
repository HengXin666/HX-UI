/**
 * nav/menu: LayerDrawer (规格 StaggeredMenu). 时间线, 开合与图标, 层与面板位移, 侧别, 选中关闭, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DRAWER_EXIT_MS, DRAWER_ICON_DEG, LayerDrawer, drawerTimeline } from "@src/controls/nav/menu/LayerDrawer";
import { mockReducedMotion } from "./support";

const items = [{ label: "Home", href: "#home" }, { label: "About" }, { label: "Work" }];
const socials = [{ label: "GitHub", href: "#gh" }];

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const q = (slot: string): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>(`[data-slot='${slot}']`));

describe("LayerDrawer 时间线", () => {
  it("层错峰 70ms, 面板接在层后 80ms, 条目错峰 100ms, 社交区排在条目后", () => {
    const t = drawerTimeline(2, 3);
    expect(t.layer(1)).toBe(70);
    expect(t.panel).toBe(220);
    expect(t.item(0)).toBe(370);
    expect(t.item(2)).toBe(570);
    expect(t.index(1)).toBe(450);
    expect(t.social(0)).toBe(670);
  });
});

describe("LayerDrawer 交互", () => {
  it("打开: 层与面板滑到 0, 图标转到 225 度, 层的延迟递增; 收起留够离场再卸载", () => {
    vi.useFakeTimers();
    render(<LayerDrawer items={items} socials={socials} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const layers = q("layer-drawer-layer");
    expect(layers).toHaveLength(2);
    expect(layers[0]?.style.transform).toBe("translateX(0%)");
    expect(layers[1]?.style.transition).toContain("70ms");
    expect(q("layer-drawer-panel")[0]?.style.transform).toBe("translateX(0%)");
    expect(q("layer-drawer-icon")[0]?.style.transform).toBe(`rotate(${DRAWER_ICON_DEG}deg)`);
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(q("layer-drawer-panel")[0]?.style.transform).toBe("translateX(100%)");
    expect(q("layer-drawer-icon")[0]?.style.transform).toBe("rotate(0deg)");
    act(() => {
      vi.advanceTimersByTime(DRAWER_EXIT_MS);
    });
    expect(q("layer-drawer-panel")).toHaveLength(0);
  });

  it("左侧位置从左边滑入; 点条目关闭", () => {
    vi.useFakeTimers();
    render(<LayerDrawer items={items} position="left" defaultOpen />);
    const about = screen.getByRole("button", { name: /About/ });
    fireEvent.click(about);
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe("false");
    expect(q("layer-drawer-panel")[0]?.style.transform).toBe("translateX(-100%)");
  });

  it("点外部关闭可关掉; Escape 仍关闭", () => {
    render(<LayerDrawer items={items} defaultOpen closeOnClickAway={false} />);
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole("button", { name: "Close menu" }).getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("减弱动效: 过渡为 none, 收起立即卸载", () => {
    mockReducedMotion(true);
    render(<LayerDrawer items={items} socials={socials} defaultOpen />);
    expect(q("layer-drawer-panel")[0]?.style.transition).toBe("none");
    expect(q("layer-drawer-social")[0]?.style.transition).toBe("none");
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(q("layer-drawer-panel")).toHaveLength(0);
  });
});
