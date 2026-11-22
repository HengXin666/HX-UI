import { renderToString } from "react-dom/server";
import { App } from "./app";
export { meta } from "@site-page";

export const render = () => renderToString(<App />);
