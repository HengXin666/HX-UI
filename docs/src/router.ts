import { useEffect, useState } from "react";
import { DOCS } from "./nav";

/**
 * 极简 hash 路由。
 *
 * 为什么是 hash 而不是 history API:
 *   文档站的产物是纯静态文件, 可能被丢到任何静态托管 (对象存储 / 内网 nginx / file://)。
 *   history 路由需要服务端把未知路径全部重写到 index.html, 少一处配置就 404;
 *   hash 路由不依赖服务端, 打开就能用。
 *
 * 代价是 URL 里有个 #。对组件文档来说这个代价可以接受 —— 分享出去的链接依然精准。
 *
 * 三条必须成立的行为:
 *   1. 每个页面有自己的 URL, 能分享、能收藏
 *   2. 浏览器前进/后退键可用
 *   3. 刷新后停在原来那一页
 *   它们都由「把 URL 当唯一状态源」自然得到 —— 组件里不再存 currentPage。
 */

/** 默认页。URL 里没有 #/xxx 时显示它。 */
export const DEFAULT_PAGE = "install";

/** 从当前 URL 解析页面 id。不认识的 id 退回默认页, 避免白屏。 */
export function readPageFromUrl(): string {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (!raw) return DEFAULT_PAGE;
  // 只取第一段: 允许 #/button/anything 这类未来可能的子路径
  const id = raw.split("/")[0];
  return DOCS.some((d) => d.id === id) ? id : DEFAULT_PAGE;
}

/** 把页面 id 写进 URL。用 replace 时不会污染后退栈 (用于纠正非法 id)。 */
export function writePageToUrl(id: string, replace = false): void {
  const target = `#/${id}`;
  if (window.location.hash === target) return;
  if (replace) {
    window.history.replaceState(null, "", target);
  } else {
    window.location.hash = target;
  }
}

/**
 * 订阅地址变化。返回当前页面 id 与一个跳转函数。
 *
 * 只监听 hashchange —— 所有跳转都走 location.hash, 因此这一个事件就够。
 * 同时订阅 popstate 是多余的, 反而会触发两次渲染。
 */
export function useHashRoute(): [string, (id: string) => void] {
  const [page, setPage] = useState(readPageFromUrl);

  useEffect(() => {
    const sync = (): void => {
      const id = readPageFromUrl();
      setPage(id);
      /*
       * 每次地址变化都回写一次: 非法 id 会被纠正成默认页。
       * 只在挂载时纠正是不够的 —— 站内跳转不触发重新挂载, 用户手输一个错 id 后
       * 内容会退回默认页而地址栏仍留着错的, URL 就在撒谎。
       * 用 replace 而不是 push: 纠正不该占用后退栈。
       */
      writePageToUrl(id, true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    // 直接改地址栏 (用户手输) 时也同步
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const navigate = (id: string): void => {
    writePageToUrl(id);
    // hashchange 会在下一帧触发; 这里不预先 setPage, 避免双渲染
  };

  return [page, navigate];
}
