/**
 * 生成 shadcn 格式的 registry 条目: registry/<id>.json.
 *   - shadcn 官方组件 (src/components/ui/<name>, 名单见 SHADCN) → registryDependencies
 *   - 其余本地文件 (区块, 交互, 动效, 自写控件, 根部 Provider, 全局样式) → files, 内容内联
 *   - npm 包 → dependencies (版本取 package.json)
 * 用法: node --experimental-strip-types scripts/build-registry.ts [id...]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { NEXT, SITES, closure } from "./lib/closure.ts";

const pkg = JSON.parse(readFileSync(join(NEXT, "package.json"), "utf8"));
const SHADCN = new Set(["accordion", "alert", "avatar", "badge", "breadcrumb", "button", "calendar", "card", "chart", "checkbox", "collapsible", "command", "dialog", "drawer", "dropdown-menu", "hover-card", "input", "kbd", "label", "pagination", "popover", "progress", "radio-group", "scroll-area", "select", "separator", "sheet", "sidebar", "skeleton", "slider", "sonner", "switch", "table", "tabs", "textarea", "toggle-group", "toggle", "tooltip"]);
// 成品页要求根部有 ThemeProvider + MotionProvider (LazyMotion), 以及带令牌的全局样式, 一并带上
const ROOT = ["src/motion/provider.tsx", "src/hooks/use-theme.tsx", "src/styles/globals.css"];
const isShadcn = (f: string) => f.includes("/src/components/ui/") && SHADCN.has(basename(f).replace(/\.tsx$/, ""));

function build(id: string) {
  const { files, stopped, packages } = closure(id, ROOT, isShadcn);
  const version = (n: string) => pkg.dependencies?.[n] ?? pkg.devDependencies?.[n];
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: id,
    type: "registry:block",
    title: id,
    description: readFileSync(join(SITES, id, "prompt.md"), "utf8").split("\n")[0].replace(/^#\s*/, ""),
    dependencies: packages.filter((d) => !["react", "react-dom"].includes(d)).map((d) => (version(d) ? `${d}@${version(d)}` : d)),
    registryDependencies: stopped.map((f) => basename(f).replace(/\.tsx$/, "")),
    files: files.map((f) => {
      const rel = relative(NEXT, f);
      return {
        path: rel,
        type: rel.startsWith("sites/") ? (rel.endsWith("page.tsx") ? "registry:page" : "registry:file") : rel.includes("/components/ui/") ? "registry:ui" : rel.includes("/hooks/") ? "registry:hook" : rel.includes("/lib/") ? "registry:lib" : "registry:component",
        target: rel,
        content: readFileSync(f, "utf8"),
      };
    }),
  };
  mkdirSync(join(NEXT, "registry"), { recursive: true });
  writeFileSync(join(NEXT, "registry", `${id}.json`), JSON.stringify(item, null, 2) + "\n");
  console.log(`registry/${id}.json: ${item.files.length} 个文件, ${item.registryDependencies.length} 个 shadcn 组件, ${item.dependencies.length} 个 npm 包`);
}

const ids = process.argv.slice(2);
for (const id of ids.length ? ids : ["launch"]) build(id);
