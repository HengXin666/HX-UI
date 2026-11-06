import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FaceApp } from "./FaceApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FaceApp />
  </StrictMode>,
);
