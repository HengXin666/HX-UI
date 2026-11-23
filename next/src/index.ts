/**
 * @hx/ui 2 公共入口.
 * components/ui (shadcn 基础件, 按文件引), motion, effects, data, hooks, interactions.
 */
export { cn } from "./lib/utils";
export { ThemeProvider, useTheme, themeScript } from "./hooks/use-theme";
export type { ThemeMode, ThemeAccent } from "./hooks/use-theme";
export * as Motion from "./motion";
export * as Effects from "./effects";
export * as Data from "./data";
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
