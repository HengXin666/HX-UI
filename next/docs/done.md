# 完成标准 (Definition of Done)

一件东西只有两种状态: 没做完, 和 100%. 下面每一条都要能用命令或截图证明, 不靠"看着还行".

## L3 成品 (sites/<id>)

### 能用
- [ ] 每个按钮和链接都有去处: 页内锚点能滚到对应段落, 不打断文档站路由; 主按钮打开真实表单 (校验, 提交中, 成功, 失败).
- [ ] 手机 (390px) 有完整导航: 菜单按钮打开抽屉, 点链接后关闭并滚到位.
- [ ] 键盘能走完主流程: Tab 顺序合理, 焦点可见, Esc 关闭弹层, 弹层关闭后焦点回到触发按钮.

### 好看
- [ ] 桌面 1440, 平板 768, 手机 390 三档截图逐段过一遍, 无溢出, 无断字, 无孤字标题.
- [ ] 亮色 / 暗色两套都过一遍.
- [ ] 有且只有一个招牌视觉, 写在 prompt.md 里.
- [ ] 顶栏, 内容栏, 页脚三者左右对齐到同一条栏线.

### 稳
- [ ] axe 扫描 0 个 serious / critical.
- [ ] Lighthouse (移动端) 性能, 无障碍, 最佳实践, SEO 都 ≥ 90.
- [ ] 减弱动效下所有内容可见, 数字显示终值.
- [ ] 控制台 0 报错, 0 警告.

### 能拷走
- [ ] 只依赖 `@/` (L1 / L2), `@sites/_blocks` 和自己目录; 脚本检查通过.
- [ ] 目录里有 `art.css` (字体, 色板, 圆角, 只在 `[data-site=<id>]` 内生效), `prompt.md` (能单独交给 AI 生成同款), `cover.png`.
- [ ] `registry/<id>.json` 列出全部文件和依赖.

### 命令
```bash
npm run check                                  # 依赖边界 + 必备文件 (status.json 标 done 的严格卡) + L2 体积预算
npm run build:site launch                      # 单独构建 + 预渲染 → dist-sites/launch
npm run qa:site dist-sites/launch [dark]       # axe + 主流程 + 控制台, MOTION=1 开动效
npm run qa:lighthouse dist-sites/launch        # 移动端四项 ≥ 90
npm run registry launch                        # 生成 registry/launch.json
```

## L2 交互 (src/interactions/<id>)
- [ ] 真实场景演示, 调参面板每个参数都生效.
- [ ] 键盘可用, 读屏能听到状态变化.
- [ ] 减弱动效有静态版本.
- [ ] 只动 transform / opacity; 自身代码 gzip 不超过 meta.budgetKb (react / motion / lucide / radix 等共享依赖不计, `npm run check:budgets`).
- [ ] 亮暗两套截图.

## 验收记录

### launch (Tally 发布页) · 2026-11-22 · done
- 能用: 页内锚点 (文档站内不打断 hash 路由), 免费试用 / 预约演示 / 定价 / 和我们聊聊 全部打开同一表单; 空提交被拦且焦点落到邮箱; 回车提交; 失败态; 成功页; Esc 关闭焦点回到触发按钮; 手机抽屉菜单关闭后滚到位. 亮暗 × 动效开关四种组合全部通过.
- 好看: 1440 / 1280 / 1024 / 768 / 390 / 360 无横向溢出; 顶栏, 栏线, 页脚对齐到 1200px; 招牌视觉为暖纸色发丝网格舞台 + 真实工作台.
- 稳: axe 0 违规 (亮 / 暗, 桌面 / 弹层 / 手机); Lighthouse 移动端 性能 96 到 98, 无障碍 100, 最佳实践 100, SEO 100; 桌面四项 100. 预渲染 + 内联 CSS + 分段水合 (Suspense 边界 + transition), 弹层与手机菜单按需加载.
- 能拷走: `npm run check` 通过; `registry/launch.json` 37 个文件 + 6 个 shadcn 组件; 按 registry 落到全新 Vite 项目里, tsc 与构建通过, 页面与表单正常.
