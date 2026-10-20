import type { JSX } from "react";
import { cn } from "../primitives/utils";

export interface StreamingTextProps {
  readonly text: string;
  readonly streaming: boolean;
  readonly cursor?: boolean;
  readonly className?: string;
}

/**
 * StreamingText renders model output that grows token by token.
 *
 * streaming adds a pulsing caret after the text, cursor=false hides the caret.
 * The body keeps whitespace and newlines, so partial output does not reflow.
 */
export function StreamingText({
  text,
  streaming,
  cursor = true,
  className,
}: StreamingTextProps): JSX.Element {
  return (
    <span
      data-slot="streaming-text"
      data-streaming={streaming ? "true" : "false"}
      className={cn(
        "whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-foreground",
        className,
      )}
    >
      {text}
      {streaming && cursor ? (
        <span
          aria-hidden="true"
          data-slot="streaming-text-cursor"
          className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-foreground/70 align-baseline motion-reduce:animate-none"
        />
      ) : null}
    </span>
  );
}
