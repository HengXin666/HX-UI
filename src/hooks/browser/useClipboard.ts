import { useCallback, useEffect, useRef, useState } from "react";
import { CLIPBOARD_RESET_MS, canUseDOM } from "../../constants/hooks";

/** useClipboard 的选项, 与 Mantine 一致. */
export interface UseClipboardOptions {
  /** 复制成功后 copied 保持 true 的时长 (ms), 默认 2000. */
  timeout?: number;
}

/** useClipboard 的返回. */
export interface UseClipboardReturn {
  /** 把文本写入剪贴板. */
  copy: (value: string) => void;
  /** 立即把 copied 与 error 复位. */
  reset: () => void;
  /** 最近一次复制失败的错误. */
  error: Error | null;
  /** 最近一次复制是否成功且仍在 timeout 内. */
  copied: boolean;
}

/**
 * 通过 navigator.clipboard 复制文本, 并提供 "已复制" 的短暂状态 (对标 Mantine useClipboard).
 *
 * @param options timeout 选项.
 * @returns { copy, reset, error, copied }.
 * @example
 * const clipboard = useClipboard({ timeout: 1500 });
 * <Button type="button" onClick={() => clipboard.copy(token)}>{clipboard.copied ? "已复制" : "复制"}</Button>
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const timeout = options.timeout ?? CLIPBOARD_RESET_MS;
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const copy = useCallback(
    (value: string) => {
      const clipboard = canUseDOM() ? navigator.clipboard : undefined;
      if (!clipboard) {
        setError(new Error("useClipboard: 当前环境不支持 navigator.clipboard"));
        return;
      }
      clipboard.writeText(value).then(
        () => {
          clear();
          setError(null);
          setCopied(true);
          timer.current = setTimeout(() => setCopied(false), timeout);
        },
        (reason: unknown) => setError(reason instanceof Error ? reason : new Error(String(reason))),
      );
    },
    [clear, timeout],
  );

  const reset = useCallback(() => {
    clear();
    setCopied(false);
    setError(null);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { copy, reset, error, copied };
}
