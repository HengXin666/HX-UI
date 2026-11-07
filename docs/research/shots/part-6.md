# video-shotcraft demos part 6

来源提交 `1266a3e`. 每个 tsx 逐行扫描. 30fps, 1 帧 = 33.3ms.

### demos/ui-entrance/wall-reveal-moves/BentoLightUp

- 镜头卡: `references/shots/ui-entrance/wall-reveal-moves.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 17 行
- 分镜:
  - `BentoLightUp.tsx:17` `export const BENTO_LIGHT_UP_DURATION = 150;`
  - `BentoLightUp.tsx:19` `const AMBER = '#e8b45e';`
  - `BentoLightUp.tsx:20` `const FIRST = 20; // 首格激活帧`
  - `BentoLightUp.tsx:21` `const GAP = 12; // 格间节拍`
  - `BentoLightUp.tsx:22` `const CELL_H = 330;`
  - `BentoLightUp.tsx:23` `const GUT = 44;`
  - `BentoLightUp.tsx:25` `const ROW_W = U * 3 + GUT * 2;`
  - `BentoLightUp.tsx:26` `const LEFT = (1920 - ROW_W) / 2;`
  - `BentoLightUp.tsx:27` `const TOP = (1080 - (CELL_H * 2 + GUT)) / 2 + 44;`
  - `BentoLightUp.tsx:49` `const draw = interpolate(frame, [start, start + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });`
  - `BentoLightUp.tsx:51` `const strokeFade = interpolate(frame, [start + 12, start + 26], [1, 0.4], { ...clamp, easing: Easing.out(Easing.quad) });`
  - `BentoLightUp.tsx:52` `const ring = interpolate(frame, [start + 2, start + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });`
  - `BentoLightUp.tsx:55` `const lit = interpolate(frame, [start + 6, start + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });`
  - `BentoLightUp.tsx:56` `const rise = interpolate(frame, [start + 6, start + 14], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 1.4, 0.5, 1) });`
  - `BentoLightUp.tsx:63` `const TAIL = 22;`
  - `BentoLightUp.tsx:101` `opacity={(1 - interpolate(frame, [start + 8, start + 16], [0, 1], clamp)) * (k ? 1 : 0.8)}`
  - `BentoLightUp.tsx:115` `const push = interpolate(frame, [96, 121], [1, 1.04], { ...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1) });`
  - `BentoLightUp.tsx:118` `const titleLit = interpolate(frame, [FIRST, FIRST + 20], [0.25, 1], { ...clamp, easing: Easing.out(Easing.quad) });`
  - `BentoLightUp.tsx:120` `const allLit = interpolate(frame, [FIRST + 5 * GAP + 6, FIRST + 5 * GAP + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });`
