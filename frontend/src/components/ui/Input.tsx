import { type InputHTMLAttributes, type ReactNode, useId } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            "w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary",
            "placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            leftIcon ? "pl-9" : "",
            error ? "border-danger focus:border-danger focus:ring-danger/50" : "",
            className,
          ].join(" ")}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
    </div>
  );
}
