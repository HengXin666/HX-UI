import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import { DecryptedText, type DecryptedTextHandle, type DecryptTrigger, type DecryptEffect, type DecryptDirection } from "@/text/decrypted-text";
import type { DemoProps } from "../types";
import { CHARSETS } from "./decrypted-text";

export default function DecryptedTextDemo({ values: v, onEvent }: DemoProps) {
  const ref = useRef<DecryptedTextHandle>(null);
  return (
    <div className="relative grid h-full w-full place-items-center px-6">
      <DecryptedText
        ref={ref}
        text={String(v.text)}
        as="p"
        effect={v.effect as DecryptEffect}
        animateOn={v.animateOn as DecryptTrigger}
        clickMode={v.clickMode as "once" | "toggle"}
        revealDirection={v.revealDirection as DecryptDirection}
        speed={Number(v.speed)}
        maxIterations={Number(v.maxIterations)}
        hoverRadius={Number(v.hoverRadius)}
        loop={Boolean(v.loop)}
        loopDelay={Number(v.loopDelay)}
        sequential={Boolean(v.sequential)}
        useOriginalCharsOnly={Boolean(v.useOriginalCharsOnly)}
        characters={CHARSETS[String(v.charset)]}
        scrambleColor={String(v.scrambleColor)}
        parentClassName="max-w-[22ch] text-center text-3xl font-medium tracking-[-0.02em] sm:text-[2.6rem] sm:leading-[1.15]"
        onComplete={() => onEvent?.("解密完成")}
      />
      <button
        type="button"
        onClick={() => ref.current?.play()}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg border bg-background/60 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        aria-label="重播"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
}
