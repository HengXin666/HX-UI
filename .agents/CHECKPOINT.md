# CHECKPOINT: react-bits 余量 (Components 48 件)

接手先读这份, 再读 `.hark/plan.md` (git 忽略, 用 `hxfs plan` 提交). 本文件随每段落定更新.

## 顺序

controls 15 件 → kits gallery 11 → kits stack 8 + glass 2 → kits card 9 + stage3d 3 → 收口 (./controls ./kits 子路径, api 快照, 0.10.0, docs-props, gates:push) → surface 余量 30 件.
推送由用户做, 这里只 commit. 每件单独提交, pre-commit 13/13 + 本件 vitest 全绿才提.

## 已裁定 (不再待定)

- 焦点环: outline 1px + offset 2px + ring 色, 代码只引用 `craft/tokens.ts` 的 `FOCUS_RING`. craft.md 已写「焦点环与线宽」. 不改 rules, 不改 baseline. 已提交的老控件 ring-1 在收口统一换.
- 曲线: craft EASE 之外的规格曲线收在 `src/motion/curves.ts` (`CURVE`, `cssCurve`), 族内不留 cubic-bezier 副本. 暂不进 motion 公共出口 (进出口要升版), 收口 0.10.0 一并导出并 `check-api-snapshot --update`.
- TallyRoll 过冲: 在 tallyOvershoot 内反解到 ≤ 0.06 位, 不放宽合同.

## 状态: controls 15 件

| 规格 | HX 名 | 位置 | 状态 |
|---|---|---|---|
| (基础) | CURVE / FOCUS_RING | motion/curves.ts, craft/tokens.ts | 已提 9c908a0 |
| SpecularButton | GlintButton | press/signal | 待提 |
| Counter | TallyRoll | range/meter | 过冲 1.086 > 1.06 待修 |
| ElasticSlider | StretchSlider | range/input | 滚轮重复绑定待修 |
| CurvedInput | ArcField | compose/input | 测试绿, 待换 FOCUS_RING 后提 |
| OptionWheel | ReelPicker | choice/pick | 测试绿, 待换 FOCUS_RING 后提 |
| Stepper | StepTrail | choice/steps | 减弱动效下勾仍描画, 待修 |
| Dock | MagnifyDock | nav/dock | 仓库草稿, 未测 |
| PillNav | PillTabs | nav/bar | 仓库草稿, 未测 |
| GooeyNav, GlassIcons, LineSidebar | — | nav/bar, nav/tile, nav/rail | 未写 (上一沙箱本地草稿已丢) |
| BubbleMenu, CardNav, StaggeredMenu, FlowingMenu | — | nav/menu | 未写 |

## 已知坑

- hxfs exec 首词白名单: 不能 `bash`; 多步用 `git ... && ...` 直接串. land.sh 用不了, 手动 `git add -- <files> && git commit -q -F <scratch>/msg`.
- 新 sandbox home 会重置, 先装 hxfs (见用户给的 curl 链接), 二进制在 `~/.hxfs/bin/hxfs`, PATH 不自动生效.
- `tests/controls/range/zz-probe.test.tsx` 是调试探针, 不提交, 用完删.
- 规格只取 `docs/research/catalog/components-1.md` / `components-2.md`; 上游 MIT + Commons Clause, 只当规格, 自写自命名.
- 工作区里 `.agents/notes/implemented/feature/2026-11-08-controls-press.md` 与各族 index.ts 的改动随对应件一起提.
