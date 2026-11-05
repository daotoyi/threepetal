import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-container px-6 ${className}`}>{children}</div>
  );
}

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-pill font-display font-semibold transition-[background,color,box-shadow] duration-[var(--motion-base)] ease-standard disabled:opacity-50 disabled:pointer-events-none";
  const sizes = { sm: "h-9 px-4 text-sm", md: "h-11 px-6 text-base" };
  const variants = {
    primary: "bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-active",
    ghost: "bg-transparent text-fg hover:bg-surface-warm",
    outline: "bg-surface text-fg border border-border hover:bg-surface-warm",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-6 shadow-raised ${className}`}>
      {children}
    </div>
  );
}
