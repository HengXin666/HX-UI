"use client";

import * as React from "react";
import { BLOCK_ALIGN } from "../../constants/blocks";
import { MV102_CLASS, MV102_DEFAULT, MV102_SLOT, NEWSLETTER_CLASS, NEWSLETTER_STATUS, NEWSLETTER_VARIANT } from "../../constants/blocks-marketing-v102";
import { Button } from "../../primitives/button";
import { Input } from "../../primitives/input";
import { cn } from "../../primitives/utils";
import { Display } from "../../typography/Display";
import { Lead } from "../../typography/Lead";
import { BlockShell } from "../_shared/BlockShell";
import { useBlockLabels } from "../_shared/BlocksProvider";
import type { BlockBaseProps, BlockTitleSize, HeadingLevel, Rich } from "../_shared/types";
import { resolveBackdrop } from "./parts";

type ValueOf<T> = T[keyof T];
export type NewsletterStatus = ValueOf<typeof NEWSLETTER_STATUS>;
export type NewsletterVariant = ValueOf<typeof NEWSLETTER_VARIANT>;

export interface NewsletterProps extends BlockBaseProps {
  title: Rich;
  lead?: Rich;
  /** 输入框占位. */
  placeholder: string;
  /** 输入框的可访问名称 (视觉隐藏的 label). 缺省用 placeholder. */
  emailLabel?: string;
  submitLabel: Rich;
  /** 提交中按钮文案; 缺省用 labels.loading. */
  submittingLabel?: Rich;
  /** 成功 / 失败 / 格式错误的提示 (进 live region). */
  successMessage: Rich;
  errorMessage: Rich;
  invalidMessage?: Rich;
  /** 抛错即进入 error 态. */
  onSubmit: (email: string) => Promise<void>;
  /** 隐私说明行 ("订阅即同意 <a>隐私政策</a>"). */
  consent?: Rich;
  /** inline 文案与表单同行 (宽容器) / card 卡片. 默认 inline. */
  variant?: NewsletterVariant;
  /** 受控状态 (调用方自管时传); 不传时内部状态机管理. */
  status?: NewsletterStatus;
  onStatusChange?: (status: NewsletterStatus) => void;
  /** 成功后清空输入. 默认 true. */
  resetOnSuccess?: boolean;
  titleSize?: BlockTitleSize;
  titleLevel?: HeadingLevel;
}

const TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter: 邮件订阅 / 等候名单. 状态机 idle -> submitting -> success | error;
 * 提示写进 role="status" aria-live="polite" 的 live region, 错误时输入框 aria-invalid 并经 aria-describedby 关联.
 * 提交中禁用按钮并标 aria-busy. 文案全部来自 props, 仅 "加载中" 兜底取 BlocksProvider labels.
 */
export function Newsletter({
  title,
  lead,
  placeholder,
  emailLabel,
  submitLabel,
  submittingLabel,
  successMessage,
  errorMessage,
  invalidMessage,
  onSubmit,
  consent,
  variant = MV102_DEFAULT.newsletterVariant,
  status: controlled,
  onStatusChange,
  resetOnSuccess = true,
  titleSize = MV102_DEFAULT.newsletterTitleSize,
  titleLevel = 2,
  backdrop,
  align = BLOCK_ALIGN.start,
  labels: overrides,
  ...shell
}: NewsletterProps): React.JSX.Element {
  const labels = { ...useBlockLabels(), ...overrides };
  const ids = React.useId();
  const titleId = `${ids}-title`;
  const inputId = `${ids}-email`;
  const statusId = `${ids}-status`;
  const consentId = `${ids}-consent`;
  const [internal, setInternal] = React.useState<NewsletterStatus>(NEWSLETTER_STATUS.idle);
  const [invalid, setInvalid] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const status = controlled ?? internal;

  const setStatus = (next: NewsletterStatus): void => {
    setInternal(next);
    onStatusChange?.(next);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (status === NEWSLETTER_STATUS.submitting) return;
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setInvalid(true);
      setStatus(NEWSLETTER_STATUS.error);
      return;
    }
    setInvalid(false);
    setStatus(NEWSLETTER_STATUS.submitting);
    try {
      await onSubmit(value);
      setStatus(NEWSLETTER_STATUS.success);
      if (resetOnSuccess) setEmail("");
    } catch {
      setStatus(NEWSLETTER_STATUS.error);
    }
  };

  const submitting = status === NEWSLETTER_STATUS.submitting;
  const isError = status === NEWSLETTER_STATUS.error;
  let message: Rich = null;
  if (status === NEWSLETTER_STATUS.success) message = successMessage;
  else if (isError) message = invalid && invalidMessage !== undefined ? invalidMessage : errorMessage;
  else if (submitting) message = submittingLabel ?? labels.loading;
  const describedBy = [statusId, consent !== undefined ? consentId : undefined].filter(Boolean).join(" ");
  const centered = align === BLOCK_ALIGN.center;

  const text = (
    <div className={cn(NEWSLETTER_CLASS.layout, centered && MV102_CLASS.itemsCenter)}>
      <Display as={TAG[titleLevel]} id={titleId} size={titleSize}>
        {title}
      </Display>
      {lead !== undefined && <Lead measure="default">{lead}</Lead>}
    </div>
  );
  const form = (
    <div className={NEWSLETTER_CLASS.formWrap}>
      <form data-slot={MV102_SLOT.newsletterForm} className={NEWSLETTER_CLASS.form} onSubmit={handleSubmit} noValidate aria-busy={submitting || undefined}>
        <label htmlFor={inputId} className={MV102_CLASS.srOnly}>
          {emailLabel ?? placeholder}
        </label>
        <Input
          id={inputId}
          type={MV102_DEFAULT.inputType}
          name={MV102_DEFAULT.inputName}
          autoComplete={MV102_DEFAULT.inputAutoComplete}
          required
          value={email}
          placeholder={placeholder}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={(isError && invalid) || undefined}
          aria-describedby={describedBy}
          disabled={submitting}
          className={NEWSLETTER_CLASS.input}
        />
        <Button type={MV102_DEFAULT.submitType} disabled={submitting} className={NEWSLETTER_CLASS.button}>
          {submitting ? (submittingLabel ?? labels.loading) : submitLabel}
        </Button>
      </form>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        data-slot={MV102_SLOT.newsletterStatus}
        data-status={status}
        className={cn(NEWSLETTER_CLASS.status, status === NEWSLETTER_STATUS.success && NEWSLETTER_CLASS.statusSuccess, isError && NEWSLETTER_CLASS.statusError)}
      >
        {message}
      </p>
      {consent !== undefined && (
        <p id={consentId} data-slot={MV102_SLOT.newsletterConsent} className={NEWSLETTER_CLASS.consent}>
          {consent}
        </p>
      )}
    </div>
  );

  return (
    <BlockShell
      {...shell}
      align={align}
      backdrop={resolveBackdrop(backdrop)}
      aria-labelledby={shell["aria-labelledby"] ?? (shell["aria-label"] ? undefined : titleId)}
    >
      <div
        data-slot={MV102_SLOT.newsletter}
        data-variant={variant}
        data-status={status}
        className={cn(
          NEWSLETTER_CLASS.layout,
          variant === NEWSLETTER_VARIANT.card && NEWSLETTER_CLASS.card,
          variant === NEWSLETTER_VARIANT.inline && !centered && NEWSLETTER_CLASS.layoutSplit,
          centered && MV102_CLASS.itemsCenter,
        )}
      >
        {text}
        {form}
      </div>
    </BlockShell>
  );
}
