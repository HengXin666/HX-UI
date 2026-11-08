/**
 * 皮肤清单: midnight 进 SKIN_LIST 与运行时辅助函数, 样式入口引入了 midnight.css, 暗色取值与门面那套一致.
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { SKIN, SKIN_ATTR, SKIN_LIST } from "@src/constants/skins";
import { SKIN_NAMES, applySkin, isSkinName, readSkin } from "@src/skins";

const read = (relative: string): string => fs.readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const MIDNIGHT_CSS = "../../src/skins/midnight.css";

afterEach(() => {
  applySkin(SKIN.default);
});

describe("skins", () => {
  it("SKIN_LIST 收录 midnight, 名称不重复, 默认仍在首位", () => {
    expect(SKIN_LIST[0].name).toBe(SKIN.default);
    expect(SKIN_NAMES).toContain("midnight");
    expect(new Set(SKIN_NAMES).size).toBe(SKIN_NAMES.length);
    expect(isSkinName("midnight")).toBe(true);
  });

  it("applySkin(midnight) 写 data-skin, 读回同名; 切回 default 移除属性", () => {
    applySkin(SKIN.midnight);
    expect(document.documentElement.getAttribute(SKIN_ATTR.skin)).toBe("midnight");
    expect(readSkin()).toBe(SKIN.midnight);
    applySkin(SKIN.default);
    expect(document.documentElement.hasAttribute(SKIN_ATTR.skin)).toBe(false);
  });

  it("每套非默认皮肤都由 index.css 引入", () => {
    const index = read("../../src/skins/index.css");
    for (const name of SKIN_NAMES.filter((skin) => skin !== SKIN.default)) {
      expect(index, name).toContain(`@import "./${name}.css";`);
    }
  });

  it("midnight 暗色取门面那套: 底 #120f17, 主色 #a855f7", () => {
    const css = read(MIDNIGHT_CSS);
    const dark = css.slice(css.indexOf('[data-skin="midnight"]:not([data-mode="light"])'));
    expect(dark).toMatch(/--background: #120f17;/);
    expect(dark).toMatch(/--primary: #a855f7;/);
    expect(dark).toMatch(/--accent-2: #5eead4;/);
  });
});
