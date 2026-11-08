import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FaceApp } from "./FaceApp";
import "./styles.css";

/** 主题键的存储名, 与 ThemeToggle 同一个键. 没选过主题时门面默认暗色. */
const THEME_KEY = "hx-ui-docs-theme";
const root = document.documentElement;
if (!localStorage.getItem(THEME_KEY)) {
  localStorage.setItem(THEME_KEY, "dark");
  root.setAttribute("data-mode", "dark");
}
// 门面暗色皮肤 (skin/face.css) 的开关.
root.setAttribute("data-face", "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FaceApp />
  </StrictMode>,
);
