import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FaceApp } from "./FaceApp";
import "./styles.css";

// 初始明暗只由 index.html 的 FOUC 脚本决定 (没选过时为「跟随系统」), 这里不写存储键也不改 data-mode:
// 写死暗色会让主题三态从「暗色」起步, 跟随系统档位永远到不了首屏 (check-shell 主题三态).
const root = document.documentElement;
// 门面暗色皮肤 (skin/face.css) 的开关.
root.setAttribute("data-face", "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FaceApp />
  </StrictMode>,
);
