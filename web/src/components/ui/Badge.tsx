import React from "react";

type BadgeVariant = "ok" | "alert" | "warning" | "info" | "muted";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

const colors: Record<BadgeVariant, { bg: string; text: string }> = {
  ok:      { bg: 'rgba(52,199,89,0.12)',  text: 'var(--color-success)' },
  alert:   { bg: 'rgba(255,59,48,0.12)',  text: 'var(--color-danger)' },
  warning: { bg: 'rgba(255,149,0,0.12)',  text: 'var(--color-warning)' },
  info:    { bg: 'rgba(0,122,255,0.12)',   text: 'var(--color-primary)' },
  muted:   { bg: 'var(--color-surface-secondary)', text: 'var(--color-text-tertiary)' },
};

const Badge: React.FC<BadgeProps> = ({ variant = "info", size = "sm", children, className = "" }) => {
  const c = colors[variant];
  return (
    <span
      style={{ backgroundColor: c.bg, color: c.text }}
      className={`
        inline-flex items-center font-medium rounded-[var(--radius-xs)]
        ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[13px]'}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
