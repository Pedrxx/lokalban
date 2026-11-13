import type { MouseEvent, ReactNode } from "react";
import { cn } from "../lib/cn";

type Props = {
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  tone?: "default" | "danger";
  className?: string;
};

export function IconButton({ label, onClick, children, tone = "default", className }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-6 place-items-center rounded-md text-black/50 dark:text-white/55",
        "transition-colors duration-150 ease-mac",
        "hover:bg-black/[0.06] active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15",
        "focus-visible:outline-2 focus-visible:outline-sky-500",
        tone === "danger"
          ? "hover:text-red-500 dark:hover:text-red-400"
          : "hover:text-black/80 dark:hover:text-white/90",
        className,
      )}
    >
      {children}
    </button>
  );
}
