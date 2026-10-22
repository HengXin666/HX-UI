import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
// markstream 的样式表不会自动注入: 不引它, 流式 Markdown 的代码块与表格就是裸 DOM.
import "markstream-react/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
