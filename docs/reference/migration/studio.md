# 迁到工作室层

这次没有删除或改名已有导出. `src/index.ts` 的符号表不变, 旧的 `import { Button } from "@hx/ui"` 不用改.

## 新增

从子路径引入:

```ts
import { FieldPage, KilnPage, Shot, ShotSequence, ShotPlate, Metric, Process, Compare } from "@hx/ui/studio";
```

打包配置需要能解析 `@hx/ui/studio` (本仓库 `package.json` 的 `exports` 已加上). 文档站开发时直接引用 `src/studio`.

## 什么时候用镜头, 什么时候用原来的 Reveal

- 控件的悬停, 弹层, 数字跳动: 继续用现有组件, 不要套 `Shot`.
- 一屏里有主次, 需要先站住再推近: 用 `ShotSequence`.
- 只是列表项依次出现, 间隔固定: 继续用 `Stagger`.

## 整页

`FieldPage` 是软件产品落地页 (田野). `KilnPage` 是商品页 (窑四号), 含釉色, 型号, 购买步骤和对比表. 两页都只依赖本库. 复制到项目里时把 `heading` 留成默认 `h1`, 并让页面自己滚动; 若外层已经有滚动容器, 不要把 `ShotPlate` 设成 `scroll`, 除非把那个容器传进 `container`.
