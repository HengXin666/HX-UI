/**
 * 组件级单元与无障碍测试的 Vitest 配置: happy-dom 环境, tsx 走 React 自动 JSX 运行时.
 * 怎么跑, 怎么加新测试见 docs/reference/quality/frontend-tests.md.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** 仓库相对路径转成运行时解析的路径, 不写死任何绝对路径. */
const fromRoot = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			// 与 docs/vite.config.ts 一致: 包名直接指向源码入口, 不必先 build
			"@hx/ui": fromRoot("./src/index.ts"),
			// 测试里按源码路径引单个组件, 避免拉起整库的可选 peer (monaco / xyflow / shiki)
			"@src": fromRoot("./src"),
			"@tests": fromRoot("./tests"),
		},
		// 库源码与测试必须共用同一份 React, 否则 hooks 报 null dispatcher
		dedupe: ["react", "react-dom"],
	},
	// tsconfig 是 jsx: react-jsx; Vite 8 用 oxc 转换, 这里显式声明自动运行时
	oxc: {
		jsx: { runtime: "automatic" },
	},
	test: {
		environment: "happy-dom",
		include: ["tests/**/*.test.{ts,tsx}"],
		// scripts/tests 下是 node:test 用例, 由 ci.json 的 tests 注册表单独跑
		exclude: ["node_modules/**", "docs/**", "dist/**", "scripts/**"],
		setupFiles: ["./tests/setup.ts"],
		globals: false,
		css: false,
		restoreMocks: true,
		testTimeout: 10000,
	},
});
