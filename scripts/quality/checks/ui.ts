import ts from "typescript";
import {
    ERROR, ICON_DECLARATION_FIELDS, ICON_PACKAGE_PREFIX, PACKAGE_FILE, UI_COLOR_EXEMPT, UI_ROOT, GROUP_CODE, NEWLINE, NOT_FOUND, REGEX_GLOBAL, SLASH, TSX_EXT, COLON,
} from "../../constants/quality.ts";
import { codeFiles, comments, line, parse, visit, withoutComments } from "../runtime/ast.ts";
import { Collector } from "../runtime/finding.ts";
import type { Rule } from "../runtime/finding.ts";
import { lineOf } from "./snapshot.ts";
import type { Snapshot } from "./snapshot.ts";

type Pattern = { id: string; summary: string; pattern: RegExp; colors?: boolean; hint: string };

const CODE = GROUP_CODE;
const BUTTON = "button";
const TYPE_ATTRIBUTE = "type";
const BUTTON_TYPES = [BUTTON, "submit", "reset"];
const ICON_CLASS = /icon-\[([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9-]+)\]/g;
/**
 * 开发日记特征词: 只收调试经过类说法, "实测默认 16" 这类技术依据不算.
 * 迁自 scripts/check-ui-rules.mjs 的 no-dev-diary, 词表保持原样; 只去掉了对中文无效的 \b 词边界 (汉字前不存在 \b).
 */
const DEV_DIARY =
    /实测(?:踩到|踩过|发现|确认|表现|就是|会)|踩过(?:的坑|的)|上一版|曾经(?:在这里|这里|写成|用) |用户(?:报|原话)|这一版是\*\*重写\*\*/;
const JSX_BLOCK_COMMENT = /\/\*/;

/** Tailwind/CSS token boundary: a class token never continues with these characters. */
const LEFT = String.raw`(?<![\w-])`;
const RIGHT = String.raw`(?![\w-])`;

export const UI_PATTERNS: Pattern[] = [
    {
        id: "PROJECT-UI-PALETTE", summary: "src 只用语义 token, 非语义调色盘 (slate/blue/...) 一律报错, 只放行 emerald/amber/red",
        pattern: /\b(?:slate|zinc|gray|neutral|stone|indigo|violet|purple|fuchsia|pink|rose|sky|cyan|teal|blue|green|lime|orange|yellow)-[0-9]{2,3}\b/g,
        hint: "改用语义 token (bg-primary / text-muted-foreground / border-border)",
    },
    {
        id: "PROJECT-UI-HEX", summary: "src 组件内禁止 hex 色值, 颜色只来自 tokens.css", colors: true,
        pattern: /#[0-9a-fA-F]{3,8}\b/g, hint: "颜色放 tokens.css",
    },
    {
        id: "PROJECT-UI-RGB", summary: "src 组件内禁止 rgb/rgba/hsl/hsla/oklch/oklab/hwb 函数色值, 包括 Tailwind 任意值里的 _rgba(", colors: true,
        pattern: /(?<![A-Za-z0-9-])(?:rgba?|hsla?|oklch|oklab|hwb)\(/gi, hint: "用 token 或 color-mix()",
    },
    {
        id: "PROJECT-UI-LINE-1PX", summary: "border/ring/outline/divide 线宽只允许 1px, 禁止 -2/-4/-8 与 [0.5px] 等任意值",
        pattern: new RegExp(LEFT + String.raw`(?:border(?:-[xytrblse])?|ring|outline|divide-[xy])-(?:[2-9]|\d{2,}|\[(?!1px\])[0-9.]+(?:px|rem|em)\])` + RIGHT, REGEX_GLOBAL),
        hint: "线条全局 1px, 强调靠颜色深度",
    },
    {
        id: "PROJECT-UI-BW", summary: "禁止 black/white 原色类 (bg-black/50, bg-white, text-white 等), 改用语义 token",
        pattern: new RegExp(LEFT + String.raw`(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|shadow|decoration|placeholder|caret|accent)-(?:black|white)` + RIGHT, REGEX_GLOBAL),
        hint: "改用 bg-background / text-primary-foreground / 遮罩 token",
    },
    {
        id: "PROJECT-UI-TRANSITION-ALL", summary: "禁止 transition-all 与 transition: all, 必须列出具体属性",
        pattern: new RegExp(LEFT + String.raw`transition-all` + RIGHT + String.raw`|transition(?:Property)?\s*:\s*["'\x60]all\b`, REGEX_GLOBAL),
        hint: "写 transition-colors / transition-[opacity,transform] 等具体属性",
    },
];

function scanPatterns(spec: Pattern): Rule {
    const rule: Rule = {
        id: spec.id, severity: ERROR, group: CODE, summary: spec.summary,
        run: (current) => {
            const out = new Collector(rule);
            for (const [path, text] of codeFiles(current)) {
                if (!path.startsWith(UI_ROOT) || (spec.colors && UI_COLOR_EXEMPT.includes(path))) {
                    continue;
                }
                const code = withoutComments(parse(path, text));
                for (const match of code.matchAll(spec.pattern)) {
                    const at = lineOf(code, match.index);
                    out.add(path, at, spec.hint, text.split(NEWLINE)[at - 1] ?? match[0], match[0]);
                }
            }
            return out.scoped(current);
        },
    };
    return rule;
}

/** The type written as a string literal (`type="x"` or `type={"x"}`); a computed value cannot be judged statically. */
function staticType(attribute: ts.JsxAttribute): string | undefined {
    const value = attribute.initializer;
    const expression = value && ts.isJsxExpression(value) ? value.expression : value;
    return expression && ts.isStringLiteralLike(expression) ? expression.text : undefined;
}

const buttonType: Rule = {
    id: "PROJECT-UI-BUTTON-TYPE", severity: ERROR, group: CODE,
    summary: "原生 <button> 必须显式写 type, AST 判定, 不受换行与箭头函数影响",
    run: (snapshot) => {
        const out = new Collector(buttonType);
        for (const [path, text] of codeFiles(snapshot)) {
            if (!path.startsWith(UI_ROOT)) {
                continue;
            }
            const source = parse(path, text);
            visit(source, (node) => {
                if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) {
                    return;
                }
                if (node.tagName.getText(source) !== BUTTON) {
                    return;
                }
                const attribute = node.attributes.properties.find((item): item is ts.JsxAttribute => {
                    return ts.isJsxAttribute(item) && item.name.getText(source) === TYPE_ATTRIBUTE;
                });
                const written = attribute && staticType(attribute);
                const first = node.getText(source).split(NEWLINE)[0];
                if (!attribute) {
                    out.add(path, line(source, node.getStart(source)), "原生 <button> 必须写 type, 默认 submit 会意外提交表单", first, BUTTON);
                } else if (written !== undefined && !BUTTON_TYPES.includes(written)) {
                    out.add(path, line(source, node.getStart(source)), "原生 <button> 的 type 只能是 " + BUTTON_TYPES.join(SLASH)
                        + ", 无效值会回退成 submit", first, BUTTON + COLON + written);
                }
            });
        }
        return out.scoped(snapshot);
    },
};

const iconDeclared: Rule = {
    id: "PROJECT-UI-ICON-DECLARED", severity: ERROR, group: CODE,
    summary: "src 中的 icon-[<set>--<name>] 图标类, 其 @iconify-json/<set> 必须在根 package.json 的 dependencies 或 peerDependencies 声明",
    run: (snapshot) => {
        const out = new Collector(iconDeclared);
        const manifest = JSON.parse(snapshot.files.get(PACKAGE_FILE) ?? "{}");
        const declared = new Set(ICON_DECLARATION_FIELDS.flatMap((field) => Object.keys(manifest[field] ?? {})));
        for (const [path, text] of snapshot.files) {
            if (!path.startsWith(UI_ROOT)) {
                continue;
            }
            for (const match of text.matchAll(ICON_CLASS)) {
                const pkg = ICON_PACKAGE_PREFIX + match[1];
                if (!declared.has(pkg)) {
                    out.add(path, lineOf(text, match.index), pkg + " 未在根 package.json 的 "
                        + ICON_DECLARATION_FIELDS.join(SLASH) + " 声明, 下游安装后图标为空", match[0], pkg);
                }
            }
        }
        return out.scoped(snapshot);
    },
};

/** 注释写设计意图, 不写调试经过; 只扫 TypeScript 注释 trivia, 字符串与文案不会误报. */
const devDiary: Rule = {
    id: "PROJECT-UI-DEV-DIARY", severity: ERROR, group: CODE,
    summary: "src 注释里不许写开发日记 (实测踩到 / 上一版 / 用户报 等调试经过), 只扫注释, 不扫字符串",
    run: (snapshot) => {
        const out = new Collector(devDiary);
        for (const [path, text] of codeFiles(snapshot)) {
            if (!path.startsWith(UI_ROOT)) {
                continue;
            }
            for (const comment of comments(parse(path, text))) {
                const match = DEV_DIARY.exec(comment.text);
                if (match) {
                    const at = lineOf(text, comment.pos + match.index);
                    out.add(path, at, "注释只写设计意图, 调试经过属于 commit message", text.split(NEWLINE)[at - 1] ?? match[0], match[0]);
                }
            }
        }
        return out.scoped(snapshot);
    },
};

/** JSX 子节点位置的裸块注释是 JsxText, 会原样渲染成页面文字; AST 判定, 不依赖上一行是否以 > 结尾. */
const jsxCommentLeak: Rule = {
    id: "PROJECT-UI-JSX-COMMENT-LEAK", severity: ERROR, group: CODE,
    summary: "src 的 .tsx 中 JSX 子节点位置不许写裸块注释 (会渲染成文字), 必须写成 {/* ... */}",
    run: (snapshot) => {
        const out = new Collector(jsxCommentLeak);
        for (const [path, text] of codeFiles(snapshot)) {
            if (!path.startsWith(UI_ROOT) || !path.endsWith(TSX_EXT)) {
                continue;
            }
            const source = parse(path, text);
            visit(source, (node) => {
                if (node.kind !== ts.SyntaxKind.JsxText) {
                    return;
                }
                const rows = node.getText(source).split(NEWLINE);
                const index = rows.findIndex((row) => JSX_BLOCK_COMMENT.test(row));
                if (index !== NOT_FOUND) {
                    const at = line(source, node.getStart(source)) + index;
                    out.add(path, at, "JSX 子节点位置的块注释会被渲染成文字, 要写成 {/* ... */}", rows[index].trim(), rows[index].trim());
                }
            });
        }
        return out.scoped(snapshot);
    },
};

export const uiRules: Rule[] = [...UI_PATTERNS.map(scanPatterns),
    buttonType, iconDeclared, devDiary, jsxCommentLeak];
