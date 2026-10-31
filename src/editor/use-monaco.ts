"use client";

import { useEffect, useRef, useState } from "react";
import { loader } from "@monaco-editor/react";

interface MonacoEnvironmentShape {
  getWorker?: (moduleId: string, label: string) => Worker;
}

/**
 * 装 monaco 的 worker 钩子 (只在还没有别人装过时装).
 *
 * worker 必须由使用方提供: 它依赖具体打包器的语法 (Vite 的 ?worker, webpack 的
 * worker-loader), 库自己 new URL 一个裸包名在构建期解析不了. 没有 worker 时 monaco
 * 退回主线程计算, 编辑与着色都正常, 只有大文件的语言服务慢一点.
 */
function installEnvironment(readFactory: () => ((label: string) => Worker) | undefined): void {
  if (!readFactory()) {
    return;
  }
  const globalObject = self as unknown as { MonacoEnvironment?: MonacoEnvironmentShape };
  if (globalObject.MonacoEnvironment?.getWorker) {
    return;
  }
  /** 每次 getWorker 调用时才读工厂, 所以调用方后续新增或替换 createWorker 都能生效. */
  globalObject.MonacoEnvironment = {
    getWorker: (_moduleId: string, label: string) => readFactory()!(label),
  };
}

/**
 * 本地 monaco, 不走 CDN. CodeEditor 与 DiffEditor 共用这一次加载.
 */
export function useMonacoReady(createWorker?: (label: string) => Worker): boolean {
  const [ready, setReady] = useState(false);
  const workerFactory = useRef(createWorker);
  if (createWorker) {
    workerFactory.current = createWorker;
  }

  useEffect(() => {
    let alive = true;
    void import("monaco-editor").then((monaco) => {
      if (!alive) {
        return;
      }
      installEnvironment(() => workerFactory.current);
      loader.config({ monaco });
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return ready;
}
