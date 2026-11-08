# backdrop kernel 约束

API 见同目录 README.md, 决策见 `.agents/notes/implemented/feature/2026-11-09-surface-backdrop-kernel.md`.

- 只直接调用 WebGL2 与 Canvas2D, 不引入 three, ogl, gsap 等依赖
- 帧循环只走 `src/motion/frame/use-frame-loop`, 不自起 requestAnimationFrame
- 公共头的 uniform 名与 BackdropFrame 字段只加不改, 两路 Backgrounds 与 Animations, TextAnimations 都依赖它们
- 颜色只来自语义 token 或用户传入的值, 内核不写色值字面量
