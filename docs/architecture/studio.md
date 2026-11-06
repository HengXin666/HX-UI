# 工作室层

本文件规定 `src/studio` 怎么用. 组件契约仍以 [component-contract.md](component-contract.md) 为准. 单次取舍见 `.agents/notes/implemented/feature/2026-11-06-studio-shot-language.md`.

## 1. 分层

| 层 | 路径 | 使用方拿到什么 |
|---|---|---|
| 令牌 | `src/tokens.css` | 颜色, 时长, 缓动. 工作室不另起一套色 |
| 镜头 | `src/studio/sequence` | `Shot`, `ShotSequence`, `ShotPlate`, `ShotLayer` |
| 过程 | `src/studio/viz` | `Metric`, `Spark`, `Process`, `Compare` |
| 整页 | `src/studio/pages` | `FieldPage`, `KilnPage` |

入口是包导出 `@hx/ui/studio`, 不进 `src/index.ts`.

```ts
import { FieldPage, KilnPage, Shot, ShotSequence } from "@hx/ui/studio";
```

## 2. 镜头词汇

| move | 行为 | 何时用 |
|---|---|---|
| hold | 只改变透明度 | 眉标, 要先站住的一行 |
| dolly | 缓慢推近, 时长约三秒 | 开场唯一的主体 |
| rise | 短距离落到 0 | 正文, 按钮, 要嵌入版面的块 |
| pan | 侧向平移后停住 | 次要信息 |
| glide | 小角度侧向, 落幅回到正视 | 引用, 一句需要被读完的话 |

`pace` 只有 `even` 与 `deal`. `deal` 的间隔逐项变短. 同一屏不要两种 pace 混在一个 `ShotSequence` 里.

`ShotPlate` 的 `drive` 默认 `view` (进视口播一次). `scroll` 把推近绑到元素穿过滚动容器的进度, 嵌在内层滚动条里时必须传 `container`.

减弱动效: 不播位移, 直接渲染落幅. 不把内容 `aria-hidden`.

禁止: 整页一起淡入, 每个卡片各闪一次光, 开场同时给两个主体.

## 3. 过程与指标

- `Metric` 的数字用弹簧, 折线是 `Spark`. `delta` 的颜色只表达好坏 (`tone`), 不拿来装饰.
- `Process` 是 `ol` 里的按钮. 横向时左右键, 纵向时上下键, `Home` / `End` 到两端. 当前步 `aria-current="step"`, 说明在 `aria-live`.
- `Compare` 是原生 `table`. 主推列 `data-state="hx-lead"`. 第一列 `position: sticky`.

## 4. 整页

`FieldPage` 与 `KilnPage` 的 `heading` 默认 `h1`. 嵌进已有标题的文档页时传 `h2`. 页面文案在组件内, 调用方用 `className` 包一层即可.

文档站 `#/gallery` 是这两页加上镜头, 数据和旧的质感拼贴的切换, 不另开路由.
