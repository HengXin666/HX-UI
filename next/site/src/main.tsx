import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@/styles/globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { MotionProvider } from "@/motion/provider";
import { App } from "./app";
import { LazyToaster } from "./lazy-toaster";

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
