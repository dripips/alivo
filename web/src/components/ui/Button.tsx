import React from "react";

type ButtonVariant = "primary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-lg hover:shadow-xl",
  danger:
    "bg-[var(--color-danger)] text-white shadow-lg hover:shadow-xl",
  ghost:
    "glass border border-[var(--color-border)] text-[var(--color-text)]",
  outline:
    "bg-transparent border-2 border-[var(--color-primary)] text-[var(--color-primary)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-full",
  md: "px-6 py-3 text-base rounded-full",
  lg: "px-8 py-4 text-lg min-h-[56px] rounded-full",
};

const Spinner: React.FC = () => (
  <svg
    className="animate-spin h-5 w-5 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold",
        "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "hover:-translate-y-0.5 active:translate-y-0",
        "cursor-pointer select-none",
        isDisabled ? "opacity-50 pointer-events-none" : "",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};

export default Button;
