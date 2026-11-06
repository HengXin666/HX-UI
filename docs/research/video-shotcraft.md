# video-shotcraft 逐文件读记

来源: https://github.com/Vincentwei1021/video-shotcraft
提交: `1266a3ec4831289c4d893d42dd5102723658039a` (浅克隆, 2026-11-06 拉取).

## 0. 实际读了多少

跟踪文件 1218 个.

| 类 | 数量 | 这次怎么处理 |
|---|---|---|
| Markdown | 280 | 全部扫过标题与带时长/缓动/帧号的行. `references/aesthetic-rules.md` 全文. 下面引用的镜头卡按行读过 |
| 镜头卡 `references/shots/**/*.md` | 124 张内容卡 + `shots/ATTRIBUTION.md` | 10 个目录的文件名全部列出. 抽样精读: `deck-deal-flyin`, `spotlight-hero-card`, `segmented-thumb-hero`, `chart-live-moves`, `crash-zoom-punch` |
| Remotion demo `demos/**/*.tsx` | 226 | 统计依赖: 只有 `remotion`, `@remotion`, `react`. 没有逐个演示组件展开每一行 |
| `shot-polish/` | 377 | 大多是成片注释 JSON, 当作判例库的索引, 没有逐条当新规则 |
| 其余 | SKILL.md 标题结构, template, workbench, gallery 静态预览 | 读了职责, 没有把每张 png 当规范 |

30fps 下 1 帧 = 33.3ms. 卡片里的 `8f` 就是约 267ms. 下面全部保留帧号, 因为他们的手感是按帧写的, 不是按 "快一点" 写的.

## 1. 它是什么

`SKILL.md` 是给编码代理的制片流程, 不是组件库. 调用时先判断任务范围, 再选四种用法之一 (整片, 指定镜头卡, 指定模板, 单镜改编). 实现在 Remotion: 每镜一个 React 组件, 时间是 `useCurrentFrame()`, 缓动是 `Easing`. 成片 1920x1080, 30fps. 交付物是 MP4, 可编辑的 Remotion 工程, 以及可选的剪辑草稿.

和网页组件的差别: 他们管的是 5 到 8 秒的一次注视, 我们管的是可以随时被打断的控件. 能搬的是幅度, 相位, 停顿和 "什么不许做". 不能搬的是不可交互的时间轴.

## 2. 审美准则里能执行的句子

文件: `references/aesthetic-rules.md`. 每条都是规则 + 判例原话 + 自检. 编号不重排.

节奏:

- R1. 信息落定后静止至少 1 秒. 停顿给要被记住的字, 不给普通卡片. 判例原话: "第一个标题打出来之后停留一秒".
- R2. 速度来自加速度. 群体运动要有物理隐喻 (发牌), 满板后再静止 0.5 秒. 匀速等于廉价幻灯片. 判例: "归位越来越快".
- R3. 主体动作弧至少 3 秒. 打字和筛选按真人速度. 六次反馈全是 "太快", 没有一次 "太慢".
- R4. 全画面的砸, 闪, 缩放泵全片最多 3 处, 相邻至少隔 16 拍. 其余拍子只动主角元素. 判例: "镜头会随节奏抖动".

构图和质感:

- Q1. 复刻既有界面必须用真实截图. 手搓只允许本来就没有的展示件, 而且要出版级密度.
- Q3. 产品片默认禁止手持抖动.
- Q4. 扫光不群发. 一个镜头最多给主角一次, 并且裁进圆角.
- Q5. 开场只有一个主角, 一条弧: 聚光, 推近, 悬浮, 归位.
- Q6. 信息密集的列表保持正视. 文字特写用侧向水平机位, 不要大角度俯拍. 判例: "从左侧拍摄而不是从下方".
- Q9. 飞入的终点必须是布局里的真实槽位, 不许永远浮在页面上.
- Q10. 文档镜头里的字要铺满, 侧栏和版式要在画里.
- Q11. 要读的字有最低字高. 读不清的字删掉, 不存在 "重排了但仍读不清" 的中间态.

声音 (网页默认不用, 但说明他们把 "触感" 和 "音效" 分开):

- S1. 禁的是游戏音包的音色, 不是禁点击这件事. 判别句: 像真实物件的声音, 还是像引擎提示音.

## 3. 镜头词汇 (124 张卡的目录)

相机 10: basic-3d-scene, crash-zoom-punch, cursor-flyover, depth-layer-moves, graze-face-tour, overhead-camera-moves, space-camera-moves, steep-tilt-glide, tension-camera-moves, terminal-3d.

开场 11: brand-ink-open, crane-rise-reveal, dataviz-landscape-open, fracture, icon-field-colorize, letterspace-materialize, magician-card-flourish, orbit-ring-title-open, spotlight-hero-card, stroke-segment-build, text-as-mask.

界面入场 21: 其中包括 card-stack, deck-deal-flyin, list-reveal, list-stack-press, product-card-progressive-assemble, row-embed, value-stagger-gradient, wall-reveal-moves. 这是和网页区块最接近的一组.

交互 11: segmented-thumb-hero, type-and-filter, theme-switch-moves, chip-grid-single-select-blackout, glass-pill-dictation-typing, picker-carousel-feature-cycle, 等.

数据 5: chart-live-moves, gauge-readout-moves, before-after-slider-scrub, scroll-brake-moves, timeline-travel.

节奏 8, 转场 15, 字效 22, 光效 15, 收尾 6. 转场和光效大多数不该进普通文档页. 收尾的 outro-group-photo-launch 是 "全家福", 能量最高, 只适合整页的最后一屏.

