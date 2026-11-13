import { useEffect } from "react";
import type { ThemePref } from "../lib/theme";
import { cn } from "../lib/cn";

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "auto", label: "Automático" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  theme: ThemePref;
  onThemeChange: (theme: ThemePref) => void;
};

/** Popover da engrenagem: preferencias do app */
export function SettingsPopover({ open, onClose, theme, onThemeChange }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* clique fora fecha */}
      <div className="absolute inset-0 z-20" onMouseDown={onClose} />

      <div
        role="dialog"
        aria-label="Configurações"
        className={cn(
          "absolute top-11 right-3 z-30 w-80 origin-top-right rounded-xl p-3",
          "glass-edge bg-white/90 shadow-[0_18px_48px_rgb(0_0_0/0.25)] dark:bg-[#2a2a2d]/95",
          "transition-[opacity,scale,translate] duration-200 ease-mac",
          "starting:-translate-y-1 starting:scale-[0.97] starting:opacity-0",
        )}
      >
        <h3 className="px-1 pb-2 text-[12px] font-semibold text-black/50 dark:text-white/50">Configurações</h3>

        <div className="flex items-center justify-between gap-3 px-1 py-1">
          <span id="settings-theme" className="text-[13px] text-black/75 dark:text-white/80">
            Aparência
          </span>

          {/* controle segmentado no estilo macOS */}
          <div
            role="radiogroup"
            aria-labelledby="settings-theme"
            className="flex rounded-lg bg-black/[0.06] p-0.5 dark:bg-white/[0.08]"
          >
            {THEME_OPTIONS.map((opt) => {
              const selected = opt.value === theme;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onThemeChange(opt.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium",
                    "transition-[background-color,color,box-shadow] duration-150 ease-mac",
                    "focus-visible:outline-2 focus-visible:outline-sky-500",
                    selected
                      ? "bg-white text-black/85 shadow-[0_1px_2px_rgb(0_0_0/0.15)] dark:bg-white/20 dark:text-white"
                      : "text-black/55 hover:text-black/80 dark:text-white/60 dark:hover:text-white/85",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
