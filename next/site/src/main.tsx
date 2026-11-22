import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@/styles/globals.css";
import { ThemeProvider, themeScript } from "@/hooks/use-theme";
import { MotionProvider } from "@/motion/provider";
import { App } from "./app";
import { LazyToaster } from "./lazy-toaster";

// 首屏防闪烁 (正式站点请把 themeScript 内联进 index.html 的 <head>)
new Function(themeScript)();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <MotionProvider>
        <App />
        <LazyToaster />
      </MotionProvider>
    </ThemeProvider>
  </StrictMode>,
);
