# 文档站门面 (docs/face) 换库件时遇到的库缺口

2026-11-08. 门面把私有副本换成库件时, 下面几处库件现有 API 盖不住门面的需求, 硬换会让首页变样, 改库又不归门面这一路. 这一轮门面全部保持现状, 不换; 由库本体那一路统一补齐后再换.

编号沿用门面重复清单里的编号.

## C2 Trend 缺"按进度驱动"

- 门面: `docs/face/home/shots/chart/ChartFigure.tsx` (由 `ChartShot.tsx`, `docs/face/home/action/ChartCard.tsx` 使用)
- 库件: `src/viz/charts/Trend.tsx`
- 缺口: Trend 只会自己按时间播入场, 外部不能给一个 0..1 的进度让曲线画到哪一步. 门面的图卡由首页分镜时钟驱动 (滚动进视口, 循环, 回放都对齐同一根时间轴), 必须受控.
- 建议: 加受控 `progress?: number` (0..1). 给了就停用内部时钟, 线长, 末点和数值标签都跟 progress 走; 不给保持现状. 减弱动效时直接取 1.
- 已补: `Trend` 的 `progress?: number` (0..1); 纯数学 `revealSeries` 在 `src/viz/scale.ts`.
- 门面切换: ChartFigure 改成 `<Trend values={SERIES} label=... progress={pose.draw} />`, 由分镜时钟给 progress; 坐标轴冲击仍按全部 values 算, 若要冲击也跟时钟走需再提缺口.

## D4 TestimonialMarquee 缺纵向

- 门面: `docs/face/home/more/Changelog.tsx` (三列纵向滚动的提交卡, 现直接用基础 `Marquee vertical`)
- 库件: `src/blocks/marketing/social-proof/TestimonialTracks.tsx` 的 `TestimonialMarquee`
- 缺口: 只有横向轨道. 门面要的是多列, 纵向, 相邻列反向, 每列时长不同, 悬停暂停.
- 建议: 加 `direction?: "horizontal" | "vertical"` 与按列的 `durations?: number[]`, 纵向时列数随断点收 (窄屏一列).
- 已补: `TestimonialMarquee` 的 `direction?: "horizontal" | "vertical"`, `durations?: number[]`, `className`; 纵向时 `rows` 是列数 (最多 4). `Testimonials` 的 `marquee` 配置同样透传.
- 门面切换: Changelog 改成 `<TestimonialMarquee direction="vertical" rows={3} durations={[70, 86, 78]} slides={卡片} className="h-[1110px] ..." labels=... />`; 列间距与遮罩用 className 覆盖.

## C10 RadioGroupItem 强加圆点

- 门面: `docs/face/home/hero/Presets.tsx` (首屏背景预设, role="radiogroup" + 缩略图卡)
- 库件: `src/primitives/radio-group.tsx` 的 `RadioGroupItem`
- 缺口: Item 固定渲染圆形指示器, 不能拿整张卡当可选项. 门面的选中态是卡的描边和底色, 没有圆点.
- 建议: 加 `indicator?: ReactNode | false` (false 不出指示器), 或开放 `asChild`, 让调用方给整块内容; 键盘与 aria 语义保持由 RadioGroup 管.
- 已补: `RadioGroupItem` 的 `indicator?: ReactNode | false` (false 不出指示器也不套圆圈外形, children 作整块内容).
- 门面切换: Presets 改成 `<RadioGroup>` 包 `<RadioGroupItem indicator={false} value=... className="... data-[state=checked]:border-primary">缩略图</RadioGroupItem>`, 删掉手写 role 与键盘处理.

## D3 Faq 区块盖不住门面的手风琴卡 (本轮新发现)

- 门面: `docs/face/home/outro/Faq.tsx` (左标题 576 宽, 右侧每问一张圆角卡, 库 Accordion 展开带高度动画)
- 库件: `src/blocks/marketing/Faq.tsx`
- 缺口: 问答固定是原生 details 加分隔线列表 (`FAQ_CLASS.list` / `item` / `summary`), 没有 item 级 classNames, 也换不成 Accordion; 双栏比例固定 1fr / 2fr, 左栏固定 sticky. 换过去卡片样式, 展开动画, 左栏宽度都会变.
- 建议: 加 item / summary / answer / list / split 的 classNames 槽位, 和 `variant?: "details" | "accordion"`; 双栏比例走 classNames.split.
- 已补: `Faq` 的 `variant?: "details" | "accordion"` 与部件 classNames 槽位 item / summary / answer / list / split / aside (与外壳 root / container / content / backdrop 并列).
- 门面切换: outro Faq 改成 `<Faq columns={2} variant="accordion" heading=... items={QA} classNames={{ split: "md:grid-cols-[576px_minmax(0,1fr)] md:gap-0", aside: "md:static", list: "grid gap-2 divide-y-0 border-y-0", item: "rounded-xl border border-border bg-card px-5", summary: "py-[18px] text-[16px] font-normal", answer: "text-[14px] leading-[22px]" }} />`.

