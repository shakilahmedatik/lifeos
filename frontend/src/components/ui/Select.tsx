import { forwardRef, type SelectHTMLAttributes, useId } from "react";
import { cn } from "../../lib/utils.js";
import { FormField } from "./FormField.js";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <FormField label={label || ""} htmlFor={selectId} error={error} className={className}>
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary",
            "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            error && "border-danger focus:border-danger focus:ring-danger/50",
          )}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-card text-primary"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
      </FormField>
    );
  },
);
