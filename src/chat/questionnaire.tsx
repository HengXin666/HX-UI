"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckIcon } from "lucide-react";
import { Button } from "../primitives/button";
import { Progress } from "../primitives/progress";
import { Textarea } from "../primitives/textarea";
import { cn } from "../primitives/utils";
import { BUTTON_TYPE, PERCENT, QUESTION_TYPE, ROLE, SLIDE_STATE, STEP_BACK, UI_CLASSES, UI_NUMBERS, VARIANT, isString } from "../constants";

/** 选项. */
interface QuestionnaireChoice {
	value: string;
	label: React.ReactNode;
	description?: React.ReactNode;
}

/** 一道题: single 单选, multiple 多选, freeform 自由文本. skippable 时可跳过. */
interface QuestionnaireQuestion {
	id: string;
	title: React.ReactNode;
	description?: React.ReactNode;
	type: "single" | "multiple" | "freeform";
	choices?: readonly QuestionnaireChoice[];
	skippable?: boolean;
	placeholder?: string;
}

/** 答案: 单选是 string, 多选是 string[], 跳过的题不在里面. */
type QuestionnaireAnswers = Record<string, string | string[]>;

interface QuestionnaireLabels {
	previous: string;
	next: string;
	skip: string;
	submit: string;
	progress: (current: number, total: number) => string;
}

/** 切题动画: 入场与退场都读 AnimatePresence 传入的 custom (当前位移), 退场方向随最新一次切题. */
const SLIDE_VARIANTS = {
	[SLIDE_STATE.enter]: (offset: number) => ({ opacity: 0, x: offset }),
	[SLIDE_STATE.center]: { opacity: 1, x: 0 },
	[SLIDE_STATE.exit]: (offset: number) => ({ opacity: 0, x: -offset }),
};

const DEFAULT_LABELS: QuestionnaireLabels = {
	previous: "上一步",
	next: "下一步",
	skip: "跳过",
	submit: "提交",
	progress: (current, total) => `${current} / ${total}`,
};


/**
 * 多步问卷 (对标 shadcn Questionnaire).
 *
 * 一次一题, 顶部进度条; 单选点选即前进 (最后一题只选中, 由 "提交" 按钮提交), 多选与文本题按 "下一步" 前进, skippable 的题可跳过.
 * 切题时按方向左右滑入 (motion), 系统要求减弱动效时只淡入淡出.
 * 最后一题提交时调用一次 onSubmit(answers), 提交后不再响应选择与提交, 自由文本输入框同时禁用.
 * 数字键 1 到 9 选择对应选项.
 */
