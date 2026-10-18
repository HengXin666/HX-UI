"use client";

import * as React from "react";
import { Slot } from "radix-ui";
import {
	Controller,
	FormProvider,
	useFormContext,
	useFormState,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { Label } from "./label";
import { cn } from "./utils";
import { UI_CLASSES } from "../constants";

/**
 * 表单 (react-hook-form 绑定, 对标 shadcn Form).
 *
 * Form 就是 FormProvider; FormField 是 Controller 加一层上下文, 让 FormLabel /
 * FormControl / FormDescription / FormMessage 自动拿到同一个字段的 id 与错误,
 * 不需要调用方手写 htmlFor / aria-describedby / aria-invalid.
 * 校验库不绑定: zod / valibot / yup 都通过 @hookform/resolvers 接入 useForm.
 */
const Form = FormProvider;

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
	name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function FormField<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>(
	props: ControllerProps<TFieldValues, TName>,
): React.JSX.Element {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
}

/** messageShown: FormMessage 实际渲染时登记, FormControl 据此把消息 id 加进 aria-describedby. */
type FormItemContextValue = { id: string; messageShown: boolean; setMessageShown: (shown: boolean) => void };

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

/**
 * 读当前字段的状态与派生 id. 必须在 FormField 与 FormItem 之内调用.
 */
function useFormField(): {
	id: string;
	name: string;
	formItemId: string;
	formDescriptionId: string;
	formMessageId: string;
	messageShown: boolean;
	setMessageShown: (shown: boolean) => void;
	invalid: boolean;
	isDirty: boolean;
	isTouched: boolean;
	error?: { message?: string };
} {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState } = useFormContext();
	const formState = useFormState({ name: fieldContext?.name });
	if (!fieldContext || !itemContext) {
		throw new Error("useFormField 必须在 <FormField> 与 <FormItem> 内使用");
	}
	const fieldState = getFieldState(fieldContext.name, formState);
	const { id, messageShown, setMessageShown } = itemContext;
	return {
		id,
		messageShown,
		setMessageShown,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
}

function FormItem({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	const id = React.useId();
	const [messageShown, setMessageShown] = React.useState(false);
	const value = React.useMemo(() => ({ id, messageShown, setMessageShown }), [id, messageShown]);
	return (
		<FormItemContext.Provider value={value}>
			<div data-slot="form-item" className={cn(UI_CLASSES.grid, className)} {...props} />
		</FormItemContext.Provider>
	);
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>): React.JSX.Element {
	const { error, formItemId } = useFormField();
	return (
		<Label
			data-slot="form-label"
			data-error={!!error}
			className={cn("transition-colors duration-(--duration-fast) data-[error=true]:text-danger-fg", className)}
			htmlFor={formItemId}
			{...props}
		/>
	);
}

/** 把 id / aria-describedby / aria-invalid 写到唯一子控件上. */
function FormControl(props: React.ComponentProps<typeof Slot.Root>): React.JSX.Element {
	const { error, formItemId, formDescriptionId, formMessageId, messageShown } = useFormField();
	return (
		<Slot.Root
			data-slot="form-control"
			id={formItemId}
			aria-describedby={error || messageShown ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
			aria-invalid={!!error}
			{...props}
		/>
	);
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">): React.JSX.Element {
	const { formDescriptionId } = useFormField();
	return <p data-slot="form-description" id={formDescriptionId} className={cn(UI_CLASSES.mutedHalf, className)} {...props} />;
}

/** 字段错误; 没有错误时显示 children (可作为默认提示), 都没有时不渲染. */
function FormMessage({ className, children, ...props }: React.ComponentProps<"p">): React.JSX.Element | null {
	const { error, formMessageId, setMessageShown } = useFormField();
	const body = error ? String(error.message ?? "") : children;
	const shown = Boolean(body);
	React.useLayoutEffect(() => {
		setMessageShown(shown);
		return () => setMessageShown(false);
	}, [shown, setMessageShown]);
	if (!body) {
		return null;
	}
	return (
		<p
			data-slot="form-message"
			id={formMessageId}
			className={cn("text-[12.5px] text-danger-fg animate-in fade-in-0 slide-in-from-top-1 duration-(--duration-fast)", className)}
			{...props}
		>
			{body}
		</p>
	);
}

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField };
