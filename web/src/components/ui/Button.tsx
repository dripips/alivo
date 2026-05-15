import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "tinted";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  tintColor?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary", size = "md", loading = false,
  disabled = false, tintColor, fullWidth = false,
  className = "", children, ...rest
}) => {
  const isDisabled = disabled || loading;

  const variants: Record<Variant, string> = {
    primary: "bg-[var(--color-primary)] text-white",
    secondary: "bg-[var(--color-surface-secondary)] text-[var(--color-primary)]",
    danger: "bg-[var(--color-danger)] text-white",
    ghost: "bg-transparent text-[var(--color-primary)]",
    tinted: "",
  };

  const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-[13px] rounded-[var(--radius-xs)]",
    md: "h-11 px-5 text-[15px] rounded-[var(--radius-sm)]",
    lg: "h-[50px] px-6 text-[17px] rounded-[var(--radius-md)]",
  };

  const tintStyle = variant === 'tinted' && tintColor
    ? { backgroundColor: `color-mix(in srgb, ${tintColor} 15%, transparent)`, color: tintColor }
    : undefined;

  return (
    <button
      disabled={isDisabled}
      style={tintStyle}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-150 active:scale-[0.97] cursor-pointer select-none
        ${isDisabled ? 'opacity-40 pointer-events-none' : ''}
        ${variants[variant === 'tinted' ? 'ghost' : variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
