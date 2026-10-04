"use client";

import type { JSX, ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../primitives/select";
import { cn } from "../primitives/utils";

export interface MotionSelectOption {
  readonly value: string;
  readonly label: ReactNode;
  readonly disabled?: boolean;
  readonly title?: string;
}

export interface MotionSelectProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly options: readonly MotionSelectOption[];
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly triggerClassName?: string;
  readonly "aria-label"?: string;
}

/** A styled select backed by Radix's focus, typeahead and keyboard behavior. */
export function MotionSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  triggerClassName,
  "aria-label": ariaLabel,
}: MotionSelectProps): JSX.Element {
  const selected = options.find((option) => option.value === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("min-w-0", triggerClassName)}
      >
        <span className={cn("min-w-0 flex-1 truncate text-left", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder ?? ""}
        </span>
      </SelectTrigger>
      <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] data-open:zoom-in-100 data-closed:zoom-out-100">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            textValue={typeof option.label === "string" ? option.label : option.value}
            disabled={option.disabled}
            title={option.title}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
