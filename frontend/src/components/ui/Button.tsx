import { Loader2 } from "lucide-react";
import { type ReactNode, forwardRef } from "react";
import { cn } from "../../lib/utils.js";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-accent hover:bg-accent-hover text-surface shadow-sm shadow-accent/20",
  secondary: "bg-card-solid hover:bg-card-hover text-secondary border border-border",
  ghost: "bg-transparent hover:bg-card-hover text-muted hover:text-primary",
  danger: "bg-danger/10 hover:bg-danger/20 text-danger hover:text-danger border border-danger/20",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, icon, children, className = "", disabled, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 active:scale-[0.97]",
        "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-1 focus:ring-offset-surface",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : icon ? icon : null}
      {children}
    </button>
  );
});

export default Button;

export type { ButtonProps, Size as ButtonSize, Variant as ButtonVariant };
