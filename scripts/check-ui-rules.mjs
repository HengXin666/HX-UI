#!/usr/bin/env node
/**
 * 设计规约门禁。
 *
 * 为什么需要它: 这套库的全部观感来自"四条硬约定"(颜色只有一个来源 / 层级靠 1px 边框 /
 * 动效是反馈 / 组件是唯一来源)。这些约定**只写在注释里**, 而注释不会失败。
 * 一旦有人手滑写了一个 \`slate-500\` 或 \`border-2\`, 没有任何东西会报错,
 * 组件看起来还"基本正常", 但整套界面开始吵。
 *
 * 这个脚本把约定变成退出码。用法:
 *   node scripts/check-ui-rules.mjs [目录, 默认 src]
 * 退出码 1 = 有违规。
 *
 * 扫描根: 环境变量 CHECK_UI_ROOT 可覆盖 (默认本脚本的上一级)。
 * 负向探针靠它把夹具指到临时目录 —— 扫描根不可覆盖, 就做不出"证明它会红"这一步。
 *
 * ## 三条实现上的取舍 (都是踩过才这么写的)
 *
 *   1. **JSX 开标签整段扫描, 不逐行**。\`<button\` 与 \`type="button"\` 常常不在同一行,
 *      逐行判定会把 8 个本来就正确的按钮全报成违规 —— 误报比漏报更致命, 它会让
 *      门禁被人直接绕过。
 *   2. **注释行不参与判定**。规则文档里必然出现反例字面量 (例如 "不要写 border-2"),
 *      不自清理的话规则会自己触发自己。
 *   3. **白名单是文件级的**。行号会漂移, 行级白名单的维护成本比规则本身高。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.env.CHECK_UI_ROOT
  ? path.resolve(process.env.CHECK_UI_ROOT)
  : path.resolve(import.meta.dirname, "..");
const TARGET = process.argv[2] ?? "src";

/**
 * 允许出现硬编颜色的文件。
 * CodeBlock 的语法主题色来自 One Dark Pro 主题定义, 那是第三方主题的取值,
 * 不是本库的调色板 —— 它本来就不该跟着换肤走。
 */
const COLOR_ALLOW = new Set(["src/layout/CodeBlock.tsx"]);

/**
 * 语义调色盘白名单: 只放行 emerald / amber / red。
 *
 * 上游规范只允许三种语义原色: 成功 emerald、警告 amber、错误 red
 * (badge 里错误走 destructive token, 但 button.tsx 与 SegmentedControl.tsx 里
 *  的语义红是上游原文, README 承诺视觉类名一个字不改, 这里不反过来指控它)。
 * 其余调色盘 (slate/indigo/violet/blue/green/sky...) 一律视为"随手挑的颜色",
 * 那是换肤失效的根源。
 */
const PALETTE_BAN =
  /\b(?:slate|zinc|gray|neutral|stone|indigo|violet|purple|fuchsia|pink|rose|sky|cyan|teal|blue|green|lime|orange|yellow)-[0-9]{2,3}\b/;

/** 去掉行内注释, 避免规则文档里的反例自触发。 */
function stripComment(line) {
  return line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
}

/**
 * **只**取注释部分 —— 给"注释规范"类的规则用。
 *
 * 与 stripComment 相反: 那条是"去掉注释看代码", 这条是"只看注释"。
 * 注释规范必须只扫注释, 否则代码里的字符串、文案都会被误判。
 */
function onlyComment(line) {
  const inline = /(?:\/\/)(.*)$/.exec(line)?.[1] ?? "";
  const block = /\/\*([\s\S]*?)\*\//.exec(line)?.[1] ?? "";
  // 块注释只有开头那行 (/**) 时取该行; 行尾注释取后半段
  if (/^\s*(?:\*|\/\*)/.test(line)) return line;
  return inline || block;
}

