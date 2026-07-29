import { motion, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";
import { cn } from "../../lib/utils.js";

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-accent-muted flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-accent" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-primary mb-1">{title}</h3>
      {description && <p className="text-xs text-muted max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

export default EmptyState;