## D5 data-skin 没有门面这套暗色

- 门面: `docs/face/skin/face.css` (根元素带 data-face 且没有 data-skin 时生效的暗色语义令牌)
- 库件: `src/skins/*.css`, `src/constants/skins.ts` 的 `SKIN_LIST`
- 缺口: 库的皮肤清单里没有一套与门面取值相同的皮肤 (底 #120f17, 主色 #a855f7 那套). 改成写 data-skin 会把整站换成别的配色; 门面也不能往库里加皮肤.
- 建议: 库里收一套对应的皮肤 (例如 `face` 或 `midnight`), 进 SKIN_LIST; 门面随后改成默认写这个 data-skin, 删掉 face.css.
- 已补: 皮肤 `midnight` (`src/skins/midnight.css`, `SKIN.midnight`, 进 `SKIN_LIST`), 暗色令牌逐项同 face.css, 亮色回到默认亮色令牌.
- 门面切换: 门面入口在根元素默认写 `data-skin="midnight"` (或调 `applySkin(SKIN.midnight)`), 用户在皮肤页另选时照常覆盖; 删掉 `docs/face/skin/face.css` 及其引入, `data-face` 若只为这份样式服务也一并去掉.

## 需要先定内核决策

2026-11-09. surface Backgrounds 第二轮补 ENGINE-GAP 时, 下面四件不动. 它们缺的不是某个着色器写法, 而是 `src/surface/backdrop/kernel` 没有的绘制方式: 内核只有全屏片元 (含离屏通道与纹理上传) 和 Canvas2D, 没有顶点缓冲, 实例化绘制, 点精灵, 深度缓冲. 加任何一种都要改内核公共头 (`ShaderSpec` / `BackdropFrame` 只加不改的约束之外还要新的渲染器工厂), 三路 surface 都依赖它, 所以先定内核决策, 再回头补这四件. 同一决策落地后, Hyperspeed, GhostFibers, AeroShards, MagnetLines 剩下的实例化部分也一起补.

待定的决策: 内核是否加一条 "实例化几何" 渲染方式 (WebGL2 `drawArraysInstanced` + 每实例属性缓冲 + 深度缓冲, 可选与现有离屏通道共用泛光); 若加, 定公共 uniform, 实例数据的更新接口 (JS 每帧写 Float32Array 或纹理里算位置), 以及与 Canvas2D 兜底的关系.

### AcidSquares (grid)

- 库件: `src/surface/backgrounds/grid/AcidSquares.tsx`
- 缺口: 规格是实例化三维网格 (MESH 150 / 210 / 280 细分, uViewProj 投影), 柱面有逐格细分形变与网格 LOD. 现为逐像素视线步进方柱高度场, quality 只换步进上限, 柱高按格取样, 远处以混向平均色代替 LOD.
- 为什么这轮补不了: 片元步进做不出柱面内细分形变, 加步数只换来更贵的近似; 真要对上规格需要顶点网格与深度缓冲.

### Antigravity (particles)

- 库件: `src/surface/backgrounds/particles/Antigravity.tsx`
- 缺口: 规格是 WebGL 实例化的三维小体 (胶囊 / 球 / 盒 / 四面体) 带逐体光照. 现为 Canvas2D 二维剪影, 深度只体现为尺寸与雾.
- 为什么这轮补不了: 逐体光照需要每个小体的法线与朝向; Canvas2D 只能画剪影, 全屏片元对上千个小体逐像素求交代价过高. 需要实例化通道.

### Ballpit (particles)

- 库件: `src/surface/backgrounds/particles/Ballpit.tsx`
- 缺口: 规格是 WebGL 实例化球体带 PBR 光照, 环境反射与球间阴影. 现为 Canvas2D 按深度排序画透视圆, 光照以径向渐变 + 高光 + 菲涅耳边光近似, 无球间投影.
- 为什么这轮补不了: 球间阴影与环境反射需要深度缓冲或逐像素对全部球求交; 后者在球数上百时片元成本按球数线性增长, 在集显上掉帧. 需要实例化通道与深度缓冲.

### Particles (particles)

- 库件: `src/surface/backgrounds/particles/Particles.tsx`
- 缺口: 规格 20000 点, 点精灵带真景深模糊. 现为 Canvas2D 逐点透视投影, 上限 4000, 景深以放大加变淡近似.
- 为什么这轮补不了: Canvas2D 每帧画 20000 个带透明度的点保不住 60 帧; 点精灵与按深度的模糊半径要顶点通道. 需要点精灵或实例化通道.