function Questionnaire({
	questions,
	defaultAnswers,
	onSubmit,
	labels: labelsProp,
	className,
}: {
	questions: readonly QuestionnaireQuestion[];
	defaultAnswers?: QuestionnaireAnswers;
	onSubmit?: (answers: QuestionnaireAnswers) => void;
	labels?: Partial<QuestionnaireLabels>;
	className?: string;
}): React.JSX.Element {
	const labels = { ...DEFAULT_LABELS, ...labelsProp };
	const reduced = useReducedMotion();
	const [index, setIndex] = React.useState(0);
	const [direction, setDirection] = React.useState(1);
	const [answers, setAnswers] = React.useState<QuestionnaireAnswers>(defaultAnswers ?? {});
	const [submitted, setSubmitted] = React.useState(false);
	/** 同一帧内的连续点击还看不到新 state, 用 ref 保证 onSubmit 只调用一次. */
	const submittedRef = React.useRef(false);
	const question = questions[index];
	const last = index === questions.length - 1;
	const answer = question ? answers[question.id] : undefined;
	const answered = Array.isArray(answer) ? answer.length > 0 : Boolean(answer && answer.trim());

	const go = (step: number, next: QuestionnaireAnswers = answers): void => {
		if (submittedRef.current) {
			return;
		}
		if (step > 0 && last) {
			submittedRef.current = true;
			setSubmitted(true);
			onSubmit?.(next);
			return;
		}
		setDirection(step);
		setIndex((value) => Math.min(questions.length - 1, Math.max(0, value + step)));
	};

	const choose = (value: string): void => {
		if (submitted || !question) {
			return;
		}
		if (question.type === "multiple") {
			const list = Array.isArray(answer) ? answer : [];
			setAnswers({ ...answers, [question.id]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] });
			return;
		}
		const next = { ...answers, [question.id]: value };
		setAnswers(next);
		if (!last) {
			go(1, next);
		}
	};

	const skip = (): void => {
		if (submitted || !question) {
			return;
		}
		const next = { ...answers };
		delete next[question.id];
		setAnswers(next);
		go(1, next);
	};

	const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
		const choice = question?.choices?.[Number(event.key) - 1];
		if (choice && question?.type !== "freeform" && !(event.target instanceof HTMLTextAreaElement)) {
			event.preventDefault();
			choose(choice.value);
		}
	};

	if (!question) {
		return <div data-slot="questionnaire" className={className} />;
	}
	const offset = reduced ? 0 : UI_NUMBERS.slideOffset * direction;
	const single = question.type === QUESTION_TYPE.single;

	return (
		<div data-slot="questionnaire" onKeyDown={onKeyDown} className={cn("flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-4", className)}>
			<div className="flex items-center gap-3">
				<Progress value={((index + 1) / questions.length) * PERCENT} className="flex-1" />
				<span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{labels.progress(index + 1, questions.length)}</span>
			</div>
			<AnimatePresence mode="wait" initial={false} custom={offset}>
				<motion.div
					key={question.id}
					custom={offset}
					variants={SLIDE_VARIANTS}
					initial={SLIDE_STATE.enter}
					animate={SLIDE_STATE.center}
					exit={SLIDE_STATE.exit}
					transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0, 0, 1] }}
					className="flex flex-col gap-3"
				>
					<div className="flex flex-col gap-1">
						<div data-slot="questionnaire-title" className="text-[15px] font-medium text-heading">{question.title}</div>
						{question.description && <div className={UI_CLASSES.mutedHalf}>{question.description}</div>}
					</div>
					{question.type === "freeform" ? (
						<Textarea
							value={isString(answer) ? answer : ""}
							placeholder={question.placeholder}
							disabled={submitted}
							onChange={(event) => {
								if (submitted) {
									return;
								}
								setAnswers({ ...answers, [question.id]: event.target.value });
							}}
						/>
					) : (
						<div role={single ? ROLE.radiogroup : ROLE.group} className="flex flex-col gap-2">
							{question.choices?.map((choice, position) => {
								const selected = Array.isArray(answer) ? answer.includes(choice.value) : answer === choice.value;
								return (
									<button
										key={choice.value}
										type={BUTTON_TYPE}
										role={single ? ROLE.radio : ROLE.checkbox}
										aria-checked={selected}
										data-selected={selected}
										onClick={() => choose(choice.value)}
										className={cn(
											"flex items-start gap-2.5 rounded-lg border border-border px-3 py-2 text-left text-[13px] outline-none",
											"transition-[border-color,background-color] duration-(--duration-fast) hover:bg-accent/50 focus-visible:border-ring",
											"data-[selected=true]:border-primary data-[selected=true]:bg-primary/10",
										)}
									>
										<span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-border font-mono text-[10px] text-muted-foreground">
											{selected ? <CheckIcon className="size-3 text-link" /> : position + 1}
										</span>
										<span className="flex min-w-0 flex-col">
											<span className={UI_CLASSES.strong}>{choice.label}</span>
											{choice.description && <span className={UI_CLASSES.mutedSm}>{choice.description}</span>}
										</span>
									</button>
								);
							})}
						</div>
					)}
				</motion.div>
			</AnimatePresence>
			<div className={UI_CLASSES.row}>
				<Button type={BUTTON_TYPE} variant={VARIANT.ghost} size={VARIANT.sm} disabled={submitted || index === 0} onClick={() => go(STEP_BACK)}>
					{labels.previous}
				</Button>
				<div className="ml-auto flex items-center gap-1.5">
					{question.skippable && (
						<Button type={BUTTON_TYPE} variant={VARIANT.ghost} size={VARIANT.sm} disabled={submitted} onClick={skip}>
							{labels.skip}
						</Button>
					)}
					{(!single || last) && (
						<Button type={BUTTON_TYPE} variant={VARIANT.primary} size={VARIANT.sm} disabled={submitted || (!answered && !question.skippable)} onClick={() => go(1)}>
							{last ? labels.submit : labels.next}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

export {
	Questionnaire,
	type QuestionnaireAnswers,
	type QuestionnaireChoice,
	type QuestionnaireLabels,
	type QuestionnaireQuestion,
};
