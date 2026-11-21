/**
 * 批 7: PageSpec 的 meta 与四个 JSON-LD 帮手. 不写 meta 时 Page 的输出不变.
 */
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Page, breadcrumbLd, definePage, faqLd, ldList, productLd, section, serializeLd, softwareLd, type PageMeta } from "@src/page";

const funnel = section("funnel", {
	id: "funnel",
	heading: { title: "转化漏斗" },
	label: "本月转化",
	stages: [
		{ id: "visit", label: "访问", value: 12486 },
		{ id: "pay", label: "支付", value: 1317 },
	],
});

const meta: PageMeta = {
	title: "HX 机械键盘",
	description: "75% 配列, 热插拔",
	canonical: "https://shop.example.com/p/hx75",
	og: { image: "https://shop.example.com/hx75.jpg", card: "summary_large_image" },
	jsonLd: [
		productLd({ name: "HX 机械键盘", image: "https://shop.example.com/hx75.jpg", price: 699, currency: "CNY", availability: "inStock", rating: { value: 4.8, count: 212 } }),
		breadcrumbLd([
			{ name: "首页", url: "https://shop.example.com/" },
			{ name: "键盘", url: "https://shop.example.com/c/kb" },
		]),
		faqLd([]),
	],
};

function ldScripts(container: HTMLElement): unknown[] {
	return Array.from(container.querySelectorAll('script[type="application/ld+json"]'), (s) => JSON.parse(s.textContent ?? ""));
}

afterEach(() => {
	cleanup();
	document.head.querySelectorAll("title, meta, link[rel=canonical]").forEach((n) => n.remove());
});

describe("JSON-LD 帮手", () => {
	it("productLd 输出 Product + Offer + AggregateRating, 价格转字符串, 库存态映射成 schema.org URL", () => {
		const ld = productLd({ name: "键盘", image: "a.jpg", brand: "HX", price: 699, currency: "CNY", availability: "preOrder", rating: { value: 4.5, count: 3 } });
		expect(ld).toEqual({
			"@context": "https://schema.org",
			"@type": "Product",
			name: "键盘",
			image: "a.jpg",
			brand: { "@type": "Brand", name: "HX" },
			offers: { "@type": "Offer", price: "699", priceCurrency: "CNY", availability: "https://schema.org/PreOrder" },
			aggregateRating: { "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 3 },
		});
	});

	it("可选字段缺省时不出现, 零评价不出 aggregateRating", () => {
		const ld = productLd({ name: "键盘", image: "a.jpg", price: 1, currency: "CNY", availability: "outOfStock", rating: { value: 0, count: 0 } });
		expect(Object.keys(ld)).toEqual(["@context", "@type", "name", "image", "offers"]);
		expect(JSON.stringify(ld)).not.toContain("null");
	});

	it("softwareLd 不给价格时按免费输出 offer", () => {
		const ld = softwareLd({ name: "HX Studio", os: "macOS, Windows", category: "DeveloperApplication" });
		expect(ld["@type"]).toBe("SoftwareApplication");
		expect(ld.offers).toEqual({ "@type": "Offer", price: "0" });
	});

	it("faqLd 与 breadcrumbLd 空列表返回 undefined; breadcrumb position 从 1 连续", () => {
		expect(faqLd([])).toBeUndefined();
		expect(breadcrumbLd([])).toBeUndefined();
		const crumbs = breadcrumbLd([
			{ name: "a", url: "/a" },
			{ name: "b", url: "/b" },
			{ name: "c", url: "/c" },
		]);
		expect((crumbs?.itemListElement as Array<{ position: number }>).map((x) => x.position)).toEqual([1, 2, 3]);
		const faq = faqLd([{ q: "能退吗", a: "7 天无理由" }]);
		expect(faq?.mainEntity).toEqual([{ "@type": "Question", name: "能退吗", acceptedAnswer: { "@type": "Answer", text: "7 天无理由" } }]);
	});

	it("serializeLd 转义 <, 内容里的 </script> 不能闭合标签, 解析回去与原对象相等", () => {
		const ld = productLd({ name: "</script><script>alert(1)</script>", image: "a.jpg", price: 1, currency: "CNY", availability: "inStock" });
		const text = serializeLd(ld);
		expect(text).not.toContain("<");
		expect(JSON.parse(text)).toEqual(ld);
	});

	it("ldList 接单个或数组, 去掉 undefined", () => {
		expect(ldList(undefined)).toEqual([]);
		expect(ldList(meta.jsonLd)).toHaveLength(2);
		expect(ldList(faqLd([{ q: "q", a: "a" }]))).toHaveLength(1);
	});
});

describe("Page 的 meta", () => {
	it("sections 写法: title, description, canonical, og 进 head, og 标题缺省取 title, 两段 JSON-LD 输出", () => {
		const { container } = render(<Page spec={definePage({ meta, sections: [funnel] })} />);
		expect(document.title).toBe("HX 机械键盘");
		expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("75% 配列, 热插拔");
		expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://shop.example.com/p/hx75");
		expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe("HX 机械键盘");
		expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe("https://shop.example.com/p/hx75");
		expect(document.querySelector('meta[property="og:type"]')?.getAttribute("content")).toBe("website");
		expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute("content")).toBe("summary_large_image");
		const lds = ldScripts(container) as Array<{ "@type": string }>;
		expect(lds.map((x) => x["@type"])).toEqual(["Product", "BreadcrumbList"]);
	});

	it("story 写法同样输出 head", () => {
		render(<Page spec={definePage({ meta: { title: "story 页" }, direction: "editorial", sections: [funnel] })} />);
		expect(document.title).toBe("story 页");
		expect(document.querySelector("[data-direction]")).not.toBeNull();
	});

	it("不写 meta 时不新增任何 head 元素, 根节点仍是组合器的 main", () => {
		const before = document.head.innerHTML;
		const { container } = render(<Page spec={definePage({ sections: [funnel] })} />);
		expect(document.head.innerHTML).toBe(before);
		expect(container.querySelector("script, title")).toBeNull();
		expect(container.childElementCount).toBe(1);
		expect(container.querySelector("main")).not.toBeNull();
	});
});
