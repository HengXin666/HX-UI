## 问题与行为

说明触发原因, 预期结果, 以及本次改变的行为. 组件改动请注明是否影响视觉类名.

## 范围与契约

列出受影响的目录 (src/primitives, src/layout, src/charts, docs, scripts), 公开导出变化与相关决策记录.

## 验证

记录执行过的命令与结果, 至少包含 `npm run quality` 与 `npm run test:affected`, 附质量报告路径 (scripts/.hx_code_quality/reports/).

## 待 review 项

列出依赖变化及审批记录, baseline 或豁免变更, Warning, 以及没能执行的检查和原因.

## 演示

改动前端功能 (`src/**/*.tsx`, `src/**/*.css`, `docs/src/**`) 的 PR 必须嵌入 GIF, 按 `.agents/skills/record-browser-gif/SKILL.md` 录制, 推到 `pr-assets` 分支的 `pr-<编号>/` 下, 用 raw 地址嵌入; 不要把 GIF 提交到 PR 分支. CI 工作流 `pr-gif` 会检查这一节. 确实没有可见变化时由维护者加 `no-gif` 标签, 并在这里写明理由.

<!-- 把下面的示例换成真实内容 (HTML 注释里的图片不算数):
![<演示内容>](https://raw.githubusercontent.com/HengXin666/HX-UI/pr-assets/pr-<编号>/<短 sha>-<主题>.gif)
-->

- 演示的 commit: <完整 SHA>
- 演示内容: <哪些组件, 哪些交互, 文档站页面 #/...>
- 截图间隔 / 播放倍速: <例如 每帧 1.5s, 末帧 3s; 或 视频 1s-9s, 1.5 倍速>
- 浏览器: <CHROMIUM_PATH 指定的二进制 / playwright chromium>
