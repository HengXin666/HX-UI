/**
 * @hx/ui 2 公共入口.
 * components/ui (shadcn 基础件, 按文件引: "@hx/ui/ui/button"), motion, effects, data, hooks, interactions.
 * Data 命名空间只含 2D 图表 + 表格; 3D 图表单独从 "@hx/ui/data/3d" 引 (需要 three), 让根入口不依赖 three.
 * 蓝图是拓展包, 不从这里导出: 逻辑 "@hx/ui/blueprint", 编辑器 "@hx/ui/blueprint/ui", 样式 "@hx/ui/blueprint.css" (见 README).
 */
export { cn } from "./lib/utils";
export { ThemeProvider, useTheme, themeScript, THEME_STORAGE_KEY } from "./hooks/theme";
export type { ThemeMode, ThemeAccent } from "./hooks/theme";
export * as Motion from "./motion";
export * as Effects from "./effects";
export * as Data from "./data/base";
export * from "./interactions";
export { SplitText } from "./text/split-text";
export type { SplitTextProps, SplitEffect, SplitFrom, SplitEase, SplitHover } from "./text/split-text";
export { NumberRoll } from "./text/number-roll";
export type { NumberRollProps } from "./text/number-roll";
export { DecryptedText } from "./text/decrypted-text";
export type { DecryptedTextProps, DecryptedTextHandle, DecryptChar, DecryptEffect, DecryptTrigger, DecryptDirection } from "./text/decrypted-text";
export { Aurora } from "./backgrounds/aurora";
export type { AuroraProps } from "./backgrounds/aurora";
export { Particles } from "./backgrounds/particles";
export type { ParticlesProps, ParticlesHandle, ParticleShape } from "./backgrounds/particles";
export { ClickSpark } from "./effects/click-spark";
export type { ClickSparkProps, ClickSparkHandle, SparkShape, SparkEasing } from "./effects/click-spark";
export { ScrollStack, ScrollStackItem } from "./scroll/scroll-stack";
export type { ScrollStackProps, ScrollStackItemProps } from "./scroll/scroll-stack";
export { ScrollReveal } from "./scroll/scroll-reveal";
export type { ScrollRevealProps, RevealEffect } from "./scroll/scroll-reveal";
export { Stage, StageScreen } from "./stage/stage";
export type { StageProps, StageScreenProps, StageHandle, StageDevice, StageBackground, StageArrange } from "./stage/stage";
export { SHOTS, MOTIONS, resolveShot, resolveMotion, sampleMotion } from "./stage/shots";
export type { Shot, ShotName, ShotInput, StageMotion, StageKeyframe, MotionName, MotionInput, StageEase } from "./stage/shots";