## 4. 五张卡上的可执行数字

### deck-deal-flyin (发牌)

时长 150 帧, 约 5 秒. 0 到 36 帧牌堆特写, 36 到约 101 帧发牌, 108 到 150 帧满板 hold.

第 k 张的 cue = `36 + 4k - 0.0792*k*(k-1)`. 间隔从 4 帧收到 0.2 帧. 这就是硬加速, 不是 `k * 常数`.

单卡: 飞行 8 帧, `bezier(0.3, 0, 0.2, 1)`, z 弧顶 `+110px * sin`, scale 峰值 1.06. 停稳 4 帧, `bezier(0.3, 0, 0.25, 1.15)` 轻过冲. 再 press `0.996 -> 1` 用 2 帧. 落定后强制 identity transform, 防止亚像素斜着漂.

预备拍: 出牌前 10 帧, 牌堆下压 48px, 顶卡回拉 30px, easeOut. 卡片写明 4px 和 2px 的初版 "完全无感", 放大约 12 倍才通过. 幅度必须过肉眼阈值.

收尾分层: 卡体先锁, 阴影滞后 2 到 4 帧从 `0 32px` 收到 `0 2px`, 残影再拖 3 到 5 帧. 全要素同一帧冻住会被读成机械.

相机运动模糊只包速度不低于 30px/帧 的段落, `shutterAngle={180}`, `samples={10}`. 慢段不包, 否则细纹理被抹掉.

### spotlight-hero-card (开场唯一主角)

172 帧, 约 5.7 秒. 锁定在第 34 帧, 触地在第 142 帧, 然后 30 帧真静止.

相机: 0 到 40 帧 zoom 0.8 不动, 再用 18 帧推到 zoom 2.6. `rotY 34deg` 为主, `rotX` 只有 8deg, perspective 1200. 收尾禁止 `2.6 -> 2.58` 这种尾漂. 呼吸交给光, 不交给相机.

动作弧: rise 10 帧, `bezier(0.2, 1.25, 0.3, 1)` 过冲. 悬停 58 帧, 正弦上下振幅 4px, 周期 40 帧, z = 110px. reseat 18 帧, 落地压到 0.997. 从锁定到落地约 3.6 秒, 对应 R3 的 "放慢到 3 秒".

光: 圆光斑罩卡片会两头暗, 中间爆. 主角改成卡片形状的软孔, 文字保持原生对比. 扫光只沿这一张卡的圆角走两圈, 第二圈更慢更弱.

### segmented-thumb-hero (控件特写)

分段拇指本身就是主角. 控件放到 1080x220, 拇指内缩 16px. 小于 600px 宽就不是特写.

- 控件浮入: spring damping 14, stiffness 120. 阴影从 24px 收到 12px.
- 光标从画外进入 24 帧, ease-out. 短于 14 帧或线性, 读作被扔进来.
- 按下: scale 0.86, 涟漪 12 帧. 没有按下就滑拇指, 因果断掉.
- 拇指滑动严格 8 帧, `Easing.out(cubic)`. 长于 14 帧像慢动作, 短于 5 帧像瞬移.
- 到位同一帧: 新图标 spring damping 10, stiffness 220. damping 小于 8 会连弹三下, 抢走拇指的戏.
- 三段以上不要用 8 帧滑完全程, 中间没有停靠点.
- 涟漪圆心锁在点击点, 不跟着拇指走. 跟着走就变成拖尾.

### crash-zoom-punch

动作本身 6 到 11 帧. 前 hold 至少 30 帧建立全景, 后 hold 至少 45 帧读特写. zoom 用 6 帧 ease-in 从 1 到 2.6, 中心同时 ease-in 收到目标. 急推前 6 到 8 帧先回拉 3% 到 4%. 全片不能每拍都来一次.

### chart-live-moves

三式, 不是三条淡入的折线:

- oscilloscope-stream: 曲线右端持续写入, 允许突发尖峰.
- unit-dot-swarm-regroup: 点群迁徙聚成数字.
- axis-rescale-shock: 值冲出画框 226px, 刻度, 网格, 旧线三件事一起重标, 再震 10px. 增长要让坐标轴坏一次, 而不是把线画得更亮.

## 5. 他们怎么避开 "生成味"

不是换一个更冷的蓝. 是这些否决:

- 匀速, 等间隔, 全要素同一帧停住.
- 幅度低于肉眼阈值还声称有预备拍 (4px 被判没做).
- 开场几个元素一起跳舞.
- 扫光每张卡来一次.
- 手持或逐拍的全画面抖动.
- 玻璃和泛光溢出圆角.
- 字处于 "想让人读但读不清".
- 飞入之后不落进真实布局.
- 列表用大角度倾斜, 字被透视压扁.

网页上对应的禁令: 不要整页 `fadeUp 12px`, 不要每个区块同一种 stagger 60ms, 不要紫色光雾当背景, 不要把毛玻璃当默认表面.

## 6. 不能直接搬进组件库的部分

Remotion 的帧时钟不能被用户打断. 控件必须能在中途反向, 并且保留速度. 所以发牌公式要改成可求解的进度函数: 给定已经过的时间, 能算出每个子项的相位, 也能在 `prefers-reduced-motion` 时把相位钉在 1.

30fps 的运动模糊 (`shutterAngle`) 在 CSS 里没有对等物. 网页用短残影 (opacity 随进度下降) 只给主角一次, 不对着正文开.

声音轨不进文档站. 触感只来自位移, 缩放, 阴影半径和按下的 0.86.
