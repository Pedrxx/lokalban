import { cn } from "../lib/cn";

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** Interruptor pequeno no estilo macOS (azul quando ligado) */
export function Switch({ label, checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[15px] w-[26px] shrink-0 rounded-full",
        "transition-colors duration-200 ease-mac",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
        checked ? "bg-sky-500" : "bg-black/[0.12] dark:bg-white/20",
      )}
    >
      <span
        className={cn(
          "absolute top-px left-px size-[13px] rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.3)]",
          "transition-transform duration-200 ease-mac",
          checked && "translate-x-[11px]",
        )}
      />
    </button>
  );
}
