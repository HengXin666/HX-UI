"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"
import { Spin } from "@/components/ui/spin"

export interface ConfirmDialogProps {
  /** 打开对话框的按钮 (asChild) */
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** destructive: 删除这类不可撤销的操作, 主按钮变红 */
  tone?: "default" | "destructive"
  /** 要求输入这段文字才能确认, 如项目名; 防手滑 */
  confirmText?: string
  /** 可以返回 Promise: 期间按钮转圈, 不能关; 抛错则留在对话框里显示错误 */
  onConfirm: () => void | Promise<unknown>
}

/** 确认对话框: 二次确认, 异步提交, 输入名称确认, 失败重试都内置. */
function ConfirmDialog({ trigger, open: openProp, onOpenChange, title, description, confirmLabel = "确认", cancelLabel = "取消", tone = "default", confirmText, onConfirm }: ConfirmDialogProps) {
  const [inner, setInner] = React.useState(false)
  const open = openProp ?? inner
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()
  const [typed, setTyped] = React.useState("")
  const setOpen = (v: boolean) => {
    if (pending) return
    if (!v) { setError(undefined); setTyped("") }
    setInner(v)
    onOpenChange?.(v)
  }
  const blocked = confirmText != null && typed.trim() !== confirmText
  const run = async () => {
    setError(undefined)
    setPending(true)
    try {
      await onConfirm()
      setPending(false)
      setInner(false); onOpenChange?.(false); setTyped("")
    } catch (e) {
      setPending(false)
      setError(e instanceof Error ? e.message : "操作失败，请重试。")
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent role="alertdialog" showCloseButton={false} onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {confirmText != null && (
          <Field label={<>输入 <span className="font-mono">{confirmText}</span> 以确认</>}>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} disabled={pending} onKeyDown={(e) => { if (e.key === "Enter" && !blocked && !pending) run() }} />
          </Field>
        )}
        <p aria-live="assertive" className="text-sm text-destructive empty:hidden">{error}</p>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={pending}>{cancelLabel}</Button></DialogClose>
          <Button variant={tone === "destructive" ? "destructive" : "default"} disabled={blocked || pending} aria-busy={pending || undefined} onClick={run}>
            {pending && <Spin size="sm" variant="ring2" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