const RULES = [
  {
    id: "no-palette",
    test: (code) => PALETTE_BAN.test(code),
    hint: "只用语义 token (bg-primary / text-muted-foreground / border-border)。例外只有 emerald-* / amber-* / red-*。",
  },
  {
    id: "no-hex",
    test: (code) => /#[0-9a-fA-F]{3,8}\b/.test(code),
    hint: "颜色值放 tokens.css。组件里出现 hex 意味着换肤时这里不会跟着变。",
  },
  {
    id: "no-rgb-hsl",
    test: (code) => /\b(?:rgba?|hsla?)\(/.test(code),
    hint: "同上 —— 用 token 或 color-mix()。",
  },
  {
    id: "border-1px",
    test: (code) => /\bborder-(?:2|4|8)\b|border-\[[0-9.]+px\]/.test(code),
    hint: "线条全局 1px。要强调就改颜色深度, 不要加粗。",
  },
  /**
   * 注释里不许写开发日记。
   *
   * 为什么这条要存在: 源码注释说的是"这段代码是什么、为什么这样设计"。
   * 而"我实测踩到过""上一版怎样""用户报了什么"是**调试经过**, 属于
   * commit message 或博客, 不属于源码 —— 它们与当前业务无关, 读代码的人
   * 不关心也不该被这些东西打断。
   *
   * 而且这类文字会**越积越多**: 写的时候觉得"记录一下挺好", 几十处之后
   * 每个文件开头都是一段作者的遭遇, 真正的设计说明反而被埋掉了。
   *
   * 判据只认注释行 (代码里的字符串不算), 避免误报。
   */
  {
    id: "no-dev-diary",
    test: (code) => DEV_DIARY.test(code),
    hint: "注释只写设计意图, 不写调试经过 (\"实测踩到\" / \"上一版\" / \"用户报\" 这类属于 commit message)。",
    commentOnly: true,
  },
];

/**
 * 开发日记的特征词。
 *
 * 刻意只收这几个 —— 收太宽会把"实测默认 16"这种**技术依据**也误杀。
 * 技术依据该留 (它说明参数为什么这么取), 日记该删 (它说明作者经历了什么)。
 */
const DEV_DIARY =
  /实测(?:踩到|踩过|发现|确认|表现|就是|会)|\b踩过(?:的坑|的)|上一版|曾经(?:在这里|这里|写成|用) |用户(?:报|原话)|这一版是\*\*重写\*\*/;

/** 跨行检查: 每个 JSX 开标签必须自带 type。返回开标签所在行号。 */
function checkButtonType(lines, file) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/<button\b/.test(lines[i])) continue;
    // 从 <button 起到该标签的 '>' 为止 (最多看 12 行, 超过就不是正常写法了)
    let tag = "";
    for (let j = i; j < Math.min(lines.length, i + 12); j++) {
      tag += stripComment(lines[j]) + "\n";
      if (/>/.test(lines[j])) break;
    }
    if (!/type\s*=\s*["'](?:button|submit|reset)["']/.test(tag)) {
      out.push({ file, line: i + 1, rule: "button-type", hint: "原生 <button> 必须写 type —— 不写默认是 submit, 放进表单里会意外提交整页。", text: lines[i].trim() });
    }
  }
  return out;
}

const files = [];
(function walk(dir) {
  const abs = path.resolve(ROOT, dir);
  if (!fs.existsSync(abs)) return;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = path.join(abs, e.name);
    if (e.isDirectory()) walk(path.relative(ROOT, full));
    else if (/\.tsx?$/.test(e.name)) files.push(path.relative(ROOT, full));
  }
})(TARGET);

const violations = [];
for (const file of files) {
  const lines = fs.readFileSync(path.join(ROOT, file), "utf8").split("\n");
  const allowColor = COLOR_ALLOW.has(file);
  lines.forEach((line, i) => {
    const code = stripComment(line);
    const comment = onlyComment(line);
    for (const rule of RULES) {
      if (allowColor && (rule.id === "no-hex" || rule.id === "no-rgb-hsl")) continue;
      // commentOnly 的规则只扫注释本身, 不扫代码
      const target = rule.commentOnly ? comment : code;
      if (!target) continue;
      if (rule.test(target)) {
        violations.push({ file, line: i + 1, rule: rule.id, hint: rule.hint, text: line.trim() });
      }
    }
  });
  violations.push(...checkButtonType(lines, file));
}

if (violations.length === 0) {
  console.log(`check-ui-rules: 通过 (${files.length} 个文件)`);
  process.exit(0);
}

console.error(`check-ui-rules: ${violations.length} 处违规\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
  console.error(`    ${v.text}`);
  console.error(`    → ${v.hint}\n`);
}
process.exit(1);