- 卡片参数:
  - `wall-reveal-moves.md:5` `时长: 单式约 5s（A 150f / B 150f @30fps，含建立 hold 与静止收尾）`
  - `wall-reveal-moves.md:13` `版式从第一帧就成立，观众看的是"状态变化的波前扫过一面墙"而不是"物体飞行"。`
  - `wall-reveal-moves.md:25` `| A 节拍 | hold 20f → 每格间隔 12f 依次激活（六格 ~96f 全亮）→ scale 1→1.04 缓推 25f（bezier 0.33,0,0.2,1）→ 静止收尾 | 12f 级联是"逐格可辨"与"整墙拖沓"的平衡点；格数增多可压到 8–10f，但间隔均匀本身就是这一式的庄重感来源，别学发牌加速 |`
  - `wall-reveal-moves.md:26` `| A 单格 | 暗态 opacity 0.18 + translateY 20px；SVG rect pathLength=100 描边 8f：22% 周长的彗星段（#e8b45e 6px 高斯辉光 + #ffe3ae 2.5px 亮芯）领跑，身后留 1.5px 细边；描边过半（+6f）内容 back-out(0.3,1.4,0.5,1) 弹出 8f 提亮归位；描完 +12f 流光退火到 0.4 常亮细边 | 描边与内容弹出要**接力...`
  - `wall-reveal-moves.md:27` `| B 描线 | hold 20f → 分组错峰各 30f 描完：侧栏 20f 起/顶栏 30f 起/6 卡 40+i*3f 起/折线图 52f 起；SVG pathLength=1 + dashoffset 1→0，蓝图冷灰蓝 #6c7894（外框 1.6px / 内件 1.25px）round，淡蓝 24px 点阵底 + 卡角裁切标记 | 分组错峰是"手在画"的感觉来源，全部同帧起笔读作打印机；卡内占位线再按 +3f 细错峰，长短用...`
  - `wall-reveal-moves.md:28` `| B 实体化 | 88–118f 实体层 clip-path inset(0 right% 0 0) 从左向右展开 30f，bezier(0.55,0,0.25,1)；前沿跟 4px 强调色竖线（#ffc46b + 双层辉光 boxShadow），86–92f 淡入、112–120f 淡出；竖线身后 260px 一段渐隐暖光（刚显影的余温） | 竖线位置与 clip 前沿必须同一个 scan 值驱动，异步读作穿帮；描线段与扫描段之间留...`
  - `wall-reveal-moves.md:29` `| 静止收尾 | 两式动作全部落定后真静止 ≥15f（A 在缓推结束后、B 在扫描线淡出后起算） | R1 呼吸判例：静止期一切属性锁死，包括辉光/阴影/高光残留 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/wall-reveal-moves/WireframeDrawOn

- 镜头卡: `references/shots/ui-entrance/wall-reveal-moves.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 15 行
- 分镜:
  - `WireframeDrawOn.tsx:18` `export const WIREFRAME_DRAW_ON_DURATION = 150;`
  - `WireframeDrawOn.tsx:23` `const CARD_W = 524;`
  - `WireframeDrawOn.tsx:24` `const CARD_H = 454;`
  - `WireframeDrawOn.tsx:25` `const CARD_X = [256, 808, 1360];`
  - `WireframeDrawOn.tsx:26` `const CARD_Y = [108, 590];`
  - `WireframeDrawOn.tsx:27` `const MARK_K = 26 / 128; // 侧栏 ShotcraftMark 26px ÷ viewBox 128`
  - `WireframeDrawOn.tsx:29` `const PROJ_W = [72, 77, 76];`
  - `WireframeDrawOn.tsx:30` `const INK = '#6c7894'; // 蓝图线色`
  - `WireframeDrawOn.tsx:31` `const PAPER = '#eef0f2';`
  - `WireframeDrawOn.tsx:62` `interpolate(frame, [start, start + 30], [0, 1], { ...clamp, easing: Easing.bezier(0.4, 0, 0.3, 1) });`
  - `WireframeDrawOn.tsx:70` `const scan = interpolate(frame, [88, 118], [0, 1], { ...clamp, easing: Easing.bezier(0.55, 0, 0.25, 1) });`
  - `WireframeDrawOn.tsx:72` `const lineOpacity = interpolate(frame, [86, 92, 112, 120], [0, 1, 1, 0], clamp);`
  - `WireframeDrawOn.tsx:73` `const gridIn = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });`
- 卡片参数:
  - `wall-reveal-moves.md:5` `时长: 单式约 5s（A 150f / B 150f @30fps，含建立 hold 与静止收尾）`
  - `wall-reveal-moves.md:13` `版式从第一帧就成立，观众看的是"状态变化的波前扫过一面墙"而不是"物体飞行"。`
  - `wall-reveal-moves.md:25` `| A 节拍 | hold 20f → 每格间隔 12f 依次激活（六格 ~96f 全亮）→ scale 1→1.04 缓推 25f（bezier 0.33,0,0.2,1）→ 静止收尾 | 12f 级联是"逐格可辨"与"整墙拖沓"的平衡点；格数增多可压到 8–10f，但间隔均匀本身就是这一式的庄重感来源，别学发牌加速 |`
  - `wall-reveal-moves.md:26` `| A 单格 | 暗态 opacity 0.18 + translateY 20px；SVG rect pathLength=100 描边 8f：22% 周长的彗星段（#e8b45e 6px 高斯辉光 + #ffe3ae 2.5px 亮芯）领跑，身后留 1.5px 细边；描边过半（+6f）内容 back-out(0.3,1.4,0.5,1) 弹出 8f 提亮归位；描完 +12f 流光退火到 0.4 常亮细边 | 描边与内容弹出要**接力...`
  - `wall-reveal-moves.md:27` `| B 描线 | hold 20f → 分组错峰各 30f 描完：侧栏 20f 起/顶栏 30f 起/6 卡 40+i*3f 起/折线图 52f 起；SVG pathLength=1 + dashoffset 1→0，蓝图冷灰蓝 #6c7894（外框 1.6px / 内件 1.25px）round，淡蓝 24px 点阵底 + 卡角裁切标记 | 分组错峰是"手在画"的感觉来源，全部同帧起笔读作打印机；卡内占位线再按 +3f 细错峰，长短用...`
  - `wall-reveal-moves.md:28` `| B 实体化 | 88–118f 实体层 clip-path inset(0 right% 0 0) 从左向右展开 30f，bezier(0.55,0,0.25,1)；前沿跟 4px 强调色竖线（#ffc46b + 双层辉光 boxShadow），86–92f 淡入、112–120f 淡出；竖线身后 260px 一段渐隐暖光（刚显影的余温） | 竖线位置与 clip 前沿必须同一个 scan 值驱动，异步读作穿帮；描线段与扫描段之间留...`
  - `wall-reveal-moves.md:29` `| 静止收尾 | 两式动作全部落定后真静止 ≥15f（A 在缓推结束后、B 在扫描线淡出后起算） | R1 呼吸判例：静止期一切属性锁死，包括辉光/阴影/高光残留 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.
