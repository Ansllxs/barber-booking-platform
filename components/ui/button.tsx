import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "lg",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex w-full items-center justify-center rounded-none font-medium tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40",
        size === "lg" && "min-h-12 px-5 py-3 text-sm",
        size === "md" && "min-h-11 px-4 py-2.5 text-sm",
        variant === "primary" &&
          "bg-silver text-black hover:bg-silver-bright active:bg-silver",
        variant === "outline" &&
          "border border-silver/35 text-silver hover:border-silver hover:text-silver-bright",
        variant === "ghost" && "text-muted hover:text-silver-bright",
        className,
      )}
      {...props}
    />
  );
}
