/**
 * 国际化三层回退的示例与证明: labels prop > LocaleProvider > 内置默认.
 * resolveText 就是 useLocaleText 的全部逻辑, Provider 只负责把文案放进 context.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { CALENDAR_REFERENCE, LOCALE_EN_US, LOCALE_ZH_CN } from "../../../src/constants/locale.ts";
import { directionOf, mergeMessages, resolveText } from "../../../src/locale/core.ts";
import { enUS } from "../../../src/locale/en-US.ts";
import { formatCurrency, formatNumber, formatRelative } from "../../../src/locale/format.ts";
import { zhCN } from "../../../src/locale/zh-CN.ts";

const DOMAIN = "pagination";
const BUILTIN = zhCN.messages.pagination;
const PROVIDED = enUS.messages;
const OVERRIDE = "Prev";
const PAGE = CALENDAR_REFERENCE.weekdays;

test("layer 3: without a provider the built-in default is used unchanged", () => {
    const text = resolveText(DOMAIN, undefined, undefined, BUILTIN);
    assert.equal(text.previous, BUILTIN.previous);
    assert.equal(text.page(PAGE), BUILTIN.page(PAGE));
});

test("layer 2: the provider wins over the built-in default", () => {
    const text = resolveText(DOMAIN, undefined, PROVIDED, BUILTIN);
    assert.equal(text.previous, PROVIDED.pagination.previous);
    assert.equal(text.page(PAGE), PROVIDED.pagination.page(PAGE));
});

test("layer 1: the labels prop wins over the provider, key by key", () => {
    const text = resolveText(DOMAIN, { previous: OVERRIDE }, PROVIDED, BUILTIN);
    assert.equal(text.previous, OVERRIDE);
    assert.equal(text.next, PROVIDED.pagination.next);
});

test("an explicit undefined in labels never hides the lower layers", () => {
    const text = resolveText(DOMAIN, { previous: undefined }, undefined, BUILTIN);
    assert.equal(text.previous, BUILTIN.previous);
});

test("provider messages merge onto the pack per key", () => {
    const merged = mergeMessages(enUS.messages, { pagination: { next: OVERRIDE } });
    assert.equal(merged.pagination.next, OVERRIDE);
    assert.equal(merged.pagination.previous, PROVIDED.pagination.previous);
});

test("packs cover the same keys and carry direction and week start", () => {
    for (const domain of Object.keys(zhCN.messages)) {
        assert.deepEqual(Object.keys(enUS.messages[domain]).sort(), Object.keys(zhCN.messages[domain]).sort());
    }
    assert.equal(zhCN.messages.date.months.length, 12);
    assert.equal(enUS.messages.date.weekdaysShort.length, 7);
    assert.notEqual(zhCN.weekStartsOn, enUS.weekStartsOn);
    assert.equal(directionOf("ar-EG"), "rtl");
    assert.equal(directionOf(LOCALE_ZH_CN), "ltr");
});

test("formatters delegate to Intl", () => {
    assert.equal(formatNumber(1234.5, LOCALE_EN_US), new Intl.NumberFormat(LOCALE_EN_US).format(1234.5));
    assert.match(formatCurrency(9, "CNY", LOCALE_ZH_CN), /9/);
    assert.equal(formatRelative(0, LOCALE_EN_US, 86400000), "yesterday");
});
