# video-shotcraft 逐演示记录

来源提交 `1266a3ec4831289c4d893d42dd5102723658039a`. 跟踪文件 1218.

已读: `demos/` 全部 226 个 tsx (50382 行), `references/` 136 篇 Markdown (8432 行, 含 124 张镜头卡). JSON 成片注释和 png 不当编舞规范.

30fps 下 1 帧约 33ms. 演示只依赖 remotion. 时间是 `useCurrentFrame`, 位移是 `interpolate` 或 `spring`.

## 跨演示规则

- 预备动作要过肉眼阈值. deck-deal 写明下压 4px 等于没做, 改成 48px 才通过.
- 群体间隔必须加速. 发牌第 k 张 `36+4k-0.0792*k*(k-1)`, 从 4 帧收到 0.2 帧.
- 落地分层停: 主体先锁, 阴影滞后 2 到 4 帧, 残影再拖.
- 开场一个主角, 弧线约 3 秒, 然后真静止. 禁止尾漂.
- 拇指滑动严格 8 帧 ease-out. 短于 5 帧是瞬移, 长于 14 帧是慢动作. 按下 scale 0.86 必须先于滑动.
- 控件浮入 spring damping 14 / stiffness 120. 图标弹出 damping 10 / stiffness 220.
- 慢速段不要运动模糊. 图表要让坐标轴出一次问题再重标.
- Micro 里的 SquishSwitch (stiffness 320/520, damping 40/34, mass 0.6) 说明控件弹簧比镜头弹簧更硬, 不能把 3 秒弧线用在按钮上.

## 镜头卡

