import { type SelectHTMLAttributes, useId } from "react";

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

export function Select({
  label,
  error,
  helperText,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[
          "w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm text-primary",
          "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50",
          "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          error ? "border-danger focus:border-danger focus:ring-danger/50" : "",
          className,
        ].join(" ")}
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
      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
    </div>
  );
}
