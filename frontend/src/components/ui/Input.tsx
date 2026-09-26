import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
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
      <FormField label={label || ""} htmlFor={inputId} error={error} className={className}>
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
              "w-full bg-input border border-border rounded-md px-3 py-1.5 text-[13px] text-primary shadow-inner shadow-black/5 transition-all duration-200",
              "placeholder:text-muted focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/30",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon && "pl-9",
              error && "border-danger focus:border-danger focus:ring-danger/30",
            )}
            {...props}
          />
        </div>
        {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
      </FormField>
    );
  },
);

export default Input;