- `references/shots/camera/basic-3d-scene.md` (42). impress.js 式空间演示:卡片以不同位置/旋转/缩放散布 3D 空间,相机取各步姿态之逆依次飞行对齐,末步拉到 OVERVIEW 总览. 时长: 约 7.5s(225f@30fps;四站,三段飞行 28/32/32f,每站停留 ≥30f)
- `references/shots/camera/crash-zoom-punch.md` (53). 全景一拍急推到目标特写(6f),落位二选一--过冲回弹(弹性)或撞停震屏(重量). 时长: 约 0.5s 动作 + 前后 hold(动作 6–11f,前 hold ≥30f 建立全景,后 hold ≥45f 读特写)
- `references/shots/camera/cursor-flyover.md` (40). 整页俯瞰后,相机依次飞到四个功能区 zoom-in 特写,SVG 光标先一步到位指点,点击留下涟漪并触发界面响应,最后拉回俯瞰. 时长: 约 8.0s(240f@30fps;俯瞰 22f - 四站各 44f(飞行 20f + 停留 24f)- 拉回 24f - hold 18f)
- `references/shots/camera/depth-layer-moves.md` (40). 分层深度运镜--多层视差滑轨:3 层速度梯度横移出纵深,滑轨落定时主角浮起. 时长: 4–5.5s 持续(demo 165f)
- `references/shots/camera/graze-face-tour.md` (58). 大倾角贴面游走特写--镜头贴着 UI 表面低飞掠过(侧栏树/顶栏/列表当地形),页面文字初始悬浮在界面上空带同形软影,随镜头行进先后加速贴落回界面. 时长: 单段 4–5s;可多段接力延长
- `references/shots/camera/overhead-camera-moves.md` (52). 俯拍揭示两式--tilt-reveal 俯仰抬正揭示,overhead-tabletop-drop 桌面卡阵横滑骤降扎入. 时长: A 120f(4s)/ B 140f(4.7s)
- `references/shots/camera/space-camera-moves.md` (47). 3D 空间化运镜两式--exploded-view 爆炸分解(构件沿 Z 炸开再合体),drone-dive-landing 无人机俯冲降落. 时长: A 170f(5.7s,炸开-悬停-合体-收尾标题全程);C 105f(3.5s,俯冲 69f + 落定 hold 36f)单向俯冲
- `references/shots/camera/steep-tilt-glide.md` (53). 固定镜头下直立页面以 60° 强透视侧立(右近左远),页面自身沿其 3D 横面方向滑移掠过镜头(物动镜不动),滑移带速度重影,文字组件悬空贴落,由暗揭亮. 时长: 4s(120f)单镜;页面越宽越可拉长
- `references/shots/camera/tension-camera-moves.md` (44). 情绪运镜两式--bullet-time 冻结环绕,pull-back 拉远孤立,相机替观众"感受"而非"看". 时长: 单式 5–6s(150–170f);全片合计 ≤2 式(各 ≤1 次)
- `references/shots/camera/terminal-3d.md` (43). 三个终端窗散布 3D 空间,相机窗间飞行,途中正弦拉远,每到一窗打字机敲命令,结果逐行滑出--命令执行的空间叙事流. 时长: 约 8.2s(246f@30fps;三站各约 2–3s 停留 + 两段 30f 飞行)
- `references/shots/data/before-after-slider-scrub.md` (49). 前后对比拉杆--"处理前/后"两版叠放,分割杆先猛甩后慢扫,杆过处新版"显影"揭出. 时长: 4–5s
- `references/shots/data/chart-live-moves.md` (53). 活体图表三式--oscilloscope-stream 示波流线(曲线右端实时写入+突发尖峰),unit-dot-swarm-regroup 点阵重组(点群三幕迁徙聚成数字),axis-rescale-shock 轴爆表重标(新值冲出画框逼 y 轴重标). 时长: 各 165–192f(5.5–6.4s)
- `references/shots/data/gauge-readout-moves.md` (46). 仪表读数两式--needle-sweep-selftest 满弧扫针(点火自检指针甩满全弧再回落真值)与 tape-scroll-fixed-pointer 滚带定针(针不动刻度带滚过+冲刺刹车). 时长: A 140f(4.7s)/ B 150f(5s)
- `references/shots/data/scroll-brake-moves.md` (47). 长卷急刹两式--changelog-scroll-brake 基本款(高速长卷指数减速精准停位+目标抬升)与 brake-reticle-lock 组合款(急刹帧同帧准星咬合). 时长: A 4–5s / B 5s
- `references/shots/data/timeline-travel.md` (45). 时间轴横移--镜头沿水平刻度轴加速掠过版本刻度,每过一格卡片弹立短停,末刻度急停推近. 时长: 4–5s
- `references/shots/effects/assemble-then-type-flyin.md` (64). 空的暗底网格上,无文字的组件骨架先从四面八方飞入贴合;随后各处文字逐字从 3D 空间旋转着飞来落位,先大标题后小标注,全部落位后页面成形. 时长: 约5.6s(168f@30fps)
- `references/shots/effects/aurora-bloom-bg-flip.md` (55). 浅灰底从底部升起紫橙柔焦 blob,随后整个底色在约 0.36s 内压暗到近黑,blob 压成余晖;文案同步 blur-out 换句 blur-in,换句间留空档不 cross-fade. 时长: 约5.2s(156f@30fps)
- `references/shots/effects/brand-frame-snap.md` (59). 品牌色画框语法--一圈粗纯色画框先于内容长出包住全屏,录屏窗口落进框内;模式切换时整圈画框同帧硬翻色+窗内布局同帧换,一个 borderColor 干完章节导航/状态提示/品牌露出三件事. 时长: 单次翻色 ~4.7s(140f);画框本身可全片驻场
- `references/shots/effects/fui-hud-moves.md` (36). FUI/HUD 准星咬合--reticle-lock-on 四个 L 形角标组成的取景框从画外飞入,超调回弹后咬合锁定目标. 时长: 2–3s(demo 90f)
- `references/shots/effects/glow-flyline-moves.md` (54). 暗场光斑与飞线三式--glow-orb-ambient 光斑底噪,flyline-arc 飞线连接,orb-flyline-relay 同帧共振组合. 时长: A 170f(~5.7s)/ B 140f(~4.7s)/ C 165f(5.5s)
- `references/shots/effects/icon-performance-moves.md` (43). 图标表演--attention-bounce 求关注弹跳(图标连跳递增+落地压扁+镜头被吸引). 时长: 156f(5.2s)
- `references/shots/effects/impact-feedback.md` (51). 命中反馈两式--hit-counter 连招计数(顿帧+伤害数字+combo 跳字),anime-impact 动漫打击帧(负片+集中线+色散). 时长: n/a(元素级技法,寄生在落位动作上;各式占用帧数见参数表)
- `references/shots/effects/light-play-moves.md` (47). 光效两式--spotlight-sweep 聚光扫字,sheen 单点扫光. 时长: A 170f ~5.7s / B 150f ~5s
- `references/shots/effects/radial-ripple-phone-chips.md` (57). 暖沙底四层同心圆错相呼吸如水波,中央手机 mockup 屏内 feed 自动缓滚,两侧白色 chip 先后 spring pop 入场并悬浮. 时长: 约5.6s(168f@30fps)
- `references/shots/effects/riso-print-hits.md` (50). 套印错位冲击帧--riso-misregistration-hit 单发:标题撞停瞬间裂成双色 riso 印版,抖两下"啪"地套准. 时长: 4s(120f,单发)
- `references/shots/effects/scan-bracket-sweep.md` (51). 文档弹到中央,四角落下 L 形取景括号,一条扫描光带拖着渐变尾迹在文档上往复扫 5 趟--文档全程静止,只有光在读它. 时长: 约5.0s(150f@30fps)
- `references/shots/effects/scanline-annotate-focus.md` (54). 一条扫描线自上而下匀速掠过已存在的页面,越过哪块区块的下缘,哪块就被四角取景框从外扩处弹簧收拢对准(一次过冲),随后贴出一枚逐字打出的机器标签,顶部状态行同步计数 00/06→06/06. 时长: 约5s(150f@30fps)
- `references/shots/effects/scanline-assemble-flyin.md` (54). 页面开场是一张只有网格与虚线槽位的蓝图画板,一条亮扫描线自上而下掠过;扫到每个槽位,该处组件就从画外飞入过冲贴合,带方向性残影模糊与落位咬合角标--扫完整页恰好装配完成. 时长: 约5.2s(156f@30fps)
- `references/shots/effects/slam-entrance-moves.md` (56). 高能砸入三式--kanada-perspective-snap 金田透视急停,score-slam 比分砸落,impact-burst-kit 落点冲击套件(波及邻卡). 时长: 单式动作段 6–22f + 冲击余波 ~16f + hold ≥45f(demo:A 120f / B 135f / C 140f)
- `references/shots/effects/spotlight-sweep-moves.md` (53). 暗场聚光显影三式--A 醒睡扫过(光到即亮光走即暗),B 贴边泛光横摇(紫光贴 UI 边缘渗入+聚光匀速右移),C 角落匀速显影(径向聚光从角落匀速扩张点亮全屏);黑场里"光即叙事"的 UI 展示. 时长: 单式 3.5–4.5s;A/B 可串联成巡礼段
- `references/shots/interaction/autolayout-gap-dial.md` (61). 间距拨盘驱动布局--一排链接块带框选描边+缝隙间距标注,徽章数字逐格跳动,块被参数实时推开再弹簧回弹归位;"参数驱动布局"的可视化. 时长: ~5s(150f:框选入场 + 预备回收 10f + 拉松 34f + 屏息 hold 20f + 弹簧回弹 + 落定 hold)
- `references/shots/interaction/canvas-materialize-moves.md` (58). 内容"物化上画布"两式--panel-to-canvas 行倒卡(面板表格行沿弧线飞出,跨容器变形成画布卡片)与 diagram-cascade 级联生成树(prompt 打字后节点逐层弹出,连线先于节点生长). 时长: A ~5s(150f)/ B ~6s(180f)
- `references/shots/interaction/chip-grid-single-select-blackout.md` (52). 五个选项 chip 以 3+2 居中排布逐个淡入;选中帧先插一帧灰色按压块,紧接数帧内底色变墨黑,文字变白并做 1→1.04→1 极轻回弹,其余 chip 淡到 18% 但位置锁死;随后余项归零,黑 chip 上移收窄,下方升起结算价格. 时长: 约5.5s(165f@30fps)
- `references/shots/interaction/collab-cursor-moves.md` (42). 协作光标当演员--cast-ensemble 五光标群演氛围层(错峰飞入+正弦漂移+打字 cameo+聚拢围观). 时长: A ~5.2s(156f)
- `references/shots/interaction/glass-pill-dictation-typing.md` (54). 一条定宽玻璃胶囊以约 1.25 倍略大弹出后缓落到位,内部自左淡到右浓铺一层强调色暖光;光标先行,随后匀速打出听写句,光(连同胶囊背后的环境光)随打字进度渐渐退去,收尾成一条中性的磨砂玻璃条. 时长: 约3.3s(100f@30fps)
- `references/shots/interaction/hashtag-to-pill-materialize.md` (61). 话题词打字实体化--居中打出 "#word"(红实心光标恒亮),1 帧硬切变成宽大胶囊标签,hold 后缩小左移落到页面标签位,再 1 帧硬切揭示成品页;"两次硬切一次滑动"的节奏骨架. 时长: 120f(4s)--打字 ~40f + 硬切胶囊 hold ~18f + 缩移 ~14f + 硬切揭示后静置 ~1.2s(原片 18–21.5s)
- `references/shots/interaction/picker-carousel-feature-cycle.md` (56). 移动端风竖向选择器--焦点药丸不动,内容穿过它,每项带明显 outQuint 减速吸附后完全静止,按到中心距离分层控制透明度/字号/灰度,落定时药丸做 scaleY 极轻呼吸. 时长: 约3.6s(108f@30fps)
- `references/shots/interaction/segmented-thumb-hero.md` (58). 分段控件 thumb 位移当主角特写--超大胶囊 segmented control 弹簧浮入,描边箭头光标画外滑入按下,白 thumb 8f ease-out 滑到另一段,到位瞬间新图标 spring 弹出,旧图标收起. 时长: ~3.5s(demo 110f:浮入 18f + 光标 24f + 点击 + 滑动 8f + 图标弹出 + hold)
- `references/shots/interaction/theme-switch-moves.md` (48). 主题切换两式--theme-sweep 斜向扫场(边界扫过处就地换肤)与 palette-ripple 组合款(⌘K 面板收缩成点,涟漪从点荡开换肤). 时长: A 140f(4.7s)/ B 156f(5.2s)
- `references/shots/interaction/type-and-filter.md` (38). 真实 UI 上打字搜索,网格自己收敛成一张卡,点击穿透进详情页. 时长: 约 2.5s(118–190f)
- `references/shots/interaction/voice-waveform-live.md` (55). 录音胶囊实时声纹--64 根细竖条随"说话"起伏,说话时中部高耸,停顿缩成点线,波形从右往左滚动;说→停→说→提交塌缩的完整表演. 时长: 172f(~5.7s:入场 14f + 说 1.4s + 停 0.8s + 说 1.4s + 提交塌缩 / 收进气泡 0.8s + hold 0.7s)
- `references/shots/opening/brand-ink-open.md` (37). 墨线十字准星描画→字标逐字压印→打字机副标→满一秒静止再上浮消散. 时长: 约 2.8s(83f)
- `references/shots/opening/crane-rise-reveal.md` (57). 升降臂拉升揭示--开场怼在一行数据特写,相机沿 Y 轴减速升起后拉,行行涌入直到整面 dashboard 铺满全幅. 时长: 5.5s(165f:特写 hold 24f + 拉升 102f + 落定/余波/静止 39f)
- `references/shots/opening/dataviz-landscape-open.md` (57). 暗场支流线束地景开场--多条流线汇入主干,虚构 ID 标签浮在线上,相机重景深低速飞越. 时长: 5–8s(开场氛围段,一支片 ≤1 次;demo 180f)
- `references/shots/opening/fracture.md` (41). 5×5 瓦片从 3D 碎片态按中心波纹逐圈聚合成整面海报,停一拍亮字,随后全部碎片背离中心加速旋转飞出画面. 时长: 约 5.2s(156f@30fps;聚合 0–2.6s - hold 1s - 飞散 1.5s)
- `references/shots/opening/icon-field-colorize.md` (61). 灰阶小图标点阵错峰浮现铺满全屏,停一拍后多道品牌色横带波纹极快向下扫翻全场--"功能全景先摆满,品牌一瞬间点亮"的开场/收束卡. 时长: 浮现 ~45f 错峰 + 静置 ~10f + 翻色 12–45f + 终态静置;全段 3–6s(demo 170f:翻色走 30f 档 + 标题落版 + 终态 hold 1s)
- `references/shots/opening/letterspace-materialize.md` (58). 大字距字标全字符并行连续描画结晶--所有字母同帧起笔,笔画像手写一样连续生长,同帧齐收成词;氛围底景上的品牌字标显影. 时长: 静置 ~15f + 描画 ~50f + 终态静置 ≥30f;全段 3–4s
- `references/shots/opening/magician-card-flourish.md` (74). 午夜蓝暗场上蓝色星芒闪现 0.3s(X 形针状光束旋转 90°+中心辉光放射小光芒),卡片从闪光点弹射而出--极速自旋弧线飞向镜头,自旋随靠近衰减,瞬间硬定格(卡高 86% 画高),光脉冲 + sheen 扫光,右侧文案随后逐行揭示. 时长: 156f(闪光 0.3s + 飞行 1.6s + 定格/扫光/文案揭示 + hold 3.3s;全段 5.2s)
- `references/shots/opening/orbit-ring-title-open.md` (88). 石墨暗场上八张 16:9 暗色内容卡按 45° 均布在 720×380 椭圆上匀速公转(卡身永不倾斜,纵深只由 sin θ 给出 ±12% 缩放,z 序与远处压暗失焦),环撑开期间卡内容冻结首帧,f24 之后八张一起开播;居中两级标题逐字解糊下沉落定,关键词到位那一刻荧光马克块自. 时长: 150f(5s@30fps;马克块 f64 落定后 2.9s 稳态巡回 + 极缓推近;开 HANDOFF_EXIT 时 f118 起退场交棒)
- `references/shots/opening/spotlight-hero-card.md` (56). 关灯的剧场里一束钨丝聚光(带体积光柱)扫过页面锁定一张卡,斜侧推进后卡片弹起悬浮,香槟色光束沿轮廓两圈,连同 3D 注记一起贴回原位. 时长: 172f(约 5.7s;锁定 f34 → 触地 f142 → 30f 真静止 hold)
- `references/shots/opening/stroke-segment-build.md` (51). 断笔成字--标题拆成十几段互不相连的笔画乱序逐段点亮,前 70% 不可读,末段落位瞬间语义"啪"地成立. 时长: 165f(5.5s;揭晓 f105 后 hold 2s)
- `references/shots/opening/text-as-mask.md` (60). 文字视频遮罩--瓷白舞台上切出超粗大标题字,字内部透出缓慢平移的暗色实时产品面板,结尾吸一口气后字形指数冲入放大 46 倍溢出,内部画面接管全屏. 时长: 165f(入场 18f + 字内漂移 78f + 吸气 8f + 冲入接管 24f + 落定/hold 37f)
- `references/shots/outro/grain-dissolve.md` (39). 整行字爆裂成沸腾颗粒噪点并浮现斜纹选区框,噪点云急速凝聚成更大号发光短字标,位移衰减归零定格. 时长: 约 2.0s(60f@30fps;砂化 0.26–0.56s - 凝聚 1.2–1.42s - 凝固回落收尾)
- `references/shots/outro/logo-shrink-wordmark-lockup.md` (39). 霓虹切口大环快速收束成中央实心小白 O,过冲刹车时换成 video-shotcraft 标志,图标左移让位,字标字母逐个滑入完成 lockup,强调色标语收尾. 时长: 约 4.4s(132f@30fps;收束 0.1–1.2s - 让位 1.5–2.1s - 字母 2–2.7s - 标语 3.2–3.7s)
- `references/shots/outro/neon-triple-marquee.md` (60). 三行对向霓虹跑马灯 recap--三连词空心霓虹灯管巨字上中下排满一面斜拍的砖墙,奇偶行反向匀速无限横滚,三行按 1/3 相位轮流点亮,结尾逐行断电. 时长: 4–5s(demo 150f:18f 逐行点火上电 + 循环体 + 18f 逐行断电 + 8f 熄灯 hold)
- `references/shots/outro/outro-group-photo-launch.md` (40). 全片元素从四面八方飞来围住字标合影,crane 落机位+舞台光+金尘做成发布会收场. 时长: 约 4.8s(145f)
- `references/shots/outro/ui-strip-away-outro.md` (62). 减法式收尾--点击 Publish 后整个编辑器 UI 从外围到中心层层错峰蒸发,黑场上只剩那颗按钮滑到屏心放大,按钮再淡出交棒字标定版. 时长: ~4.8s(144f:光标就位 34f → 蒸发 ~40f → 按钮独占 → 字标接棒 → 字标 hold ≥1s)
- `references/shots/outro/ui-to-brand-morph.md` (53). UI 变品牌两式--icon-flip-bloom 图标 Y 轴翻扁成竖线,从竖线撑开成品牌标志(琥珀斜切随后划入)+ wordmark 逐字落定,与 input-morph-assemble 输入框收缩成取景框竖笔,三块图元落进构造槽位拼成完整标志. 时长: A ~4.3s(130f)/ B ~5.6s(168f)
- `references/shots/rhythm/beat-cut-moves.md` (51). 硬切当节拍乐器--连闪定格:三次白闪各硬切同一画面的一个裁切(全景→卡片→特写),快门余韵沉降后停在特写收束. 时长: 全程 140f ≈4.7s(活素材 30f + 三闪 + hold 70f)
- `references/shots/rhythm/beat-step-list-theme-cycle.md` (67). 三通道节拍器--深色场形容词列表逐拍上移一行,视口中央固定胶囊"接住"下一个词并换色,整场底色同拍跟换;行,色,场三通道锁死同一拍点. 时长: 铺垫 30f + 每拍 18f × 拍数 + 收尾 hold;4 拍约 4.7s(demo 140f)
- `references/shots/rhythm/panel-grid-moves.md` (44). 分格节奏--comic-panel-split 漫画斜格劈出同一主体的三个机位,咔咔咔三格定格后末格斜边吃屏成海报. 时长: 156f ≈5.2s(全屏侧拍 20f + 三刀分格定格 + 吃屏 + 海报 hold)
- `references/shots/rhythm/quad-split-parallel-scenes.md` (39). 画面硬切 2×2 四宫格,四个象限并行跑各自的微场景(打字,急推,逐词,交互链),关键节拍错开 3–6 帧制造信息轰炸. 时长: 90f(3s@30fps:0–62f 并行轰炸 + 28f 终态 hold,全程无转场)
- `references/shots/rhythm/rhythm-interrupt-moves.md` (39). 打断节奏--jump-cut-punch-in 三级跳切推近:同构图三次无补间硬跳放大,逐级逼近目标. 时长: A 135f ≈4.5s
- `references/shots/rhythm/sakuga-timing-shift.md` (57). 一拍三转一拍一--元素先以每 3 帧一步的手翻书顿挫移动,高潮瞬间切成逐帧丝滑冲刺,帧率量化的突变本身就是看点. 时长: 150f(5s)
- `references/shots/rhythm/speed-ramp-freeze.md` (45). 帧号非线性 remap 的节奏手法--定格标注(流动→定格圈注→解冻). 时长: 定格标注全程 158f(≈5.3s,定格段 67f ≥45f)
- `references/shots/rhythm/trailer-grammar-moves.md` (39). 预告片语法一式--trailer-bumper 前置速剪钩子:三镜 9f 速剪 + 黑场静默一拍,再开场标题. 时长: A ~4.7s(140f)
- `references/shots/transition/bottom-push-stack-wipe.md` (64). 底边上推换章--新场景连底色整屏从底边向上推入,把旧场景物理顶出画外,连推数章各配一种饱和底色,内容钉死在各自色底坐标系里随底色走. 时长: demo 三连推 170f(~5.7s);单次推入 26f + 章内 hold ~1.2s
- `references/shots/transition/card-flip-reveal.md` (58). 功能卡 3D 翻面揭示--卡片沿 Y 轴翻 180°,正面 UI 翻到侧棱最薄处掠过一道随角度移动的受光,背面揭出大号结论数字,逐张错峰扫过整排. 时长: 全程 150f(~5s,含 hold);单卡 4f 预备 + 16f 翻 + ~10f 弹簧落定,三卡错峰 12f
- `references/shots/transition/card-flock-tumble.md` (64). 三张 UI 页卡从侧棱薄边 3D 翻飞成阶梯站定(全程清晰,样条连续丝滑),站定后保持慢转不停,快速收束吸入中心,炸出单个湍流烟雾环扩散,巨字横贯收场. 时长: 翻飞 ~1.5s + 慢转展示 ~0.3s + 收束 0.3s + 烟环+巨字 ~2s;全段 4.5s
- `references/shots/transition/circle-match-iris.md` (59). 圆心匹配光圈切--光圈从页面上圆形元素的圆心炸开,圈内新页的圆形图表接在同一个圆上;匹配剪辑给光圈一个语义锚点. 时长: 5.5s / 165f(入场+定睛 40f + 蓄力 7f + 接圆开圈 37f + sweep 58f + 静止 47f)
- `references/shots/transition/gradient-transition.md` (46). 背景在 linear,radial,conic 三类 CSS 渐变间平滑过渡--角度,色标,中心,半径逐参数插值,段间交叉淡化换类型. 时长: 约 6.7s(200f@30fps;linear 0–2.3s - radial 1.9–4.4s - conic 3.9–6.7s)
- `references/shots/transition/line-carry-transition.md` (56). 线条接力横移转场--场景 A 的进度条延伸出画,镜头跟线横移,线在移动中拐角围出场景 B 的卡框,全程无剪切. 时长: ~6.3s / 190f(进度条走满 36f + 冲出 10f + 横移 56f + 收框 24f + 框内海报 30f + 静止 24f)
- `references/shots/transition/mosaic-reframe.md` (50). 12 张瓦片在规则网格,feature mosaic,对角瀑布串三种排版间连续变形,位置宽高各自插值,逐片微错峰,段间留 hold. 时长: 约 7.1s(214f@30fps;浮现 0–22f - hold A - A→B 56–92f - hold B - B→C 132–176f - hold C 至 214f)
- `references/shots/transition/page-turn-transitions.md` (43). 整页体块转场--barn-door-split 对开门裂幕(旧页裂两半滑出,新页迎上). 时长: 单式 150f(前态建立 30–40f + 转场 24–40f + 跟随与收尾 ≥70f),约 5.0s
- `references/shots/transition/print-texture-transitions.md` (43). 印刷质感转场--ink-bleed-reveal 墨渗揭示(须状渗边洇开吃掉旧景). 时长: 4–4.5s(洇开段 55–80f + 静止收尾 ≥30f)
- `references/shots/transition/shot-transitions.md` (46). 镜头交棒三式--推进流白,whip-pan 甩镜(急刹款),mask-wipe 穿窗(纵深款),按能量落差与接缝语义选型. 时长: n/a(技法卡;各式占用帧数见参数表,从相邻镜头预算里划)
- `references/shots/transition/tear-streak-transitions.md` (49). 撕裂转场--glitch-displace 噪声撕裂(16 横条错位抖动中硬切),数字故障语义的条带级撕裂. 时长: 前态 ≥40f + 撕裂 16–24f + 收尾 ≥40f,约 4.5s(135f)
- `references/shots/transition/transition-hidden-cut.md` (56). 藏切点转场三式--前景遮挡隐形切,对撞开屏,暖色漏光,硬切藏进遮挡/撞击/光峰的 1-3 帧里,观众看不见剪刀. 时长: n/a(技法卡;各式占用帧数见参数表,从相邻镜头预算里划)
- `references/shots/transition/transition-travel.md` (44). 穿越式转场--字腔穿越:巨型章节标题的字形就是一扇窗,镜头钻进字形笔画完成换景. 时长: n/a(技法卡;demo 150f,主推动作段 52f,前后 hold 另计,帧数从相邻镜头预算里划)
- `references/shots/transition/white-flash-logo-simplify-cut.md` (42). 液态金属质感的彩色词标静置流光,蓄力后从字心炸出一记白闪过曝,曝光回落时同一位置已是扁平版字标--一次闪白完成质感降维. 时长: 约 4s(120f@30fps;演出 0–34f - 蓄力 34–46f - 冲白 44–54f - 曝光回落 54–76f - 锁定 72–96f - hold 至 120f)
- `references/shots/transition/wipe-transitions.md` (43). 几何擦除转场--blinds-slice 百叶窗切条(12 根 3D 叶片错峰翻面成波,波扫过后整页由 A 换成 B). 时长: 前态 ≥20f + 擦除 ~56f + 收尾 ≥40f,约 4.4s(132f)
- `references/shots/typography/blur-slide.md` (60). 标题逐词入场,y 0.38em→0 + blur 18→0 + opacity 0→1 三通道走同一条 ease-out 同步收敛,词间隔约 4f;副标题在标题收完前就错峰跟进. 时长: 约 4.0s(120f@30fps)
- `references/shots/typography/brace-expand.md` (56). 一对紧贴的小花括号先在正中出现,随即带一次过冲向左右弹开并放大到标题级,文字 clip 宽度严格绑括号内缘,像被拉开幕布般从中间揭示,落定后字距再细微松弛. 时长: 约 4s(120f@30fps:光标 0–6f → 6f 小括号硬切 → 14f 弹开 → 40–64f 字距松弛 → 副标 → hold)
- `references/shots/typography/countdown-arc-scatter.md` (66). 纸面表盘 9 个等大数字沿大弧切向排布,整盘扫过 96° 后减速急停,"5" 停在弧顶随即平移落位成标题首字符,其余数字带 blur 原地散去,标题逐词模糊淡入,末词转强调色. 时长: 约 3.3s(100f@30fps:扫动 ~30f + 落位 20f + 标题成句 + hold 22f;最短可压到 33f 单拍)
- `references/shots/typography/document-typewriter-reveal.md` (43). 悬浮在暗场里的整页真排版文档窗口在光标后自己"写"出来,侧栏跟进,历史条目逐个落入轨道,相机从斜侧标题特写一路后撤到全窗. 时长: 150f(约 5s,含 history-list-stack 尾段与标语 hold)
- `references/shots/typography/flying-words.md` (65). 22 个关键词按黄金角铺在扁椭圆截面上,沿 z 轴从远处飞到相机前擦身而过,透明度走 [0,1,0.5,0.2,0] 生命曲线,跑满 2 整圈首尾无缝. 时长: 约 6.0s(180f@30fps,2 个完整循环,可无缝接续)
- `references/shots/typography/glitch-cycle.md` (65). 同一行等宽槽位循环轮播 4 条状态短语,每条头尾按概率关键帧 [1,0,0,0.1,0,0,1] 全乱码,中段偶发单字抖动,切换瞬间叠 RGB 分离与整行位移;末条概率收 0 保证收尾干净. 时长: 约 5.6s(168f@30fps;demo 每条短语 38f,末条延续到片尾作收尾 hold)
- `references/shots/typography/gradient-word-sweep.md` (55). 黑底标语里关键词被渐变彩光从左到右快速扫过"充能"--波前字符辉光最强向后衰减,填满后字符间勾连细紫红闪电,整词稳态泛光呼吸. 时长: 扫充 ~15–20f(要快)+ 稳态闪电呼吸 1–2s;全段 2.5–3.5s
- `references/shots/typography/lead-word-zoom-assemble.md` (92). 首词以 2.3 倍字号占据画面中央,hold 期间继续推近 6%,随后一条曲线同时完成"缩回终字号"与"整行左滑归位",后续词各自从槽位右侧 0.5em 被推进来;支点横向钉首词中心,纵向钉基线(挂载时实测),整行上移的同一时窗副行浮出,停一拍后整幕 crash-zoom 推近失. 时长: 约 2.8s(84f@30fps;组句 f36 完成,上移与副行 f32–46,静止 26f,末 12f crash)
- `references/shots/typography/marker-underline-title.md` (52). 大标题落定后,关键词下方马克笔下划线从左到右快速描画--变宽笔形,毛糙边缘,微上斜跟随斜体字势,贴着字底. 时长: 标题落定 +4~8f 后起笔,划线 8–12f,总 1–1.5s
- `references/shots/typography/outline-word-fill.md` (67). 空心词(细暖灰描边,500 字重)从 3.2 倍急缓收缩落位,虚线大圆随后从 2.8 倍收到字周围并缓慢自转,左右水平虚线从画框边缘内伸;描边先微微增亮,实心白热字在一帧内硬切点亮,一闪辉光即定格. 时长: 约 3.0s(90f@30fps,短促单拍 + 36f 落定)
- `references/shots/typography/paper-title-card.md` (39). 一句话逐词压印上纸,一个词标强调色斜体,短划线收束. 时长: 1.7–1.8s(50–55f)
- `references/shots/typography/pill-chip-slot-cycle-handled.md` (67). 白底句式 "Your `chip` Handled" 里深色胶囊内词竖向滚轮轮换,胶囊宽度按预量文本宽插值平滑伸缩,两侧文字被自然挤开收拢,胶囊上下露出 13% 透明度的灰色幽灵项. 时长: 约 5.0s(150f@30fps:静置 → 3 次切换(0.25/0.47/0.69)→ 尾部静置)
- `references/shots/typography/pill-slot-cycle.md` (59). 句中词槽轮换--固定句干钉死不动,句尾 pill 徽章每 ~0.7s 老虎机滚一格(旧的上飞加速淡出,新的从下带模糊滑入),连换 N 个功能词后落成完整句子收束. 时长: 入场 12f + 每拍 21f × 词数 + 收束 14f + hold;6 词约 6.7s(demo 200f,含 48f 完整句 hold)
- `references/shots/typography/text-column-converge.md` (62). 双词对峙合拢--左"NEW"右特性词钉死在等屏边距两侧硬切轮换,全程零收缩,换到最后一词才唯一一次 ease-in-out 滑到居中咬合成短语,下方小字近乎硬切浮现;收尾揭晓型文字卡. 时长: 轮换 7–16f/词 × 8–9 词 + 合拢 ~36f + 小字后静置;全段约 5–6s
- `references/shots/typography/title-demote-to-label.md` (65). 大标题降格为节标签两式--A 大标题居中显影站稳一拍后连续缩小 0.3x 平移到左上角落成小节标签,内容区在其下生长;B 同套路但登场时带文本选中态高亮块扫入再撤掉. 时长: A ~3.7s(112f)/ B ~4.5s(134f);demo 两式串播 246f
- `references/shots/typography/type-assembly-moves.md` (46). 文字集结三式--split-text-stagger 逐字裂升,letterform-drift-assembly 漂移合拢,text-on-path 沿线流入. 时长: 单式 4–5.5s(动作段 A ~56f / B ~104f / C ~110f;demo 全长含 hold:A 130f / B 150f / C 160f,各自导出 `*_DURATION
- `references/shots/typography/type-entrance-moves.md` (42). 标题文字入场一式--letter-drop-physics 字符坠落(重力砸落,弹跳,歪斜站定,最后一拍集体立正归位). 时长: 单式 5s(含 hold 与静止收尾;动作段 ~116f,demo 150f)
- `references/shots/typography/type-rhythm-sync.md` (52). 文字随声同步两式--font-weight-pump 字重脉冲(笔画随鼓点变粗弹回)与 karaoke-fill-sync 卡拉OK填色(词随旁白逐个点亮). 时长: A FontWeightPump 165f / B KaraokeFillSync 150f;A 128 BPM 每拍 14f,衰减窗 9–13f,B 每词按语速 18–33f
- `references/shots/typography/typewriter-moves.md` (43). 打字机 error-retype--误删重打的"改口"三幕剧:打出平庸词 → 犹豫 → 退格删掉 → 更快打出卖点词. 时长: ~5.3s(160f)
- `references/shots/typography/vertical-word-roll-blur-cycle.md` (64). 句尾词换成竖向滚轮,3 次换词各 0.55s(outQuint 七成 + outBack 三成,前快后极慢带微过冲),相邻行按距离上垂直 blur 与灰度,中心词落定瞬间从灰染成强调色. 时长: 约 5.0s(150f@30fps:静置 → 3 次换词 → 尾部整组淡出)
- `references/shots/typography/word-relay-filmstrip.md` (58). 左列黑白相间等高页面卡步进滚动(焦点卡全亮,邻卡离焦压暗),右侧衬线大词原位接力(名词恒定+动词轮换)--切词瞬间才滚动一格,词块垂直中心与当前页面卡中点精确对齐. 时长: 每词期 ~1.5–2s × 3–4 词;demo 180f(6s)
- `references/shots/typography/word-relay-geometry.md` (76). 三个利益词各带一套专属几何接力--虚线大圆减速自转 + 彗星弧飞跑 → 三实线圆 trim 依次生长后收拢咬紧 → 镀铬金属 sheen 扫过后一拍收成纯白;旧词缩到 0.86 淡出,新词描边→填充揭示. 时长: 约 6.0s(180f@30fps:三段各 ≈60f,段间重叠 6f)
- `references/shots/ui-entrance/avatar-bracket-carousel.md` (60). "Your ___ agent" 填空排版,四角对焦框钉在句中不动,头像队列在框内垂直 spring 轮换三次,入框放大清晰,出框按距离缩小淡化模糊,角色标签同步更换,切换瞬间对焦框呼吸 7%. 时长: 约 5.2s(156f@30fps)
- `references/shots/ui-entrance/bezier-source-converge-merge.md` (68). 左侧四个来源节点各有一条细贝塞尔曲线连向右侧同一汇聚点,曲线先错峰由左向右 draw-on,节点沿自己的曲线滑向汇聚点并三段式加速缩小到消失,强调色数据包全程沿路径滑行,吞并完成后曲线从左端反向擦除只留品牌标志(demo:白瓷圆片托 video-shotcraft 镜刻标志). 时长: 约 5.6s(168f@30fps)
- `references/shots/ui-entrance/card-stack.md` (61). 一组模板卡(demo 9 张)从屏幕下方逐张 spring 弹入,越落越快叠成一摞,全员落位后整摞一次性展成扇面--每张按序号偏转 6.5°,横移 138px,最后中心卡被抽出. 时长: 约 5.0s(150f@30fps)
- `references/shots/ui-entrance/carousel-3d.md` (67). 8 张卡排成圆环整环自转一圈(匀速底 + 每 45° 一次停靠的分步),每卡只绕 Y 公转,自身 billboard 朝外,正反两层同向贴图配 backface-visibility:hidden 保证任何时刻都正立不倒置,正前方卡被点亮,环下字幕随之换字,相机全程钉在浅俯角. 时长: 约 5.6s(168f@30fps)
- `references/shots/ui-entrance/cloner-depth-echo.md` (41). 克隆纵队--主卡瞬间"复印"出 7 个半透明分身沿斜向纵深排开成队,停一拍后全体加速吸回本体合一+弹跳. 时长: 138f(约 4.6s)
- `references/shots/ui-entrance/deck-deal-flyin.md` (46). 暗色石墨桌面上的实体牌堆特写环绕开局,灯从牌堆亮到旁边的页面板,一摞卡像发牌一样硬加速甩进网格,相机追着发牌升起后仰,落在整块满板的跑道式俯瞰上定格. 时长: 150f(约 5s:0–36 牌堆特写 + 预备,36–~101 发牌,108–150 满板 hold)
- `references/shots/ui-entrance/doc-park-left-pill-deal.md` (63). 文档不淡出而是向左滑出只露约 35% 宽并微缩到 0.92,右侧按旁白节奏慢速发牌三张白底描边药丸(outBack 弹入),每张落定后其下方字幕逐词加深,下一张到来前整句淡出,左侧文档全程极缓慢自动滚动保持"正在被读". 时长: 约 5.8s(174f@30fps)
- `references/shots/ui-entrance/draw-svg-trace.md` (56). 描边生长圈注--一条带笔头的墨线沿元素轮廓跑一圈把它"画"出来,闭合瞬间闪黑交棒,内容淡入;同套路可给标题画下划线. 时长: 132f(预告 10f + 描边 40f + 闪黑交棒 16f + 下划线 18f + hold 40f,约 4.4s)
- `references/shots/ui-entrance/element-body-moves.md` (38). 元素身体感--contact-shadow-lift 接触阴影离面抬升:卡抬起时桌上的阴影同步放大变淡,纸片离桌被阴影证明. 时长: A 150f 5s
- `references/shots/ui-entrance/integration-hub-map.md` (56). 旧页面一次性快翻 180°(侧棱瞬间亮闪)落成新中枢页,五个集成 app 图标同帧弹现,随即五条彩虹光管同帧齐连,光管内输送脉冲持续流动--"翻开新一页,生态一齐接入". 时长: 前摇 ~0.5s + 快翻 ~1.2s + 图标齐现 → 光管齐连两拍 ~0.7s + 输送呼吸 ≥1.5s;全段 4.5–5s
- `references/shots/ui-entrance/list-reveal.md` (51). 垂直菜单 6 项按 10f 的间隔依次 scale 找位,软 back 轻微过冲落定,同时整个列表容器全程匀速上移--逐项入场与整体漂移是两层不相干的运动. 时长: 约 4s(120f@30fps)
- `references/shots/ui-entrance/list-stack-press.md` (44). 列表卡从画面底部逐张飞上摞起,每张落地压弹整摞,计数器同步跳一格. 时长: 约 3s(18–88f)
- `references/shots/ui-entrance/neon-frame-forerun.md` (56). 强透视直角霓虹框自左缘两头奔画先行成型,页面在框内由暗转亮,同时框内组件/文字从 3D 上空带同形软影错峰贴落,随页面点亮同步完成贴合,背景霓虹群(demo 为同形框纵深回声隧道)终段熄灭让位. 时长: 框奔画 ~0.7s + 点亮&贴落 ~2.7s + 背景熄灭收束 ~1s;全段 4–4.7s(demo 140f)
- `references/shots/ui-entrance/neon-frame-orbit-drop.md` (52). 霓虹框先行描框后,镜头绕页面左→右弧线旋转,页面全部组件/文字**同帧**从空中往下贴合(同形软影同步收敛)--整体登场式的框内安放. 时长: 描框 ~0.5s + 旋转&同时贴落 ~2.5s + 落定 ~1s;全段 ~4.7s(140f,旋转到 128f 收住后留落定)
- `references/shots/ui-entrance/page-waterfall-wall.md` (52). 页面瀑布墙--真实页面截图切成 3–4 列在 3D 后仰墙面上差速反向无限滚动,视差 + 镜头缓推做"内容多到流不完"的一览. 时长: 4–6s(无限循环体,时长由段落需要裁)
- `references/shots/ui-entrance/product-card-progressive-assemble.md` (57). 详情卡像被逐字段抓取般自建--一枚"填充光标"领先跳格,图→标题→分类 pill 依次 pop→原价出现后被划线降级,强调色新价 spring 跳出→正文逐行揭示且高亮块由左向右刷过→色卡点亮→按钮填满,整卡全程极慢 scale 前推. 时长: 约 5.7s(172f@30fps)
- `references/shots/ui-entrance/radial-wave.md` (50). 17×9 圆点阵列按到波源的欧氏距离错峰点亮,每点 scale 过冲到 1.5 再落回常亮,第一道波扫完后第二道亮蓝脉冲从外圈反向收拢回中心. 时长: 约 3.8s(114f@30fps)
- `references/shots/ui-entrance/research-card-stack-scroll.md` (58). 深色论文卡每 12 帧一张沿右下轴线飞入中心叠压,落位带 1 帧压缩,只有最上一张全清晰渲染标题+作者+摘要,下方卡按堆积深度递增模糊变暗只露标题条,背景横向 grid 同步下移做速度参照. 时长: 约 4.8s(144f@30fps)
- `references/shots/ui-entrance/row-embed.md` (37). 内容行像卡片一样从空中降下,rotateX 收平,嵌入瞬间底边亮一道强调色的缝. 时长: 约 2s(12–68f)
- `references/shots/ui-entrance/value-stagger-gradient.md` (65). 16 根柱入场时 delay 是时间错峰,同时高度/色相/位移/模糊四个属性各自铺成从首到末的数值梯度;第二拍把错峰原点换成中心,脉冲幅度以中心为最大重新铺开. 时长: 约 5.0s(150f@30fps)
- `references/shots/ui-entrance/wall-reveal-moves.md` (48). 整墙批量入场两式--bento 逐格点亮,蓝图描线成形,全部原位显形不位移,与 deck-deal-flyin 的飞入位移型互补成品类矩阵. 时长: 单式约 5s(A 150f / B 150f @30fps,含建立 hold 与静止收尾)

## 226 个演示

### demos/_fixtures/Brand.tsx
镜头卡 `Brand.tsx`, 113 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_fixtures/Fixtures.tsx
镜头卡 `Fixtures.tsx`, 648 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_fixtures/Look.tsx
镜头卡 `Look.tsx`, 317 行. Sequence from: none. durationInFrames: none.
spring: frame: frame - start, fps: 30, config: { damping: opts.damping ?? 18, stiffness: opts.stiffness ?? 1. Easing: none. interpolate: none.
### demos/_fixtures/Motion.tsx
镜头卡 `Motion.tsx`, 83 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_fixtures/PageCam2D.tsx
镜头卡 `PageCam2D.tsx`, 116 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.33, 0, 0.15, 1). interpolate: [a.frame, b.frame]->[0, 1].
### demos/_fixtures/Polish.tsx
镜头卡 `Polish.tsx`, 244 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/_fixtures/Fixtures.tsx
镜头卡 `_fixtures`, 84 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/_fixtures/Motion.tsx
镜头卡 `_fixtures`, 83 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/camera/depth-layer-moves/DollyZoomReal.tsx
镜头卡 `camera`, 56 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.4, 0, 0.3, 1). interpolate: [15, 110]->[0, 1].
### demos/_legacy/camera/tension-camera-moves/DutchRollToLevel.tsx
镜头卡 `camera`, 111 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.inOut(Easing.quad), Easing.out(Easing.cubic). interpolate: [ROLL, ROLL + 6]->[1, 0]; [ROLL, ROLL + 14]->[-10, 1.2].
### demos/_legacy/camera/tension-camera-moves/SlowPushIn.tsx
镜头卡 `camera`, 97 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.quad), Easing.in(quad). interpolate: [0, CUT]->[1.0, 1.14]; [0, CUT]->[0, 0.5].
### demos/_legacy/data/avatar-grid-radial-build-colorize/AvatarGridRadialBuildColorize.tsx
镜头卡 `data`, 209 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/data/counter-confetti/CounterConfetti.tsx
镜头卡 `data`, 152 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/data/cycle-glass-node-morph/CycleGlassNodeMorph.tsx
镜头卡 `data`, 355 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [0, 1]->[-40, 140]; [0, 1]->[332, 154].
### demos/_legacy/data/hatch-depth/HatchDepth.tsx
镜头卡 `data`, 137 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/data/odometer-digit-roll/OdometerDigitRoll.tsx
镜头卡 `data`, 179 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.quad), Easing.out(Easing.cubic), Easing.out(Easing.quad), Easing.out(cubic). interpolate: [s, s + 16]->[p0, T + 0.5]; [s + 16, s + 22]->[T + 0.5, T].
### demos/_legacy/data/particle-celebrate-hits/ConfettiCrossfire.tsx
镜头卡 `data`, 116 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.back(1.8). interpolate: [0, 14]->[0.6, 1]; [0, 8]->[0, 1].
### demos/_legacy/data/particle-celebrate-hits/CounterTickSparks.tsx
镜头卡 `data`, 104 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.quad). interpolate: [COUNT_END, COUNT_END + 5, COUNT_END + 16]->[0, 1, 0].
### demos/_legacy/data/particle-sand-fill/ParticleSandFill.tsx
镜头卡 `data`, 120 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.back(2.2). interpolate: [doneAt, doneAt + 10]->[0, 1]; [doneAt + 6, doneAt + 18]->[0, 1].
### demos/_legacy/data/ring-diagram-annotation-reveal/RingDiagramAnnotationReveal.tsx
镜头卡 `data`, 240 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.16, 1, 0.3, 1). interpolate: [start, Math.max(start + 1, end)]->[0, 1]; [start - 1, start, start + 2, start + 8]->[0, 0.32, 0.32, 0].
### demos/_legacy/effects/dashboard-glow-highlight-pill/DashboardGlowHighlightPill.tsx
镜头卡 `effects`, 404 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/effects/fui-hud-moves/LineUnfoldPanel.tsx
镜头卡 `effects`, 126 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.cubic), Easing.in(Easing.poly(4), Easing.in(Easing.quad), Easing.out(Easing.cubic). interpolate: [T0, LINE_END]->[0.004, 1]; [LINE_END, UNFOLD_END]->[3 / PANEL_H, 1].
### demos/_legacy/effects/icon-performance-moves/PopBurstConfirm.tsx
镜头卡 `effects`, 163 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.quad), Easing.out(Easing.back(2), Easing.out(Easing.back(2.6), Easing.out(Easing.cubic). interpolate: [20, 23]->[1, 0.6]; [POP, 33]->[0.6, 1.35].
### demos/_legacy/effects/light-play-moves/HalationBloom.tsx
镜头卡 `effects`, 140 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.quad), Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [ZOOM_START, IMPACT]->[2.4, 0.94]; [IMPACT, REBOUND_END]->[0.94, 1].
### demos/_legacy/effects/line-boil/LineBoil.tsx
镜头卡 `effects`, 143 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [35, 40, 100, 105]->[0, 1, 1, 0].
### demos/_legacy/effects/riso-print-hits/RisoBeatPump.tsx
镜头卡 `effects`, 156 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/interaction/ai-stream-response/StreamResponse.tsx
镜头卡 `interaction`, 148 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.2, 0.75, 0.25, 1). interpolate: [0, 0.45, 0.75]->[0.36, 1, 0]; [0.62, 1]->[0, 1].
### demos/_legacy/interaction/chip-lift-to-user-pill/ChipLiftToUserPill.tsx
镜头卡 `interaction`, 293 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/interaction/collab-cursor-moves/CursorDialogueDuet.tsx
镜头卡 `interaction`, 146 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [0, 1]->[dx, -320]; [0, 1]->[dy, 1240].
### demos/_legacy/interaction/command-palette-summon/CommandPaletteSummon.tsx
镜头卡 `interaction`, 174 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.out(Easing.cubic). interpolate: [inStart, inStart + 8]->[0, 1]; [inStart, inStart + 8]->[12, 0].
### demos/_legacy/interaction/input-trigger-moves/CursorPerformancePunchIn.tsx
镜头卡 `interaction`, 155 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.inOut(Easing.quad), Easing.out(Easing.cubic). interpolate: [0, 24]->[0, 1.05]; [24, T.cursorInEnd]->[1.05, 1].
### demos/_legacy/interaction/input-trigger-moves/KeycapSmashCut.tsx
镜头卡 `interaction`, 218 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.quad), Easing.out(Easing.cubic). interpolate: [s, e]->[0, 1]; [T.press, T.pressEnd]->[0, 14].
### demos/_legacy/outro/edit-hook-moves/LogoStingButton.tsx
镜头卡 `outro`, 107 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.cubic), Easing.out(Easing.cubic). interpolate: [T.darkenStart, T.shotAEnd - 1]->[0, 1]; [T.blackEnd, T.logoInEnd]->[0, 1].
### demos/_legacy/rhythm/beat-cut-moves/BeatCutAccelerando.tsx
镜头卡 `rhythm`, 78 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.cubic). interpolate: [FINAL, FINAL + 20]->[1, 1.06].
### demos/_legacy/rhythm/montage-rhythm-moves/DominoCascade.tsx
镜头卡 `rhythm`, 126 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.cubic), Easing.inOut(Easing.quad), Easing.out(Easing.cubic), Easing.out(cubic). interpolate: [TITLE_START, IMPACT_1]->[-260, 240]; [IMPACT_2 - 9, IMPACT_2, SIDE_END]->[0, -3, 0].
### demos/_legacy/rhythm/montage-rhythm-moves/DropBlackoutSlam.tsx
镜头卡 `rhythm`, 136 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.cubic). interpolate: [0, 1, 5]->[0.25, 1, 0.25]; [0, 1, 5]->[1, 1.5, 1].
### demos/_legacy/rhythm/montage-rhythm-moves/WrightTripleCut.tsx
镜头卡 `rhythm`, 176 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.out(Easing.cubic), Easing.out(Easing.poly(5). interpolate: [4, 7]->[0, 1]; [4, 7]->[0, 1].
### demos/_legacy/rhythm/panel-grid-moves/FlipGridReflow.tsx
镜头卡 `rhythm`, 122 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.out(Easing.cubic). interpolate: [t0, t0 + MOVE]->[x0, x1]; [t0, t0 + MOVE]->[y0, y1].
### demos/_legacy/rhythm/panel-grid-moves/GridFlashMosaic.tsx
镜头卡 `rhythm`, 183 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.cubic), Easing.in(cubic). interpolate: [HOLD_END, ZOOM_END]->[1, ZOOM_SCALE]; [start, start + 3]->[1.18, 1].
### demos/_legacy/rhythm/rhythm-interrupt-moves/StrobeBlackFrames.tsx
镜头卡 `rhythm`, 100 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in, Easing.in(Easing.quad), Easing.in(quad). interpolate: [0, 80]->[1.0, 1.05].
### demos/_legacy/rhythm/smear-multiples/SmearMultiples.tsx
镜头卡 `rhythm`, 89 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [25, 37]->[X0, X1 + OVER]; [37, 43]->[X1 + OVER, X1].
### demos/_legacy/rhythm/spectrum-morph-ui/SpectrumMorphUi.tsx
镜头卡 `rhythm`, 130 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.cubic). interpolate: [0, 10]->[0, 1]; [SPLIT, SPLIT + SPLIT_DUR]->[0, 1].
### demos/_legacy/rhythm/speed-ramp-freeze/SpeedRampReal.tsx
镜头卡 `rhythm`, 59 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [0, 40, 85, 135]->[0, 88, 97, 207].
### demos/_legacy/rhythm/trailer-grammar-moves/CardFootageCadence.tsx
镜头卡 `rhythm`, 119 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.cubic). interpolate: [0, 5]->[1.05, 1]; [0, 14]->[1, 1.08].
### demos/_legacy/rhythm/trailer-grammar-moves/SmashCut.tsx
镜头卡 `rhythm`, 106 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.quad). interpolate: [s, e]->[0, 1]; [0, CUT]->[1, 1.55].
### demos/_legacy/transition/bubble-swarm-takeover/BubbleSwarmTakeover.tsx
镜头卡 `transition`, 190 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.quad), Easing.inOut(Easing.quad), Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [spec.t0, PEAK]->[0, 1]; [PEAK + 2, 118]->[0, 1].
### demos/_legacy/transition/color-block-step-wipe/ColorBlockStepWipe.tsx
镜头卡 `transition`, 158 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/transition/cube-navigation/CubeNavigation.tsx
镜头卡 `transition`, 190 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/transition/page-turn-transitions/CubeRotate.tsx
镜头卡 `transition`, 115 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic). interpolate: [30, 68]->[0, 1].
### demos/_legacy/transition/paper-plane-messenger/PaperPlaneMessenger.tsx
镜头卡 `transition`, 184 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.45, 0.05, 0.25, 1), Easing.inOut(Easing.cubic), Easing.out(Easing.back(1.6), Easing.out(Easing.quad). interpolate: [CLICK, CLICK + 3, CLICK + 12]->[0, 1, 0]; [0, 0.25, 0.75, 1]->[1, 1.7, 1.7, 1.1].
### demos/_legacy/transition/shot-transitions/BlackCardTransition.tsx
镜头卡 `transition`, 138 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.2, 0.7, 0.3, 1), Easing.bezier(0.2, 0.75, 0.3, 1), Easing.bezier(0.3, 0, 0.2, 1), Easing.bezier(0.4, 0, 0.5, 1). interpolate: [0, 8]->[1, 0]; [18, 26]->[0, 1].
### demos/_legacy/transition/shot-transitions/DarkTunnelTransition.tsx
镜头卡 `transition`, 111 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.3, 0, 0.2, 1), Easing.bezier(0.4, 0, 0.6, 1), Easing.bezier(0.45, 0, 0.2, 1). interpolate: [26, 36]->[0, -A_W]; [32, 40, 42, 50]->[0, 1, 1, 0].
### demos/_legacy/transition/shot-transitions/FocusHandoffTransition.tsx
镜头卡 `transition`, 61 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.3, 0, 0.2, 1), Easing.bezier(0.45, 0, 0.3, 1). interpolate: [24, 40]->[0, 1]; [26, 42]->[0, 1].
### demos/_legacy/transition/shot-transitions/MaskWipeReal.tsx
镜头卡 `transition`, 68 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.5, 0, 0.2, 1). interpolate: [40, 85]->[0, 1]; [0, 1]->[g0.x, 0].
### demos/_legacy/transition/shot-transitions/WhipPanReal.tsx
镜头卡 `transition`, 46 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.6, 0, 0.4, 1). interpolate: [35, 43]->[0, SWING].
### demos/_legacy/transition/transition-travel/SharedElementMorph.tsx
镜头卡 `transition`, 102 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.4, 0, 0.2, 1), Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [MORPH_START, MORPH_END]->[0, 1.03]; [MORPH_END, SETTLE_END]->[1.03, 1].
### demos/_legacy/transition/wipe-transitions/ClockWipe.tsx
镜头卡 `transition`, 84 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [30, 90]->[0, 360]; [90, 96]->[1, 0].
### demos/_legacy/typography/cel-flash-stomp/CelFlashStomp.tsx
镜头卡 `typography`, 112 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.poly(5), Easing.out(Easing.quad). interpolate: [0, 4]->[1.18, 0.98]; [4, LAND]->[0.98, 1].
### demos/_legacy/typography/scramble/Scramble.tsx
镜头卡 `typography`, 64 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/typography/split-flap-title/SplitFlapFlip.tsx
镜头卡 `typography`, 190 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.quad), Easing.out(Easing.quad). interpolate: [15, 17, 19, 22]->[0, 6, -1.5, 0].
### demos/_legacy/typography/type-assembly-moves/TrackingExpandReveal.tsx
镜头卡 `typography`, 110 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.poly(5), Easing.out(Easing.quad), Easing.out(poly(5). interpolate: [0, 50]->[0, 1]; [0, 1]->[0.6, 1].
### demos/_legacy/typography/type-entrance-moves/ScrambleDecode.tsx
镜头卡 `typography`, 91 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/typography/typewriter-moves/TerminalTypewriter.tsx
镜头卡 `typography`, 123 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.cubic), Easing.in(cubic), Easing.out(Easing.cubic). interpolate: [T.enter, T.pushEnd]->[1, 3.2]; [T.pushEnd - 2, T.pushEnd]->[0, 10].
### demos/_legacy/typography/typing-code-block/TypingCodeBlock.tsx
镜头卡 `typography`, 104 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/ui-entrance/element-body-moves/AxialStretch.tsx
镜头卡 `ui-entrance`, 113 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.poly(4), Easing.out(Easing.cubic). interpolate: [start, start + FLIGHT]->[START_X, targetX]; [land, land + SQUASH / 2, land + SQUASH]->[1, 0.85, 1].
### demos/_legacy/ui-entrance/floating-glossy-label-pills/FloatingGlossyLabelPills.tsx
镜头卡 `ui-entrance`, 351 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/ui-entrance/morph-from-primitive/MorphFromPrimitive.tsx
镜头卡 `ui-entrance`, 191 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.out(Easing.cubic). interpolate: [10, 20, 30]->[1, 1.12, 1]; [30, 54]->[0, 1].
### demos/_legacy/ui-entrance/paper-craft-moves/MaskingTapeSlap.tsx
镜头卡 `ui-entrance`, 164 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [FLOAT_END, FLOAT_END + 8]->[0, 1]; [SLAP1, SLAP1 + 4]->[1, 0.45].
### demos/_legacy/ui-entrance/paper-craft-moves/PopupBookRise.tsx
镜头卡 `ui-entrance`, 135 行. Sequence from: none. durationInFrames: none.
spring: frame: frame - start, fps: FPS, config: { damping: 11, stiffness: 130, mass: 0.9. Easing: Easing.inOut(Easing.cubic). interpolate: [0, 1]->[0, -90]; [SETTLE, REST]->[75, 68].
### demos/_legacy/ui-entrance/platform-hinge-rise/PlatformHingeRise.tsx
镜头卡 `ui-entrance`, 165 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.16, 1, 0.3, 1), Easing.bezier(0.4, 0, 0.2, 1). interpolate: [start, Math.max(start + 1, end)]->[from, to]; [start, Math.max(start + 1, end)]->[0, 1].
### demos/_legacy/ui-entrance/runway-ground-skim/RunwayGroundSkim.tsx
镜头卡 `ui-entrance`, 259 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.3, 0.1, 0.6, 0.9), Easing.bezier(0.42, 0, 0.16, 1). interpolate: [38, 94]->[0, 1]; [0, 34]->[0, 1].
### demos/_legacy/ui-entrance/skeleton-reveal/SkeletonReveal.tsx
镜头卡 `ui-entrance`, 284 行. Sequence from: none. durationInFrames: none.
spring: frame: f - SWAP, fps, config: { damping: 16, stiffness: 160, mass: 0.7. Easing: Easing.in(Easing.cubic), Easing.inOut(Easing.cubic), Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [SWAP, SWAP + 8]->[0, 1]; [SWAP + 12 + i * 6, SWAP + 34 + i * 6]->[520, 0].
### demos/_legacy/ui-entrance/svg-shape-morph/SvgShapeMorph.tsx
镜头卡 `ui-entrance`, 81 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/_legacy/ui-entrance/wall-reveal-moves/GridWaveFlip.tsx
镜头卡 `ui-entrance`, 161 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.35, 0, 0.25, 1), Easing.out(Easing.cubic). interpolate: [delay, delay + FLIP]->[0, 180]; [delay, delay + FLIP]->[0, 190].
### demos/camera/basic-3d-scene/Basic3DScene.tsx
镜头卡 `basic-3d-scene`, 251 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/crash-zoom-punch/CrashImpactReal.tsx
镜头卡 `crash-zoom-punch`, 306 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/crash-zoom-punch/CrashZoomReal.tsx
镜头卡 `crash-zoom-punch`, 247 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/cursor-flyover/CursorFlyover.tsx
镜头卡 `cursor-flyover`, 391 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/depth-layer-moves/MultiplaneReal.tsx
镜头卡 `depth-layer-moves`, 139 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/graze-face-tour/GrazeFaceTour.tsx
镜头卡 `graze-face-tour`, 543 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/overhead-camera-moves/OverheadTabletopDrop.tsx
镜头卡 `overhead-camera-moves`, 316 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/overhead-camera-moves/TiltReveal.tsx
镜头卡 `overhead-camera-moves`, 300 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/space-camera-moves/DroneDiveLanding.tsx
镜头卡 `space-camera-moves`, 174 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.cubic), Easing.out(Easing.poly(5). interpolate: [DIVE_START, DIVE_END]->[-PRE_LIFT, DIVE_SHARE]; [DIVE_END, LAND_END]->[0, 1 - DIVE_SHARE].
### demos/camera/space-camera-moves/ExplodedView.tsx
镜头卡 `space-camera-moves`, 349 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/steep-tilt-glide/SteepTiltGlide.tsx
镜头卡 `steep-tilt-glide`, 367 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.3, 0.12, 0.72, 0.9), Easing.bezier(0.5, 0.05, 0.6, 1). interpolate: [0, 120]->[0, 1]; [0, 1]->[60, -4100].
### demos/camera/tension-camera-moves/BulletTimeFreezeOrbit.tsx
镜头卡 `tension-camera-moves`, 280 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/camera/tension-camera-moves/PullBackIsolation.tsx
镜头卡 `tension-camera-moves`, 185 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.quad), Easing.out(Easing.cubic), Easing.out(cubic). interpolate: [0, 110]->[2.2, 0.62]; [60, 110]->[0, 1].
### demos/camera/terminal-3d/Terminal3D.tsx
镜头卡 `terminal-3d`, 391 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/data/before-after-slider-scrub/BeforeAfterSliderScrub.tsx
镜头卡 `before-after-slider-scrub`, 156 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/data/chart-live-moves/AxisRescaleShockV2.tsx
镜头卡 `chart-live-moves`, 304 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/data/chart-live-moves/OscilloscopeStreamV2.tsx
镜头卡 `chart-live-moves`, 291 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/data/chart-live-moves/UnitDotSwarmRegroupV2.tsx
镜头卡 `chart-live-moves`, 279 行. Sequence from: none. durationInFrames: none.
spring: frame: f - start - stagOf(i, phase), fps: 30, config: { damping: 13, stiffness: 150, mass: 0.8; frame: frame - popDelay(i), fps: 30, config: { damping: 12, stiffness: 200. Easing: none. interpolate: none.
### demos/data/gauge-readout-moves/NeedleSweepSelftest.tsx
镜头卡 `gauge-readout-moves`, 308 行. Sequence from: none. durationInFrames: none.
spring: frame: frame - (s + 12), fps: 30, config: { stiffness: STIFF, damping: dampingFor(target), mass: 1. Easing: none. interpolate: none.
### demos/data/gauge-readout-moves/TapeScrollFixedPointer.tsx
镜头卡 `gauge-readout-moves`, 216 行. Sequence from: none. durationInFrames: none.
spring: frame: f - 83, fps: 30, config: { stiffness: SET_STIFF, damping: SET_DAMP, mass: 1. Easing: none. interpolate: none.
### demos/data/scroll-brake-moves/BrakeReticleLock.tsx
镜头卡 `scroll-brake-moves`, 300 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.sin), Easing.out(Easing.back(2.4), Easing.out(Easing.back(2.6), Easing.out(Easing.cubic). interpolate: [SCROLL_START, 50]->[0, FINAL_SCROLL - 430]; [50, BRAKE]->[FINAL_SCROLL - 430, FINAL_SCROLL + 30].
### demos/data/scroll-brake-moves/ChangelogScrollBrake.tsx
镜头卡 `scroll-brake-moves`, 233 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [SCROLL0, SCROLL1]->[START_T, END_T]; [LIFT0, LIFT1]->[0, 1].
### demos/data/timeline-travel/TimelineTravel.tsx
镜头卡 `timeline-travel`, 291 行. Sequence from: none. durationInFrames: 26.
spring: frame: frame - pop, fps: 30, config: { damping: 11, stiffness: 160, mass: 0.9. Easing: Easing.in(poly(2.2), Easing.inOut(Easing.quad), Easing.out(Easing.cubic). interpolate: [TRAVEL_START, TRAVEL_END]->[0, 1]; [0, 0.15, 0.88, 1]->[0, 0.055, 0.9, 1].
### demos/effects/assemble-then-type-flyin/AssembleThenTypeFlyin.tsx
镜头卡 `assemble-then-type-flyin`, 274 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/aurora-bloom-bg-flip/AuroraBloomBgFlip.tsx
镜头卡 `aurora-bloom-bg-flip`, 168 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/brand-frame-snap/BrandFrameSnap.tsx
镜头卡 `brand-frame-snap`, 537 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/fui-hud-moves/ReticleLockOn.tsx
镜头卡 `fui-hud-moves`, 165 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.back(1.8), Easing.out(Easing.cubic). interpolate: [FLY_IN, FLY_END]->[0, 1]; [LOCK_END, LOCK_END + 1, LOCK_END + 5]->[0, 1, 0].
### demos/effects/glow-flyline-moves/FlylineArc.tsx
镜头卡 `glow-flyline-moves`, 176 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [start, start + DUR]->[0, 1]; [start + DUR, start + DUR + 10]->[0, 1].
### demos/effects/glow-flyline-moves/GlowOrbAmbient.tsx
镜头卡 `glow-flyline-moves`, 198 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/glow-flyline-moves/OrbFlylineRelay.tsx
镜头卡 `glow-flyline-moves`, 242 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/icon-performance-moves/AttentionBounce.tsx
镜头卡 `icon-performance-moves`, 280 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/impact-feedback/AnimeImpact.tsx
镜头卡 `impact-feedback`, 231 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/impact-feedback/HitCounter.tsx
镜头卡 `impact-feedback`, 346 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/light-play-moves/SheenSweepRetry.tsx
镜头卡 `light-play-moves`, 276 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/light-play-moves/SpotlightSweepReveal.tsx
镜头卡 `light-play-moves`, 230 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/radial-ripple-phone-chips/RadialRipplePhoneChips.tsx
镜头卡 `radial-ripple-phone-chips`, 313 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/riso-print-hits/RisoMisregistrationHit.tsx
镜头卡 `riso-print-hits`, 223 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/scan-bracket-sweep/ScanBracketSweep.tsx
镜头卡 `scan-bracket-sweep`, 296 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/scanline-annotate-focus/ScanlineAnnotateFocus.tsx
镜头卡 `scanline-annotate-focus`, 330 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/scanline-assemble-flyin/ScanlineAssembleFlyin.tsx
镜头卡 `scanline-assemble-flyin`, 316 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/slam-entrance-moves/ImpactBurstKit.tsx
镜头卡 `slam-entrance-moves`, 265 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/slam-entrance-moves/KanadaPerspectiveSnap.tsx
镜头卡 `slam-entrance-moves`, 261 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/slam-entrance-moves/ScoreSlam.tsx
镜头卡 `slam-entrance-moves`, 264 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/effects/spotlight-sweep-moves/CornerSpotlightReveal.tsx
镜头卡 `spotlight-sweep-moves`, 124 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [0, 100]->[160, 1300]; [0, 96]->[140, 420].
### demos/effects/spotlight-sweep-moves/GlowWakeSleepPanel.tsx
镜头卡 `spotlight-sweep-moves`, 188 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [4, 120]->[-260, W + 260]; [0, 16, 100, 130]->[0, 1, 1, 0].
### demos/effects/spotlight-sweep-moves/SlideSpotlightPan.tsx
镜头卡 `spotlight-sweep-moves`, 176 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [0, 132]->[180, -1100]; [0, 132]->[-360, 2600].
### demos/interaction/autolayout-gap-dial/AutolayoutGapDial.tsx
镜头卡 `autolayout-gap-dial`, 306 行. Sequence from: none. durationInFrames: none.
spring: frame: f - HOLD_END, fps: FPS, config: { damping: 9, stiffness: 80, mass: 1.1. Easing: none. interpolate: none.
### demos/interaction/canvas-materialize-moves/DiagramCascadeBuild.tsx
镜头卡 `canvas-materialize-moves`, 351 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/interaction/canvas-materialize-moves/PanelToCanvasMaterialize.tsx
镜头卡 `canvas-materialize-moves`, 353 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/interaction/chip-grid-single-select-blackout/ChipGridSingleSelectBlackout.tsx
镜头卡 `chip-grid-single-select-blackout`, 219 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/interaction/collab-cursor-moves/CursorCastEnsemble.tsx
镜头卡 `collab-cursor-moves`, 298 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/interaction/glass-pill-dictation-typing/GlassPillDictationTyping.tsx
镜头卡 `glass-pill-dictation-typing`, 158 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/interaction/hashtag-to-pill-materialize/HashtagToPillMaterialize.tsx
镜头卡 `hashtag-to-pill-materialize`, 219 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.5, 0, 0.25, 1), Easing.out(Easing.quad). interpolate: [MOVE_START, MOVE_END]->[0, 1]; [0, 1]->[HERO.x, SLOT.x].
### demos/interaction/picker-carousel-feature-cycle/PickerCarouselFeatureCycle.tsx
镜头卡 `picker-carousel-feature-cycle`, 203 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/interaction/segmented-thumb-hero/SegmentedThumbHero.tsx
镜头卡 `segmented-thumb-hero`, 266 行. Sequence from: none. durationInFrames: none.
spring: frame: frame - FLOAT_IN, fps, config: { damping: 14, stiffness: 120, mass: 0.9; frame: frame - SLIDE_END, fps, config: { damping: 10, stiffness: 220, mass: 0.6. Easing: Easing.in(Easing.cubic), Easing.out(Easing.cubic), Easing.out(Easing.poly(4), Easing.out(Easing.quad). interpolate: [0, 1]->[200, 0]; [CURSOR_IN, CURSOR_IN + 24]->[0, 1].
### demos/interaction/theme-switch-moves/PaletteThemeRipple.tsx
镜头卡 `theme-switch-moves`, 458 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/interaction/theme-switch-moves/ThemeSweepToggle.tsx
镜头卡 `theme-switch-moves`, 447 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/interaction/type-and-filter/TypeAndFilter.tsx
镜头卡 `type-and-filter`, 250 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.33, 0, 0.15, 1), Easing.bezier(0.35, 0, 0.2, 1), Easing.bezier(0.45, 0, 0.2, 1), Easing.inOut(Easing.quad). interpolate: [a.frame, b.frame]->[0, 1]; [46, 57]->[0, 1].
### demos/interaction/voice-waveform-live/VoiceWaveformLive.tsx
镜头卡 `voice-waveform-live`, 279 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [a, a + rise, b - fall, b]->[0, 1, 1, 0]; [SUBMIT, SUBMIT + 3, SUBMIT + 9]->[1, 0.82, 1].
### demos/opening/crane-rise-reveal/CraneRiseReveal.tsx
镜头卡 `crane-rise-reveal`, 333 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/opening/dataviz-landscape-open/DatavizLandscapeOpen.tsx
镜头卡 `dataviz-landscape-open`, 359 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/opening/fracture/Fracture.tsx
镜头卡 `fracture`, 202 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/opening/icon-field-colorize/IconFieldColorize.tsx
镜头卡 `icon-field-colorize`, 201 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/opening/letterspace-materialize/LetterspaceMaterialize.tsx
镜头卡 `letterspace-materialize`, 209 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/opening/magician-card-flourish/MagicianCardFlourish.tsx
镜头卡 `magician-card-flourish`, 342 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.quad), Easing.inOut(Easing.quad), Easing.out(Easing.quad). interpolate: [0, 2.5]->[0.2, 1]; [6, TAKEOFF, FLASH_END]->[1, 0.3, 0.05].
### demos/opening/orbit-ring-title-open/OrbitRingTitleOpen.tsx
镜头卡 `orbit-ring-title-open`, 390 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.linear, Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [a, b]->[0, 1].
### demos/opening/spotlight-hero-card/SpotlightHeroCard.tsx
镜头卡 `spotlight-hero-card`, 294 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.2, 1.25, 0.3, 1), Easing.bezier(0.35, 0, 0.2, 1), Easing.bezier(0.4, 0, 0.3, 1.05). interpolate: [a.frame, b.frame]->[0, 1]; [1, 3, 4, 6]->[0, 1, 0.62, 1].
### demos/opening/stroke-segment-build/StrokeSegmentBuild.tsx
镜头卡 `stroke-segment-build`, 184 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [s, s + 1, s + 2, s + 3, s + 4, s + 5, s + STRIKE]->[0, 1, 0.12, 0.95, 0.4, 1, 0.58]; [REVEAL, REVEAL + 3, REVEAL + 22]->[0, 1, 0].
### demos/opening/text-as-mask/TextAsMask.tsx
镜头卡 `text-as-mask`, 246 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [0.86, 0.95]->[0, 1]; [0, 0.25]->[0, 1].
### demos/outro/grain-dissolve/GrainDissolve.tsx
镜头卡 `grain-dissolve`, 223 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/outro/logo-shrink-wordmark-lockup/LogoShrinkWordmarkLockup.tsx
镜头卡 `logo-shrink-wordmark-lockup`, 224 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/outro/neon-triple-marquee/NeonTripleMarquee.tsx
镜头卡 `neon-triple-marquee`, 218 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/outro/outro-group-photo-launch/OutroGroupPhotoLaunch.tsx
镜头卡 `outro-group-photo-launch`, 344 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.2, 0.75, 0.3, 1), Easing.bezier(0.3, 0, 0.2, 1), Easing.bezier(0.34, 1.4, 0.44, 1), Easing.bezier(0.4, 0, 0.4, 1). interpolate: [0, 24]->[0, 14]; [58, 70]->[0, 1].
### demos/outro/ui-strip-away-outro/UiStripAwayOutro.tsx
镜头卡 `ui-strip-away-outro`, 358 行. Sequence from: none. durationInFrames: none.
spring: frame: frame - CLICK, fps, config: { damping: 12, stiffness: 220; frame: frame - LOGO_IN, fps, config: { damping: 14, stiffness: 90. Easing: Easing.bezier(0.3, 0, 0.15, 1), Easing.in(Easing.quad), Easing.inOut(Easing.cubic), Easing.inOut(Easing.quad). interpolate: [start, start + STRIP_DUR]->[0, 1]; [STRIP.canvasBg, STRIP.canvasBg + STRIP_DUR + 6]->[0, 1].
### demos/outro/ui-to-brand-morph/IconFlipBloomLogo.tsx
镜头卡 `ui-to-brand-morph`, 188 行. Sequence from: none. durationInFrames: none.
spring: frame, fps, config: { damping: 13, stiffness: 140, mass: 0.8; frame: frame - FLIP_MID, fps, config: { damping: 11, stiffness: 130, mass: 0.9. Easing: Easing.in(Easing.cubic), Easing.inOut(Easing.sin), Easing.out(Easing.cubic). interpolate: [12, 18, 24, 30, FLIP_START]->[0, -12, 14, -18, 0]; [FLIP_START, FLIP_MID]->[0, 1].
### demos/outro/ui-to-brand-morph/InputMorphsIntoLogo.tsx
镜头卡 `ui-to-brand-morph`, 334 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/rhythm/beat-cut-moves/PaparazziFlash.tsx
镜头卡 `beat-cut-moves`, 275 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/rhythm/beat-step-list-theme-cycle/BeatStepListThemeCycle.tsx
镜头卡 `beat-step-list-theme-cycle`, 271 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [0, 0.6, 1]->[1.14, 0.96, 1]; [0, 0.6, 1]->[0.97, 1.01, 1].
### demos/rhythm/panel-grid-moves/ComicPanelSplit.tsx
镜头卡 `panel-grid-moves`, 431 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/rhythm/quad-split-parallel-scenes/QuadSplitParallelScenes.tsx
镜头卡 `quad-split-parallel-scenes`, 253 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/rhythm/rhythm-interrupt-moves/JumpCutPunchIn.tsx
镜头卡 `rhythm-interrupt-moves`, 107 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/rhythm/sakuga-timing-shift/SakugaTimingShift.tsx
镜头卡 `sakuga-timing-shift`, 289 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.out(Easing.cubic), Easing.out(Easing.poly(4). interpolate: [0, SWITCH - 3]->[X_LEFT, X_RIGHT]; [SWITCH, ARRIVE]->[X_RIGHT, X_CENTER - OVERSHOOT].
### demos/rhythm/speed-ramp-freeze/FreezeAnnotateReal.tsx
镜头卡 `speed-ramp-freeze`, 363 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/rhythm/trailer-grammar-moves/TrailerBumper.tsx
镜头卡 `trailer-grammar-moves`, 169 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [start, start + 9]->[1, 1.04]; [TITLE, TITLE + TITLE_IN]->[0, 1].
### demos/transition/bottom-push-stack-wipe/BottomPushStackWipe.tsx
镜头卡 `bottom-push-stack-wipe`, 311 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/card-flip-reveal/CardFlipReveal.tsx
镜头卡 `card-flip-reveal`, 262 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/card-flock-tumble/CardFlockTumble.tsx
镜头卡 `card-flock-tumble`, 460 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.in(Easing.cubic), Easing.in(Easing.quad), Easing.out(Easing.cubic). interpolate: [0, 4, 30, 60]->[0, 1, 0.94, 0.76]; [0, 52]->[0.36, 0.27].
### demos/transition/circle-match-iris/CircleMatchIris.tsx
镜头卡 `circle-match-iris`, 295 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/gradient-transition/GradientTransition.tsx
镜头卡 `gradient-transition`, 162 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/line-carry-transition/LineCarryTransition.tsx
镜头卡 `line-carry-transition`, 249 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/mosaic-reframe/MosaicReframe.tsx
镜头卡 `mosaic-reframe`, 360 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/page-turn-transitions/BarnDoorSplit.tsx
镜头卡 `page-turn-transitions`, 228 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/print-texture-transitions/InkBleedReveal.tsx
镜头卡 `print-texture-transitions`, 163 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.quad), Easing.out(quad). interpolate: [20, 98]->[0, 1450]; [78, 98]->[1, 0].
### demos/transition/shot-transitions/PortalWipeV2.tsx
镜头卡 `shot-transitions`, 249 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.7, 0, 0.3, 1), Easing.out(Easing.cubic), Easing.out(cubic). interpolate: [26, 66]->[0, 1]; [42, 74]->[0, 1].
### demos/transition/shot-transitions/WhipBrakeReal.tsx
镜头卡 `shot-transitions`, 187 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/tear-streak-transitions/GlitchDisplace.tsx
镜头卡 `tear-streak-transitions`, 356 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/transition-hidden-cut/InvisibleCut.tsx
镜头卡 `transition-hidden-cut`, 273 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/transition-hidden-cut/LightLeakBurn.tsx
镜头卡 `transition-hidden-cut`, 263 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/transition-hidden-cut/VersusSlam.tsx
镜头卡 `transition-hidden-cut`, 218 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/transition-travel/LetterformZoom.tsx
镜头卡 `transition-travel`, 286 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/white-flash-logo-simplify-cut/WhiteFlashLogoSimplifyCut.tsx
镜头卡 `white-flash-logo-simplify-cut`, 206 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/transition/wipe-transitions/BlindsSlice.tsx
镜头卡 `wipe-transitions`, 179 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/blur-slide/BlurSlide.tsx
镜头卡 `blur-slide`, 148 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/brace-expand/BraceExpand.tsx
镜头卡 `brace-expand`, 144 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/brand-ink-open/BrandInkOpen.tsx
镜头卡 `brand-ink-open`, 135 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.2, 0.7, 0.25, 1), Easing.bezier(0.3, 0, 0.2, 1), Easing.bezier(0.4, 0, 0.5, 1), Easing.linear. interpolate: [0, 9]->[100, 0]; [8, 18]->[100, 0].
### demos/typography/countdown-arc-scatter/CountdownArcScatter.tsx
镜头卡 `countdown-arc-scatter`, 218 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/flying-words/FlyingWords.tsx
镜头卡 `flying-words`, 199 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/glitch-cycle/GlitchCycle.tsx
镜头卡 `glitch-cycle`, 222 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/gradient-word-sweep/GradientWordSweep.tsx
镜头卡 `gradient-word-sweep`, 313 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.quad). interpolate: [FILL_START, FILL_END]->[0, 1]; [FILL_END, FILL_END + 6]->[1, 0].
### demos/typography/lead-word-zoom-assemble/LeadWordZoomAssemble.tsx
镜头卡 `lead-word-zoom-assemble`, 262 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.22, 0.8, 0.36, 1), Easing.bezier(0.25, 1, 0.5, 1), Easing.bezier(0.5, 0, 0.05, 1), Easing.in(Easing.quad). interpolate: [0, HOLD_DURATION]->[INITIAL_SCALE, INITIAL_SCALE * PUSH_SCALE]; [HOLD_DURATION, HOLD_DURATION + RECEDE_DURATION]->[0, 1 - INITIAL_SCALE * PUSH_SCALE].
### demos/typography/marker-underline-title/MarkerUnderlineTitle.tsx
镜头卡 `marker-underline-title`, 122 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [32, 42]->[0, 1].
### demos/typography/outline-word-fill/OutlineWordFill.tsx
镜头卡 `outline-word-fill`, 154 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/paper-title-card/PaperTitleCard.tsx
镜头卡 `paper-title-card`, 180 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.2, 0.75, 0.3, 1), Easing.bezier(0.25, 0.8, 0.25, 1), Easing.bezier(0.3, 0, 0.2, 1). interpolate: [delay, delay + 22]->[0, 1]; [duration - 8, duration]->[1, 0].
### demos/typography/pill-chip-slot-cycle-handled/PillChipSlotCycleHandled.tsx
镜头卡 `pill-chip-slot-cycle-handled`, 141 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/pill-slot-cycle/PillSlotCycle.tsx
镜头卡 `pill-slot-cycle`, 310 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.back(1.4). interpolate: [cycleEnd, cycleEnd + FIN]->[0, 1]; [cycleEnd, cycleEnd + FIN]->[90, 0].
### demos/typography/text-column-converge/TextColumnConverge.tsx
镜头卡 `text-column-converge`, 192 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic). interpolate: [0, CONVERGE_DUR]->[0, 1]; [0, CONVERGE_DUR]->[0, 1].
### demos/typography/title-demote-to-label/TitleDemoteToLabel.tsx
镜头卡 `title-demote-to-label`, 293 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/type-assembly-moves/LetterformDriftAssembly.tsx
镜头卡 `type-assembly-moves`, 136 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.out(Easing.cubic), Easing.out(cubic). interpolate: [80, 92]->[1, 1.04]; [92, 104]->[1.04, 1].
### demos/typography/type-assembly-moves/SplitTextStagger.tsx
镜头卡 `type-assembly-moves`, 125 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.out(Easing.cubic), Easing.out(Easing.quad), Easing.out(cubic). interpolate: [t0, t0 + RISE]->[115, OVERSHOOT]; [t0 + RISE, t0 + RISE + SETTLE]->[OVERSHOOT, 0].
### demos/typography/type-assembly-moves/TextOnPath.tsx
镜头卡 `type-assembly-moves`, 256 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/type-entrance-moves/LetterDropPhysics.tsx
镜头卡 `type-entrance-moves`, 174 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/type-rhythm-sync/FontWeightPump.tsx
镜头卡 `type-rhythm-sync`, 226 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/type-rhythm-sync/KaraokeFillSync.tsx
镜头卡 `type-rhythm-sync`, 142 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [word.start, word.end]->[0, 1].
### demos/typography/typewriter-moves/TypewriterErrorRetype.tsx
镜头卡 `typewriter-moves`, 138 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/vertical-word-roll-blur-cycle/VerticalWordRollBlurCycle.tsx
镜头卡 `vertical-word-roll-blur-cycle`, 148 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/word-relay-filmstrip/WordRelayFilmstrip.tsx
镜头卡 `word-relay-filmstrip`, 410 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/typography/word-relay-geometry/WordRelayGeometry.tsx
镜头卡 `word-relay-geometry`, 281 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/avatar-bracket-carousel/AvatarBracketCarousel.tsx
镜头卡 `avatar-bracket-carousel`, 272 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/bezier-source-converge-merge/BezierSourceConvergeMerge.tsx
镜头卡 `bezier-source-converge-merge`, 386 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/card-stack/CardStack.tsx
镜头卡 `card-stack`, 313 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/carousel-3d/Carousel3D.tsx
镜头卡 `carousel-3d`, 304 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/clipcard-looping/ClipCardLooping.tsx
镜头卡 `clipcard-looping`, 78 行. Sequence from: 0. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/cloner-depth-echo/ClonerDepthEcho.tsx
镜头卡 `cloner-depth-echo`, 312 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/deck-deal-flyin/DeckDealFlyin.tsx
镜头卡 `deck-deal-flyin`, 308 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.3, 0, 0.2, 1), Easing.bezier(0.3, 0, 0.25, 1.15), Easing.bezier(0.5, 0, 0.6, 1), Easing.out(Easing.quad). interpolate: [34, 64]->[0, 1]; [ANTICIPATE.from, ANTICIPATE.to]->[0, 1].
### demos/ui-entrance/doc-park-left-pill-deal/DocParkLeftPillDeal.tsx
镜头卡 `doc-park-left-pill-deal`, 350 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/document-typewriter-reveal/DocumentTypewriterReveal.tsx
镜头卡 `document-typewriter-reveal`, 256 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.2, 1.15, 0.3, 1), Easing.bezier(0.3, 0, 0.2, 1), Easing.bezier(0.4, 0, 0.6, 1). interpolate: [cue, cue + WIPE]->[1, 0]; [nameCue, nameCue + 8]->[0, 1].
### demos/ui-entrance/draw-svg-trace/DrawSvgTrace.tsx
镜头卡 `draw-svg-trace`, 245 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.inOut(Easing.cubic), Easing.out(Easing.cubic). interpolate: [TRACE0, TRACE1]->[0, 1]; [0, 0.02, 0.97, 0.995]->[0, 1, 1, 0].
### demos/ui-entrance/element-body-moves/ContactShadowLift.tsx
镜头卡 `element-body-moves`, 218 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/integration-hub-map/IntegrationHubMap.tsx
镜头卡 `integration-hub-map`, 653 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.34, 1.5, 0.64, 1), Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [14, 49]->[0, 180]; [19, 21, 23, 27]->[0, 1, 0.25, 0].
### demos/ui-entrance/list-reveal/ListReveal.tsx
镜头卡 `list-reveal`, 154 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/list-stack-press/ListStackPress.tsx
镜头卡 `list-stack-press`, 239 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.25, 0.8, 0.25, 1), Easing.bezier(0.3, 0, 0.2, 1), Easing.bezier(0.45, 0, 0.35, 1), Easing.bezier(0.45, 0.05, 0.25, 1.12). interpolate: [c + DUR, c + DUR + ROLL_DUR]->[0, 1]; [ANTICIPATE_START, ANTICIPATE_END]->[0, 1].
### demos/ui-entrance/neon-frame-forerun/NeonFrameForerun.tsx
镜头卡 `neon-frame-forerun`, 325 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/neon-frame-orbit-drop/NeonFrameForerunOrbit.tsx
镜头卡 `neon-frame-orbit-drop`, 355 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.3, 0.1, 0.3, 1), Easing.bezier(0.35, 0, 0.3, 1), Easing.bezier(0.42, 0.05, 0.32, 1), Easing.bezier(0.5, 0.05, 0.6, 1). interpolate: [0, 14]->[0, 1]; [8, 30]->[0.25, 1].
### demos/ui-entrance/page-waterfall-wall/PageWaterfallWall.tsx
镜头卡 `page-waterfall-wall`, 102 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: [0, durationInFrames]->[1, 1 + PUSH].
### demos/ui-entrance/page-waterfall-wall/VerticalTicker.tsx
镜头卡 `page-waterfall-wall`, 130 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/product-card-progressive-assemble/ProductCardProgressiveAssemble.tsx
镜头卡 `product-card-progressive-assemble`, 298 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/radial-wave/RadialWave.tsx
镜头卡 `radial-wave`, 58 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/research-card-stack-scroll/ResearchCardStackScroll.tsx
镜头卡 `research-card-stack-scroll`, 156 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/row-embed/RowEmbed.tsx
镜头卡 `row-embed`, 176 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.5, 0, 0.8, 0.75), Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [cue, cue + FLY]->[0, 1]; [land, land + 2]->[1, 0].
### demos/ui-entrance/value-stagger-gradient/ValueStaggerGradient.tsx
镜头卡 `value-stagger-gradient`, 154 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: none. interpolate: none.
### demos/ui-entrance/wall-reveal-moves/BentoLightUp.tsx
镜头卡 `wall-reveal-moves`, 147 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.3, 1.4, 0.5, 1), Easing.bezier(0.33, 0, 0.2, 1), Easing.out(Easing.cubic), Easing.out(Easing.quad). interpolate: [start, start + 8]->[0, 1]; [start + 12, start + 26]->[1, 0.4].
### demos/ui-entrance/wall-reveal-moves/WireframeDrawOn.tsx
镜头卡 `wall-reveal-moves`, 227 行. Sequence from: none. durationInFrames: none.
spring: none. Easing: Easing.bezier(0.4, 0, 0.3, 1), Easing.bezier(0.55, 0, 0.25, 1), Easing.out(Easing.quad). interpolate: [start, start + 30]->[0, 1]; [88, 118]->[0, 1].

## 7. 逐演示目录

226 个 tsx 各一条, 在 `docs/research/shots/part-1.md` 到 `part-6.md`. 含遗留演示和夹具. 帧号和缓动来自源码行, 镜头卡参数另列. 覆盖清单见 `docs/research/coverage.md`.
