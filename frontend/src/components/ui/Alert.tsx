import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils.js";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  title?: string;
  message: string | ReactNode;
  variant?: AlertVariant;
  className?: string;
  icon?: boolean;
}

export default function Alert({
  title,
  message,
  variant = "info",
  className,
  icon = true,
}: AlertProps) {
  const styles = {
    success: "bg-success/10 border border-success/20 text-success",
    error: "bg-danger/10 border border-danger/20 text-danger",
    warning: "bg-warning/10 border border-warning/20 text-warning",
    info: "bg-accent-muted border border-accent/20 text-accent",
  };

  const icons = {
    success: <CheckCircle className="h-4 w-4 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
    info: <Info className="h-4 w-4 shrink-0" />,
  };

  return (
    <div className={cn("flex p-3 rounded-xl border", styles[variant], className)}>
      {icon && <div className="mt-0.5 mr-3">{icons[variant]}</div>}
      <div className="flex-1">
        {title && <h4 className="text-sm font-semibold mb-1">{title}</h4>}
        <div className="text-sm">{message}</div>
      </div>
    </div>
  );
}
