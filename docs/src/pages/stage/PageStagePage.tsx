import { useMemo, useState, type JSX } from "react";
import { Button, Input, Switch } from "@hx/ui";
import { Page, definePage } from "../../../../src/page";
import { Code, P } from "../../components/DocKit";
import { blocks, constLine, importLine, jsx, literal, PAGE_ENTRY, ref } from "./code";
import { DELIVERY, MATERIALS_EYEBROW, MATERIALS_ITEMS, MATERIALS_TITLE, PAGE_KEY, PAGE_ORDER, pageSections, type PageKey } from "./samples";
import { PropRow, StageLayout } from "./StageKit";

const UP = -1;
const DOWN = 1;
const SPEC = "spec";
const DELIVERY_NAME = "delivery";
const ITEM_INDENT = "    ";
const MOVE = { variant: "outline", size: "xs", type: "button" } as const;

/** 描述对象里一个区块的源码. 商品页模板的区块只写取数, 可视化区块写全. */
function sectionCode(key: PageKey, type: string, title: string): string {
  if (key === PAGE_KEY.materials) {
    return `section("${type}", ${literal({ heading: { eyebrow: MATERIALS_EYEBROW, title }, items: MATERIALS_ITEMS }, 2)}, "${key}")`;
  }
  if (key === PAGE_KEY.delivery) return `section("${type}", ${DELIVERY_NAME}, "${key}")`;
  return `{ type: "${type}", key: "${key}", props: productProps("${key}") }`;
}

function specCode(keys: readonly PageKey[], types: Record<PageKey, string>, title: string): string {
  const lines = keys.map((key) => `${ITEM_INDENT}${sectionCode(key, types[key], title)},`);
  return [`const ${SPEC} = definePage({`, "  sections: [", ...lines, "  ],", "});"].join("\n");
}

/**
 * #/page: 一份 definePage 描述渲染成整页. 道具台改区块顺序, 开关区块, 改材料区块的标题;
 * 区块按 key 复用, 所以调整顺序与开关不会让其余区块重挂载.
 */
export function PageStagePage(): JSX.Element {
  const [order, setOrder] = useState<readonly PageKey[]>(PAGE_ORDER);
  const [hidden, setHidden] = useState<ReadonlySet<PageKey>>(() => new Set());
  const [title, setTitle] = useState(MATERIALS_TITLE);
  const all = useMemo(() => pageSections(title), [title]);
  const shown = order.filter((key) => !hidden.has(key));
  const spec = useMemo(() => definePage({ sections: shown.map((key) => all[key]) }), [all, shown.join()]);
  const types = Object.fromEntries(PAGE_ORDER.map((key) => [key, all[key].type])) as Record<PageKey, string>;

  const move = (key: PageKey, step: number): void => {
    setOrder((list) => {
      const from = list.indexOf(key);
      const to = from + step;
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      next.splice(from, 1);
      next.splice(to, 0, key);
      return next;
    });
  };
  const toggle = (key: PageKey, on: boolean): void => {
    setHidden((set) => {
      const next = new Set(set);
      if (on) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const code = blocks(
    importLine(PAGE_ENTRY, ["Page", "definePage", "section"]),
    "// productProps(key): 取商品页模板同名区块的 props, 见文档站 pages/templates/page-product/data.ts",
    shown.includes(PAGE_KEY.delivery) && constLine(DELIVERY_NAME, DELIVERY),
    specCode(shown, types, title),
    jsx("Page", { spec: ref(SPEC), as: "div" }),
  );

  return (
    <>
      <P>
        页面描述层从 <Code>@hx/ui/page</Code> 引入: 一个 <Code>definePage</Code> 对象列出区块, <Code>Page</Code> 按默认注册表渲染.
        下面的舞台就是这份描述的当前态, 道具台改的是描述本身, 源码区同步显示它.
      </P>
      <StageLayout
        stage={<Page spec={spec} as="div" />}
        props={
          <>
            <PropRow name="materials.heading.title">
              <Input value={title} aria-label="材料区块标题" className="max-w-96" onChange={(event) => setTitle(event.target.value)} />
            </PropRow>
            {order.map((key, index) => (
              <PropRow key={key} name={`${index + 1}. ${types[key]}`} readout={hidden.has(key) ? "关" : "开"}>
                <div className="flex items-center gap-2">
                  <Switch checked={!hidden.has(key)} aria-label={`显示 ${key}`} onCheckedChange={(on) => toggle(key, on)} />
                  <Button {...MOVE} disabled={index === 0} onClick={() => move(key, UP)}>
                    上移
                  </Button>
                  <Button {...MOVE} disabled={index === order.length - 1} onClick={() => move(key, DOWN)}>
                    下移
                  </Button>
                  <span className="truncate font-mono text-[12px] text-muted-foreground">key: {key}</span>
                </div>
              </PropRow>
            ))}
          </>
        }
        code={code}
      />
    </>
  );
}
