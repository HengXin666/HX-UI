---
name: record-browser-gif
description: "为 HX-UI 录制前端交互演示 GIF: 从 PR 头部的确切 commit 构建文档站, 用仓库声明的 playwright 在隔离 headless 浏览器里按分镜操作组件文档页, 用 encode_gif.py 确定性编码并校验, 再推到专用孤儿分支 pr-assets 并嵌入 PR 正文. 凡是改动前端功能的 PR (src/**/*.tsx, src/**/*.css, docs/src/**) 都必须附 GIF; 被要求 \"录个 GIF / 做个演示动图\" 时也用本技能."
---

# 录制浏览器 GIF (HX-UI 版)

> 来源: 改编自 [deepseek-ai/deepseek-harness `.agents/skills/record-browser-gif`](https://github.com/deepseek-ai/deepseek-harness/tree/master/.agents/skills/record-browser-gif) (上游提交 2e08462, MIT License, Copyright (c) 2026 DeepSeek, 许可全文见同目录 `LICENSE`, 仓库 `NOTICE` 有登记). `scripts/encode_gif.py` 与 `scripts/test_encode_gif.py` 按原样保留; `SKILL.md` 改写为 HX-UI 的流程 (文档站代替 dsh 服务器, 去掉模型 / API key 步骤, 发布改为 pr-assets 分支); `scripts/record_docs.ts` 是本仓新增的分镜录制器.

产出一段短小, 真实的组件交互演示 GIF; 只有任务包含 "附到 PR" 时才执行最后的发布步骤. 决策与取舍见 `.agents/notes/implemented/process/2026-10-18-pr-gif-demo.md`.

## 每个前端 PR 都带 GIF

改动前端功能的 PR (改了 `src/**/*.tsx`, `src/**/*.css` 或 `docs/src/**`) 必须在 PR 正文附一张用本技能录制的 GIF, 演示改动涉及的组件在文档站上的真实交互. CI 工作流 `pr-gif` 会在这类 PR 正文里找不到 GIF 图片链接时失败. 纯重构, 纯类型或确实没有可见变化的改动, 由维护者加 `no-gif` 标签豁免, 并在 PR 正文写明理由.

GIF 旁边必须写清: 演示的确切 commit SHA, 演示了哪些组件与交互, 截图间隔或播放倍速 (以及 `--start/--end` 截取区间), 用的浏览器 (CHROMIUM_PATH 指定的二进制或 playwright 自带 chromium). 录制本身就是证据: 只用 PR 自己的代码构建出的文档站, 不用伪造数据注入或测试专用钩子去 "摆拍" 组件没有的行为.

## 录制与发布分开

- 录制只产出本地截图 / 视频与一个 `.gif`, 不改任何远端状态.
- 发布 (推到 `pr-assets` 分支并改 PR 正文) 是单独的最后一步, 只在任务包含附到 PR 时执行; 它永远不碰 PR 自己的分支.
- GIF 永远不提交到 PR 分支或任何会合并进长期分支的分支: 二进制媒体会让之后每一次 clone 都背上它.
- 不录任何凭据, 个人数据, 无关标签页或通知.

## 准备演示对象

1. 工作区必须干净, 用 `git rev-parse HEAD` 记下确切 commit; 录制器在工作区有未提交改动时拒绝运行 (除非显式 `--allow-dirty`, 此时 PR 里要说明).
2. 从这个 commit 构建: 根目录 `npm ci`, `npm --prefix docs ci`, 然后 `npm --prefix docs run build` 产出 `docs/dist`. 用别的 commit 的构建录制会张冠李戴.
3. 组件演示在它们各自的文档页上 (hash 路由 `#/<组件 id>`, 页面 id 见 `docs/src/nav.ts`). 录制器自己起一个只读静态服务挂 `docs/dist`, 每次运行都是全新的浏览器上下文, 不带任何已有的 localStorage / cookie.
4. 一个分镜就是一次运行: 发布的每一帧都来自同一次运行. 自动化中途失败就整批丢弃重录, 不拼接不同运行的帧.

## 录制

浏览器驱动只用仓库根 `package.json` 声明的 devDependency `playwright` (录制器通过 `createRequire` 从仓库根解析), 不另装驱动, 不打开用户自己的浏览器. 设了 `CHROMIUM_PATH` 时用它 (与 `npm run test:e2e` 同一约定), 否则用 `npx playwright install chromium` 装的那份.

所有产物 (分镜, 截图, 视频, capture.json, GIF) 放在仓库根已 gitignore 的 `.playwright-gif/<run>/` 下, 先建目录.

分镜写成 JSON (格式见 `scripts/record_docs.ts` 文件头), 选三到六个有意义的状态. 每次操作前用唯一的语义选择器等待就绪 (`waitFor`), 固定等待 (`wait`) 只用于已验证状态之后的阅读停留, 不用来 "等它好". 示例:

```json
{
  "viewport": { "width": 1280, "height": 800 },
  "steps": [
    { "goto": "#/command" },
    { "waitFor": "h1" },
    { "shot": "command-page" },
    { "press": "Control+j" },
    { "waitFor": "[cmdk-input]" },
    { "type": "设置" },
    { "wait": 400 },
    { "shot": "command-filtered" }
  ]
}
```

```sh
run=".playwright-gif/pr-<编号>-$(git rev-parse --short HEAD)"
mkdir -p "$run"
# 写好 "$run/storyboard.json" 后:
node .agents/skills/record-browser-gif/scripts/record_docs.ts --storyboard "$run/storyboard.json" --out "$run"
# 需要连续动效 (弹层进出场, 轮播滑动) 时加 --video, 产出 "$run/demo.webm"
```

录制器写出 `capture.json`: 演示的 commit, 工作区是否干净, 视口, 浏览器来源, 截图清单与每步时间线 (毫秒). 视频模式下视口与录像尺寸一致, 不会被缩到 800×800 导致文字糊掉.

## 编码 GIF

需要 `python3`, `ffmpeg`, `ffprobe`. 缺媒体二进制时报告依赖缺失, 不擅自安装.

截图分镜 (每帧停留时长, 一个值作用于全部帧, 或逐帧给出; 最后的稳定状态停留最久):

```sh
python3 .agents/skills/record-browser-gif/scripts/encode_gif.py \
  "$run/frames" "$run/demo.gif" \
  --durations 1.5,1.5,1.5,3 --fps 10 --max-width 1200 --colors 128
```

视频 (按观察到的视频时间截取连续区间, 倍速与区间要写在 GIF 旁边, 避免让人误读为真实响应耗时):

```sh
python3 .agents/skills/record-browser-gif/scripts/encode_gif.py \
  "$run/demo.webm" "$run/demo.gif" \
  --start 1 --end 9 --speed 1.5 --final-hold 2 --fps 12 --max-width 1200 --colors 128
```

编码器会探测时长, 在调色板转换前做截取与变速, 校验编码后的时长, 帧数, 宽度与字节数 (默认上限 5 MB), 拒绝空区间, 少于两帧的选择, 模式不符的参数与意外覆盖. 文件过大时依次降低 `--max-width`, `--colors`, `--fps`, 保证文字可读. 只有确认输出路径无误后才用 `--force`.

## 校验产物

1. 读编码器输出的 JSON: 输出路径, 截图数或截取区间与倍速, 编码帧数, 尺寸, 时长, 字节数.
2. 看编码后的 GIF 本身, 而不只是源截图: 用 ffmpeg 从 GIF 解出几帧代表帧检查顺序, 调色板与最后的停留, 例如
   `ffmpeg -v error -i "$run/demo.gif" -vf "select='eq(n\,0)+eq(n\,15)+eq(n\,40)'" -vsync 0 "$run/qa-%02d.png"`.
   确认过渡清晰, 末状态停留够久, 没有敏感内容.
3. `git status --short` 确认截图, 视频与 GIF 都只落在被忽略的 `.playwright-gif/` 下.
4. 报告 GIF 路径与演示的 commit. 任务不包含附到 PR 时到此为止.

编码器维护: 装好媒体依赖后运行 `python3 -m unittest discover -s .agents/skills/record-browser-gif/scripts -p 'test_*.py' -v`. 这组本地媒体测试不进仓库 CI.

## 发布到 PR

只在任务包含附到 PR 时执行. HX-UI 不用 `gh --attach`; GIF 统一放在专用孤儿分支 `pr-assets` (没有父提交, 只放媒体, 永不合并) 的 `pr-<PR 编号>/` 目录下.

1. 发布前重新读取 PR 的实时 head SHA, 与 capture.json 的 commit 比较; 不一致就停下重录.
2. 在临时目录里浅克隆 assets 分支操作, 不碰自己的工作区:

```sh
assets="$(mktemp -d)"
if git ls-remote --exit-code --heads origin pr-assets >/dev/null; then
  git clone --branch pr-assets --single-branch --depth 1 "$(git remote get-url origin)" "$assets"
else
  git clone --depth 1 "$(git remote get-url origin)" "$assets"
  git -C "$assets" switch --orphan pr-assets
fi
mkdir -p "$assets/pr-<编号>"
cp "$run/demo.gif" "$assets/pr-<编号>/<短 sha>-<主题>.gif"
git -C "$assets" add "pr-<编号>"
git -C "$assets" commit -m "assets: PR #<编号> <主题> 演示 GIF (<短 sha>)"
git -C "$assets" push origin pr-assets
```

   推送前确认 assets 分支里只有媒体文件, 且暂存的 GIF 校验和与本地已校验的产物一致.
3. 推送后用带认证的请求确认远端路径, 字节数与 `200` + `image/gif` 响应 (私有仓库匿名 404 不说明问题).
4. 在 PR 正文的 "演示" 一节嵌入 raw 地址, 并写明 commit, 演示内容与间隔 / 倍速:

```markdown
![<演示内容>](https://raw.githubusercontent.com/<owner>/<repo>/pr-assets/pr-<编号>/<文件名>.gif)
```

5. 改完正文后再读一次 PR 的实时 head, 仍须等于演示的 commit; 用 GitHub Markdown 渲染确认 `<img>` 存在.

`pr-assets` 分支只追加提交: 不删除, 不改写, 不强推, 已合并 PR 的正文会永久引用这些地址. 它也永远不发 PR, 不合并进 main.
