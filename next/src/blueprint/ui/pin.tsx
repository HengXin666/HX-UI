import { memo } from "react";
import type { PinShape } from "../types";

/**
 * Pin glyph (12x12 graph units). UE5 look: exec = white wedge, data = circle, array = 3x3 grid,
 * set = braces, map = two-colour (key | value), delegate = square. Hollow when unconnected, filled when connected.
 */
export const PinGlyph = memo(function PinGlyph({
  shape, color, keyColor, connected,
}: { shape: PinShape; color: string; keyColor?: string | undefined; connected: boolean }) {
  const fill = connected ? color : "none";
  switch (shape) {
    case "exec":
      return (
        <svg viewBox="0 0 12 12" aria-hidden>
          <path d="M1.5,1.5 H6.2 L10.5,6 L6.2,10.5 H1.5 Z" fill={connected ? "var(--bp-exec)" : "none"} stroke="var(--bp-exec)" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "array":
      return (
        <svg viewBox="0 0 12 12" aria-hidden>
          {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => (
            <rect key={`${r}${c}`} x={0.8 + c * 3.8} y={0.8 + r * 3.8} width="2.6" height="2.6" rx="0.4"
              fill={connected || (r === 1 && c === 1) ? color : "none"} stroke={color} strokeWidth="0.9" />
          )))}
        </svg>
      );
    case "set":
      return (
        <svg viewBox="0 0 12 12" aria-hidden>
          <path d="M4,1.5 C2.5,1.5 2.8,5.2 1.2,6 C2.8,6.8 2.5,10.5 4,10.5 M8,1.5 C9.5,1.5 9.2,5.2 10.8,6 C9.2,6.8 9.5,10.5 8,10.5" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="6" cy="6" r="1.6" fill={connected ? color : "none"} stroke={color} strokeWidth="1" />
        </svg>
      );
    case "map": {
      const k = keyColor ?? color;
      return (
        <svg viewBox="0 0 12 12" aria-hidden>
          <path d="M6,1.6 A4.4,4.4 0 0 0 6,10.4 Z" fill={connected ? k : "none"} stroke={k} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M6,1.6 A4.4,4.4 0 0 1 6,10.4 Z" fill={fill} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    }
    case "delegate":
      return (
        <svg viewBox="0 0 12 12" aria-hidden>
          <rect x="1.8" y="1.8" width="8.4" height="8.4" rx="1.2" fill={fill} stroke={color} strokeWidth="1.5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 12 12" aria-hidden>
          <circle cx="6" cy="6" r="4.3" fill={fill} stroke={color} strokeWidth="1.6" />
        </svg>
      );
  }
});
