import React from "react";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'grouped' | 'flat';
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' };

const Card: React.FC<CardProps> = ({
  className = "", children, onClick,
  padding = 'md', variant = 'default',
}) => {
  const interactive = typeof onClick === "function";

  const base = variant === 'grouped'
    ? 'bg-[var(--color-surface)] overflow-hidden'
    : variant === 'flat'
      ? 'bg-transparent'
      : 'bg-[var(--color-surface)] rounded-[var(--radius-sm)] shadow-[var(--shadow-card)]';

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      className={`${base} ${paddingMap[padding]} ${interactive ? 'cursor-pointer active:scale-[0.98] transition-transform duration-150' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
