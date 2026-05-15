import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  large?: boolean;
}

const Input: React.FC<InputProps> = ({
  label, error, large = false, className = "", ...rest
}) => {
  const id = useId();

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-[var(--color-text-tertiary)] ml-1">
          {label}
          {rest.required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full bg-[var(--color-surface-secondary)] text-[var(--color-text)]
          rounded-[var(--radius-sm)] border-0
          placeholder:text-[var(--color-text-quaternary)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40
          transition-shadow duration-150
          ${large ? 'h-[50px] px-4 text-[17px]' : 'h-11 px-3.5 text-[15px]'}
          ${error ? 'ring-2 ring-[var(--color-danger)]/40' : ''}
        `}
        {...rest}
      />
      {error && <p className="text-[var(--color-danger)] text-[13px] ml-1">{error}</p>}
    </div>
  );
};

export default Input;
