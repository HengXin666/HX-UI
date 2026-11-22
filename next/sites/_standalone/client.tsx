import { startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./entry.css";
import { App } from "./app";

const root = document.getElementById("root")!;
// 有预渲染内容就水合, 开发模式 (没有预渲染) 就直接渲染.
// 水合放进 transition: React 按时间片做, 每 5ms 让出主线程, 慢手机上不会一卡几百毫秒.
if (root.firstElementChild) startTransition(() => { hydrateRoot(root, <App />); });
else createRoot(root).render(<App />);
