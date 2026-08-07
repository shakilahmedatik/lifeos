import { type InputHTMLAttributes, type ReactNode, useId, forwardRef } from "react";
import { cn } from "../../lib/utils.js";
import { FormField } from "./FormField.js";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = "", id, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <FormField label={label || ""} error={error} className={className}>
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary",
            "placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            leftIcon && "pl-9",
            error && "border-danger focus:border-danger focus:ring-danger/50",
          )}
          {...props}
        />
      </div>
      {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
    </FormField>
  );
});

export default Input;
