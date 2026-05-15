import React from "react";

type BadgeVariant = "ok" | "alert" | "warning" | "info" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  ok: "bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/30",
  alert: "bg-[var(--color-danger)]/15 text-[var(--color-danger)] border-[var(--color-danger)]/30",
  warning: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  info: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  muted: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};

const Badge: React.FC<BadgeProps> = ({
  variant = "info",
  children,
  className = "",
}) => {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border",
        "px-3 py-0.5 text-xs font-semibold leading-5",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
};

export default Badge;
