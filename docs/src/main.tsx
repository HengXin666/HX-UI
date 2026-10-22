import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
// markstream 的样式表由库的样式入口 (src/styles.css) 统一引入一次: 在这里再引会让
// 它排在库的覆盖规则之后, 同特异度下把我们的表格边框与代码块配色顶掉.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
