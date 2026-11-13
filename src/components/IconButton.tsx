import type { MouseEvent, ReactNode } from "react";
import { cn } from "../lib/cn";
import { KeyTip } from "./KeyTip";

type Props = {
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** tecla do atalho com Alt, mostrada enquanto o Alt esta pressionado */
  keyTip?: string;
  className?: string;
};

export function IconButton({ label, onClick, children, tone = "default", disabled, keyTip, className }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative grid size-6 place-items-center rounded-md text-black/50 dark:text-white/55",
        "transition-colors duration-150 ease-mac disabled:opacity-35",
        "enabled:hover:bg-black/[0.06] enabled:active:bg-black/10 dark:enabled:hover:bg-white/10 dark:enabled:active:bg-white/15",
        "focus-visible:outline-2 focus-visible:outline-sky-500",
        tone === "danger"
          ? "enabled:hover:text-red-500 dark:enabled:hover:text-red-400"
          : "enabled:hover:text-black/80 dark:enabled:hover:text-white/90",
        className,
      )}
    >
      {children}
      <KeyTip keys={keyTip} />
    </button>
  );
}
