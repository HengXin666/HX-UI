"use client";

import type { HTMLAttributes, JSX, Ref } from "react";

/**
 * 菜单条目壳: 给了 href 渲染成链接, 否则是 type=button 的按钮. 两者共用同一组属性.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export type LinkOrButtonProps = HTMLAttributes<HTMLElement> & {
  readonly href?: string;
  readonly nodeRef?: Ref<HTMLElement>;
};

export function LinkOrButton({ href, nodeRef, ...rest }: LinkOrButtonProps): JSX.Element {
  if (href) return <a ref={nodeRef as Ref<HTMLAnchorElement>} href={href} {...rest} />;
  return <button ref={nodeRef as Ref<HTMLButtonElement>} type="button" {...rest} />;
}
