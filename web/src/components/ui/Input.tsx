import React, { useId } from "react";

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  large?: boolean;
  className?: string;
  name?: string;
  required?: boolean;
  autoComplete?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  large = false,
  className = "",
  name,
  required,
  autoComplete,
}) => {
  const id = useId();

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={[
            "font-medium text-[var(--color-text)]",
            large ? "text-lg" : "text-sm",
          ].join(" ")}
        >
          {label}
          {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
        </label>
      )}

      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className={[
          "w-full bg-[var(--color-surface)] border border-[var(--color-border)]",
          "rounded-[var(--radius-sm)] text-[var(--color-text)]",
          "placeholder:text-[var(--color-text)]/40",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent",
          "transition-all duration-200",
          large ? "px-5 py-4 text-lg min-h-[56px]" : "px-4 py-3 text-base",
          error ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {error && (
        <p className="text-[var(--color-danger)] text-sm mt-0.5">{error}</p>
      )}
    </div>
  );
};

export default Input;
