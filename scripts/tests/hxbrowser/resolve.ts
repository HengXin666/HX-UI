/**
 * resolve 钩子: 相对导入解析失败时依次补 .ts 与 /index.ts 再试.
 */

import { DOT } from "../../constants/quality.ts";

type Next = (specifier: string, context: unknown) => Promise<{ url: string }>;

const CANDIDATES = [".ts", "/index.ts"];

/**
 * Node 模块解析钩子, 只处理以点开头的相对导入.
 *
 * .agents/notes/implemented/feature/2026-10-17-hx-browser-live-view.md
 */
export async function resolve(specifier: string, context: unknown, next: Next): Promise<{ url: string }> {
    try {
        return await next(specifier, context);
    } catch (error) {
        if (!specifier.startsWith(DOT)) {
            throw error;
        }
        for (const suffix of CANDIDATES) {
            try {
                return await next(specifier + suffix, context);
            } catch {
                continue;
            }
        }
        throw error;
    }
}
