"use client";

import * as React from "react";
import { CTA_BUTTON_SIZE, CTA_BUTTON_VARIANT } from "../../../constants/blocks";
import { SITE_BLOCK_CLASS, SITE_BLOCK_FORM_STATE, SITE_BLOCK_INPUT_TYPE, SITE_BLOCK_SLOT, SITE_BLOCK_STATUS_CLASS } from "../../../constants/blocks-site-v101";
import { SITE_CLASSES, SITE_OVERLAY_MODE } from "../../../constants/site";
import { Button } from "../../../primitives/button";
import { Input } from "../../../primitives/input";
import { cn } from "../../../primitives/utils";
import { LocaleSwitcher } from "../../../site/overlay/LocaleSwitcher";
import { ThemeSwitcher } from "../../../site/theme/ThemeSwitcher";
import type { Media } from "../../_shared/types";
import type { SiteFooterBlockProps, SiteNewsletter } from "./types";

type FormState = (typeof SITE_BLOCK_FORM_STATE)[keyof typeof SITE_BLOCK_FORM_STATE];

/**
 * 页脚订阅表单: 有 label 的邮箱输入 + 提交; onSubmit 进行中 aria-busy, 结果以 role=status 播报.
 * 不给 onSubmit 时表单按原生提交 (调用方可在外层 form action 接管).
 */
export function FooterNewsletter({ newsletter }: { newsletter: SiteNewsletter }): React.JSX.Element {
  const [state, setState] = React.useState<FormState>(SITE_BLOCK_FORM_STATE.idle);
  const inputId = React.useId();
  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    if (!newsletter.onSubmit) return;
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get(SITE_BLOCK_INPUT_TYPE.email) ?? "");
    setState(SITE_BLOCK_FORM_STATE.pending);
    try {
      await newsletter.onSubmit(email);
      setState(SITE_BLOCK_FORM_STATE.success);
    } catch {
      setState(SITE_BLOCK_FORM_STATE.error);
    }
  };
  const pending = state === SITE_BLOCK_FORM_STATE.pending;
  const message = state === SITE_BLOCK_FORM_STATE.success ? newsletter.successMessage : state === SITE_BLOCK_FORM_STATE.error ? newsletter.errorMessage : undefined;
  return (
    <form data-slot={SITE_BLOCK_SLOT.newsletter} data-state={state} aria-busy={pending || undefined} onSubmit={submit} className={SITE_BLOCK_CLASS.stack}>
      {newsletter.title !== undefined ? <p data-slot={SITE_BLOCK_SLOT.newsletterTitle} className={SITE_BLOCK_CLASS.title}>{newsletter.title}</p> : null}
      {newsletter.lead !== undefined ? <p data-slot={SITE_BLOCK_SLOT.newsletterLead} className={SITE_BLOCK_CLASS.muted}>{newsletter.lead}</p> : null}
      <div data-slot={SITE_BLOCK_SLOT.newsletterRow} className={SITE_BLOCK_CLASS.formRow}>
        <label htmlFor={inputId} className="sr-only">
          {newsletter.inputLabel}
        </label>
        <Input id={inputId} name={SITE_BLOCK_INPUT_TYPE.email} type={SITE_BLOCK_INPUT_TYPE.email} required autoComplete={SITE_BLOCK_INPUT_TYPE.email} placeholder={newsletter.placeholder} data-slot={SITE_BLOCK_SLOT.newsletterInput} />
        <Button type={SITE_BLOCK_INPUT_TYPE.submit} variant={CTA_BUTTON_VARIANT.primary} size={CTA_BUTTON_SIZE.md} disabled={pending} data-slot={SITE_BLOCK_SLOT.newsletterSubmit}>
          {newsletter.submitLabel}
        </Button>
      </div>
      {newsletter.consent !== undefined ? <p data-slot={SITE_BLOCK_SLOT.newsletterConsent} className={SITE_CLASSES.description}>{newsletter.consent}</p> : null}
      <p role="status" data-slot={SITE_BLOCK_SLOT.newsletterMessage} className={SITE_BLOCK_CLASS.muted}>
        {message}
      </p>
    </form>
  );
}

/** 认证徽章 (SOC2, ISO): 有 alt 的图, 装饰图传空 alt. */
export function FooterBadges({ badges }: { badges?: Media[] }): React.JSX.Element | null {
  if (!badges?.length) return null;
  return (
    <ul data-slot={SITE_BLOCK_SLOT.footerBadges} className={SITE_BLOCK_CLASS.badges}>
      {badges.map((badge, index) => (
        <li key={index}>
          {badge.src ? (
            <img data-slot={SITE_BLOCK_SLOT.footerBadge} src={badge.src} alt={badge.alt} width={badge.width} height={badge.height} loading="lazy" decoding="async" className={SITE_BLOCK_CLASS.badge} />
          ) : (
            badge.node
          )}
        </li>
      ))}
    </ul>
  );
}

/** 底部右侧附加项: 运行状态链接, 主题切换, 语言选择 (页脚默认 dialog 形态). */
export function FooterEnd({ status, themeSwitch, locale }: Pick<SiteFooterBlockProps, "status" | "themeSwitch" | "locale">): React.JSX.Element | null {
  if (!status && !themeSwitch && !locale) return null;
  return (
    <div data-slot={SITE_BLOCK_SLOT.footerEnd} className={SITE_BLOCK_CLASS.actions}>
      {status ? (
        <a href={status.href} data-slot={SITE_BLOCK_SLOT.footerStatus} data-state={status.state} className={cn(SITE_CLASSES.link, "inline-flex items-center gap-2 rounded-(--radius-sm)", SITE_CLASSES.focus)}>
          <span aria-hidden data-slot={SITE_BLOCK_SLOT.footerStatusDot} className={cn(SITE_BLOCK_CLASS.dot, SITE_BLOCK_STATUS_CLASS[status.state])} />
          {status.label}
        </a>
      ) : null}
      {themeSwitch ? <ThemeSwitcher labels={themeSwitch} /> : null}
      {locale ? <LocaleSwitcher mode={SITE_OVERLAY_MODE.dialog} {...locale} /> : null}
    </div>
  );
}
