/**
 * Faq: 默认 details 形态不变; classNames 部件槽位合并进默认类名; variant=accordion 用库 Accordion, 搜索时命中项展开.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Faq } from "@src/blocks/marketing/Faq";

const ITEMS = [
  { id: "install", q: "怎么装?", a: "npm i @hx/ui" },
  { id: "skin", q: "怎么换肤?", a: "写 data-skin", open: true },
];
const HEADING = { title: "常见问题" };
const ITEM = "[data-slot='faq-item']";

describe("Faq", () => {
  it("默认 details 形态, 初始展开取 item.open", () => {
    const { container } = render(<Faq items={ITEMS} />);
    const items = Array.from(container.querySelectorAll(ITEM));
    expect(items.map((node) => node.tagName)).toEqual(["DETAILS", "DETAILS"]);
    expect(items[1].hasAttribute("open")).toBe(true);
    expect(container.querySelector("[data-slot='accordion']")).toBeNull();
  });

  it("classNames 部件槽位落到 item / summary / answer / list / split / aside", () => {
    const { container } = render(
      <Faq
        items={ITEMS}
        heading={HEADING}
        columns={2}
        classNames={{ item: "x-item", summary: "x-summary", answer: "x-answer", list: "x-list", split: "x-split", aside: "x-aside", root: "x-root" }}
      />,
    );
    for (const name of ["x-item", "x-summary", "x-answer", "x-list", "x-split", "x-aside", "x-root"]) {
      expect(container.querySelector(`.${name}`), name).not.toBeNull();
    }
    expect(container.querySelector("summary")?.className).toContain("x-summary");
  });

  it("variant=accordion: 库 Accordion, item.open 初始展开, 点击展开收起", async () => {
    const user = userEvent.setup();
    const { container } = render(<Faq items={ITEMS} variant="accordion" classNames={{ item: "x-card" }} />);
    expect(container.querySelector("details")).toBeNull();
    expect(container.querySelectorAll(`${ITEM}.x-card`)).toHaveLength(2);
    const install = screen.getByRole("button", { name: "怎么装?" });
    const skin = screen.getByRole("button", { name: "怎么换肤?" });
    expect(install).toHaveAttribute("aria-expanded", "false");
    expect(skin).toHaveAttribute("aria-expanded", "true");
    await user.click(install);
    expect(install).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("npm i @hx/ui")).toBeTruthy();
  });

  it("variant=accordion 搜索时命中项展开", async () => {
    const user = userEvent.setup();
    render(<Faq items={ITEMS} variant="accordion" searchable />);
    await user.type(screen.getByRole("searchbox"), "npm");
    expect(screen.queryByRole("button", { name: "怎么换肤?" })).toBeNull();
    expect(screen.getByRole("button", { name: "怎么装?" })).toHaveAttribute("aria-expanded", "true");
  });
});
