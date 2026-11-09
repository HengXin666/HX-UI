/**
 * nav/menu: DeckNav (规格 CardNav). 错峰预算, 展开弹簧, 卡片姿态, 开合, hover 模式, 链接关闭, 减弱动效.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DECK_BAR, DeckNav, deckCard, deckLag, deckSpring } from "@src/controls/nav/menu/DeckNav";
import { manualFrames, mockReducedMotion } from "./support";

const items = [
  { label: "About", links: [{ label: "Company", href: "#company" }, { label: "Careers", href: "#careers" }] },
  { label: "Projects", links: [{ label: "Featured", href: "#featured" }] },
  { label: "Contact", links: [{ label: "Email", href: "#email" }] },
];

afterEach(() => vi.restoreAllMocks());

describe("DeckNav 纯函数", () => {
  it("错峰: min(stagger, 0.7 / (n - 1)), stagger 钳到 0.3, 单张为 0", () => {
    expect(deckLag(0.12, 3)).toBe(0.12);
    expect(deckLag(0.3, 8)).toBeCloseTo(0.1, 12);
    expect(deckLag(1, 2)).toBe(0.3);
    expect(deckLag(0.12, 1)).toBe(0);
  });

  it("展开弹簧: speed 越大越硬, bounce 0 为临界阻尼", () => {
    expect(deckSpring(0.2, 2).stiffness).toBeGreaterThan(deckSpring(0.2, 1).stiffness);
    const crit = deckSpring(0, 1);
    expect(crit.damping).toBeCloseTo(2 * Math.sqrt(crit.stiffness * crit.mass), 6);
  });

  it("卡片姿态: 未展开下沉 0.3 倍卡高且透明", () => {
    expect(deckCard(false, 100)).toEqual({ transform: "translateY(30px)", opacity: 0 });
    expect(deckCard(true, 100)).toEqual({ transform: "translateY(0px)", opacity: 1 });
  });
});

describe("DeckNav 交互", () => {
  it("开关展开卡片, 卡片按错峰延迟; 点链接回调并收起", () => {
    manualFrames();
    const onLinkClick = vi.fn();
    const { container } = render(<DeckNav items={items} onLinkClick={onLinkClick} />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(container.querySelectorAll("[data-slot='deck-nav-card']")).toHaveLength(0);
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const cards = container.querySelectorAll<HTMLElement>("[data-slot='deck-nav-card']");
    expect(cards).toHaveLength(3);
    expect(cards[0]?.style.opacity).toBe("1");
    expect(cards[2]?.style.transition).toContain("240ms");
    fireEvent.click(screen.getByRole("link", { name: "Careers" }));
    expect(onLinkClick).toHaveBeenCalledWith("#careers");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("hover 模式: 指针进出整条开合", () => {
    manualFrames();
    const { container } = render(<DeckNav items={items} openOn="hover" />);
    const nav = container.querySelector("[data-slot='deck-nav']") as HTMLElement;
    fireEvent.pointerEnter(nav);
    expect(screen.getByRole("button", { name: "Close menu" }).getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerLeave(nav);
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("Escape 关闭; 行动按钮可点", () => {
    manualFrames();
    const onClick = vi.fn();
    render(<DeckNav items={items} defaultOpen cta={{ label: "Start", onClick }} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("减弱动效: 外框高度直接落定, 卡片过渡为 none", () => {
    mockReducedMotion(true);
    manualFrames();
    const { container } = render(<DeckNav items={items} defaultOpen />);
    const card = container.querySelector<HTMLElement>("[data-slot='deck-nav-card']");
    expect(card?.style.transition).toBe("none");
    const frame = container.querySelector("[data-slot='deck-nav']")?.firstElementChild as HTMLElement;
    expect(frame.style.height).toBe(`${DECK_BAR}px`);
  });
});
