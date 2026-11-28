import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@/styles/globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { MotionProvider } from "@/motion/provider";
import { App } from "./app";
import { LazyToaster } from "./lazy-toaster";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultMode="dark" storageKey="hx-docs-theme">
      <MotionProvider>
        <App />
        <LazyToaster />
      </MotionProvider>
    </ThemeProvider>
  </StrictMode>,
);
