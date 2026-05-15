import React from "react";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ className = "", children, onClick }) => {
  const interactive = typeof onClick === "function";

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={[
        "glass rounded-[var(--radius-md)] p-6 shadow-lg",
        "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        interactive
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-xl"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
};

export default Card;
