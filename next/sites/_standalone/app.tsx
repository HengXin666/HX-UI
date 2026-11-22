import { ThemeProvider } from "@/hooks/use-theme";
import { MotionProvider } from "@/motion/provider";
import Page from "@site-page";

/** 单独构建一套成品时的根组件: 主题 + 动效两个 Provider, 再放页面. */
export function App() {
  return (
    <ThemeProvider>
      <MotionProvider>
        <Page />
      </MotionProvider>
    </ThemeProvider>
  );
}
