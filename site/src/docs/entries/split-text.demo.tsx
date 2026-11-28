import { SplitText, type SplitTextProps } from "@/text/split-text";
import type { DemoProps } from "../types";

export default function SplitTextDemo({ values, onEvent }: DemoProps) {
  const { toast, ...props } = values;
  return (
    <SplitText
      {...(props as unknown as SplitTextProps)}
      as="h2"
      className="max-w-[16ch] text-center text-5xl font-semibold leading-[1.05] tracking-[-0.035em] text-balance sm:text-7xl"
      onComplete={toast ? () => onEvent?.("动画播完了") : undefined}
    />
  );
}
