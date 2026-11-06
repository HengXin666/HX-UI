import { useMemo, type JSX } from "react";
import {
  BlocksSiteFooter,
  BlocksSiteHeader,
  CheckoutSteps,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Grid,
  Input,
  ORIENTATION,
  RadioGroup,
  RadioGroupItem,
  type BlockRegistry,
  type CheckoutStepData,
  type CheckoutStepsProps,
  type SiteFooterBlockProps,
  type SiteHeaderBlockProps,
} from "@hx/ui";
import { blockFactory } from "../page-commerce-home/compose";
import { CHECKOUT_FOOTER } from "../page-commerce-home/site-data";
import { TemplateShell } from "../page-commerce-home/TemplateShell";
import { CHECKOUT_HEADER, CHECKOUT_STEPS, CHECKOUT_SUMMARY, type CheckoutField, type CheckoutStepMeta } from "./checkout-data";

interface CheckoutBlockProps {
  SiteHeader: SiteHeaderBlockProps;
  CheckoutSteps: CheckoutStepsProps;
  SiteFooter: SiteFooterBlockProps;
}

export const CHECKOUT_REGISTRY = {
  SiteHeader: BlocksSiteHeader,
  CheckoutSteps,
  SiteFooter: BlocksSiteFooter,
} satisfies BlockRegistry & Record<keyof CheckoutBlockProps, unknown>;

const block = blockFactory<CheckoutBlockProps>();

function TextField({ step, field }: { step: string; field: CheckoutField }): JSX.Element {
  const id = `${step}-${field.name}`;
  return (
    <Field>
      <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
      <Input id={id} name={field.name} type={field.type ?? "text"} autoComplete={field.autoComplete} placeholder={field.placeholder} />
    </Field>
  );
}

/** 连续的窄字段两列排, wide 字段独占一行; 只用 Grid 的列数档, 不写类名. */
function FieldsForm({ step, fields }: { step: string; fields: CheckoutField[] }): JSX.Element {
  const rows: CheckoutField[][] = [];
  for (const field of fields) {
    const last = rows[rows.length - 1];
    if (!field.wide && last && !last[0].wide && last.length < 2) last.push(field);
    else rows.push([field]);
  }
  return (
    <FieldGroup>
      {rows.map((row) => (
        <Grid key={row[0].name} cols={{ base: 1, md: row.length }} gap="md">
          {row.map((field) => (
            <TextField key={field.name} step={step} field={field} />
          ))}
        </Grid>
      ))}
    </FieldGroup>
  );
}

function ChoiceForm({ step, choices }: { step: string; choices: NonNullable<CheckoutStepMeta["choices"]> }): JSX.Element {
  return (
    <FieldSet>
      <FieldLegend>{choices.legend}</FieldLegend>
      <RadioGroup name={choices.name} defaultValue={choices.defaultValue}>
        {choices.options.map((option) => {
          const id = `${step}-${option.value}`;
          return (
            <Field key={option.value} orientation={ORIENTATION.horizontal}>
              <RadioGroupItem id={id} value={option.value} />
              <FieldContent>
                <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
                <FieldDescription>{option.description}</FieldDescription>
              </FieldContent>
            </Field>
          );
        })}
      </RadioGroup>
    </FieldSet>
  );
}

function ReviewList({ items }: { items: NonNullable<CheckoutStepMeta["review"]> }): JSX.Element {
  return (
    <FieldGroup>
      {items.map((item) => (
        <Field key={item.label}>
          <FieldTitle>{item.label}</FieldTitle>
          <FieldDescription>{item.value}</FieldDescription>
        </Field>
      ))}
    </FieldGroup>
  );
}

/** 步骤描述 -> CheckoutSteps 需要的步骤 (content 按描述渲染表单). */
function toStep(meta: CheckoutStepMeta): CheckoutStepData {
  let content: JSX.Element | null = null;
  if (meta.fields) content = <FieldsForm step={meta.key} fields={meta.fields} />;
  else if (meta.choices) content = <ChoiceForm step={meta.key} choices={meta.choices} />;
  else if (meta.review) content = <ReviewList items={meta.review} />;
  return { key: meta.key, title: meta.title, description: meta.description, nextLabel: meta.nextLabel, content };
}

/**
 * 多步结账页模板: SiteHeader(精简) -> CheckoutSteps(地址 / 配送 / 支付 / 确认 + 只读 CartSummary 摘要) -> SiteFooter(法务).
 * 只组合区块 + 数据, 表单用 Field / Input / RadioGroup 原语, 零自定义类名. 皮肤 default / retail / mono 切换.
 */
export function CheckoutPage(): JSX.Element {
  const blocks = useMemo(
    () => [
      block("SiteHeader", "header", CHECKOUT_HEADER),
      block("CheckoutSteps", "checkout", {
        headingLevel: 1,
        clickable: "done",
        steps: CHECKOUT_STEPS.map(toStep),
        summary: CHECKOUT_SUMMARY,
        submit: CHECKOUT_SUMMARY.checkout,
      }),
      block("SiteFooter", "footer", CHECKOUT_FOOTER),
    ],
    [],
  );
  return <TemplateShell blocks={blocks} registry={CHECKOUT_REGISTRY} />;
}
