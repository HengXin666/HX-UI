/**
 * 页面层: definePage 的描述按默认注册表渲染, createPage 合并自定义区块, 可视化区块带标题组.
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createPage, definePage, Page, section } from "@src/page";

describe("Page", () => {
  it("renders a spec through the default registry", () => {
    const spec = definePage({
      sections: [
        section("funnel", {
          id: "funnel",
          heading: { title: "转化漏斗" },
          label: "本月转化",
          stages: [
            { id: "visit", label: "访问", value: 1000 },
            { id: "pay", label: "支付", value: 120 },
          ],
        }),
        {
          type: "flow",
          props: {
            heading: { title: "履约流程" },
            label: "履约",
            nodes: [{ id: "a", label: "下单" }],
            edges: [],
          },
        },
      ],
    });
    const { container } = render(<Page spec={spec} />);
    expect(screen.getByRole("heading", { name: "转化漏斗" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "履约流程" })).toBeTruthy();
    expect(container.querySelector("#funnel")).toBeTruthy();
    expect(container.querySelector("main")).toBeTruthy();
  });

  it("merges custom sections with createPage", () => {
    function Banner({ text }: { text: string }): React.JSX.Element {
      return <p>{text}</p>;
    }
    const kit = createPage({ banner: Banner });
    const spec = kit.define({ sections: [{ type: "banner", props: { text: "限时九折" } }] });
    render(<kit.Page spec={spec} as="div" />);
    expect(screen.getByText("限时九折")).toBeTruthy();
  });
});
