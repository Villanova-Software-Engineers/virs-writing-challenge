import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface InputFieldProps {
  label?: string;
  id: string;
  extra?: string;
  type: string;
  placeholder?: string;
  variant?: string;
  state?: "error" | "success";
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

function InputField(props: InputFieldProps) {
  const { label, id, extra = "", type, placeholder, state, disabled, value, onChange, onBlur } = props;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const stateClasses =
    state === "error"
      ? "border-red-400/50 shadow-[0_0_0_4px_rgba(248,113,113,0.12)]"
      : state === "success"
        ? "border-emerald-400"
        : "";

  const disabledClass = disabled ? "opacity-60 cursor-not-allowed" : "";

  const inputClassName = [
    "w-full px-3.5 py-3 rounded-[14px] border border-accent/20 bg-background text-text text-sm transition-all hover:border-primary/40 focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(0,75,145,0.18)]",
    isPassword ? "pr-11" : "",
    stateClasses,
    disabledClass,
    extra,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-muted tracking-wide">
          {label}
        </label>
      )}
      <div className="relative mt-1.5">
        <input
          disabled={disabled}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={inputClassName}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={disabled}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors disabled:opacity-60"
          >
            {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default InputField;
