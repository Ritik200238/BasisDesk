import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-strong",
  secondary: "border border-border-strong bg-surface-raised text-foreground hover:border-accent/50",
  ghost: "text-muted hover:bg-surface-raised hover:text-foreground",
};

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-body font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        className,
      )}
      {...rest}
    />
  );
}
