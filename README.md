# HX-UI

React 19 + Tailwind v4 + shadcn/ui + Motion 的组件库: 基础件, 图表, 蓝图编辑器, Agent 界面, 特效.

- 文档站 (每个组件一页: 预览 / 实时调参 / 代码 / 属性表): <https://hengxin666.github.io/HX-UI/>
- 安装与调用: [docs/guide.md](./docs/guide.md); 给 AI 的速查: [llms.txt](./llms.txt)

```bash
pnpm add https://github.com/HengXin666/HX-UI/releases/download/v2.6.1/hx-ui-2.6.1.tgz
```

```ts
import "@hx/ui/styles.css";
import { Button } from "@hx/ui/ui/button";
```

## 2.0 重构了什么

2.x 是从头重写, 不是 1.x 的升级:

| | 1.x (0.18, 已存档) | 2.x (当前) |
|---|---|---|
| 技术栈 | 自写原语 + open-vetta 视觉 | shadcn/ui 源码 + radix-ui, Tailwind v4, Motion, Recharts |
| 主题 | GitHub 风格单一配色 | OKLCH 令牌, 亮 / 暗 / 跟随系统, 5 种强调色 |
| 组件 | 基础件 + 少量图表 | 基础件, 2D / 3D 图表, 表格, 蓝图节点编辑器, Agent 会话界面, 视觉特效 |
| 引入 | 根入口一次拉入全部 | 一个组件一个入口 (`@hx/ui/ui/<name>`), 拓展包按需引 |
| 动效 | 零散 | 只动 transform / opacity, 统一弹簧档位, 尊重减弱动效 |
| 发布 | 源码 tgz | GitHub Release 挂预构建 tgz, 支持 Next.js App Router / RSC |

1.x 旧版不再维护, 完整保留在 [`legacy/v1`](https://github.com/HengXin666/HX-UI/tree/legacy/v1) 分支 (含它的文档站, 门禁和历史). 还在用 0.x tgz 的项目, 换成上面的安装命令即可.

## 开发

```bash
npm ci
npm run dev           # 文档站
npx tsc -b && npm run check
```

命令, 边界和发版流程见 [AGENTS.md](./AGENTS.md). 许可: Apache-2.0.
