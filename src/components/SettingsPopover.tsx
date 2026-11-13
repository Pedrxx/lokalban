import { useEffect } from "react";
import type { ThemePref } from "../lib/theme";
import { SCALES, type Scale } from "../lib/scale";
import { cn } from "../lib/cn";
import { popoverMotion } from "../lib/motion";
import { Switch } from "./Switch";

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "auto", label: "Automático" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

type CloseAction = "tray" | "quit";

const CLOSE_OPTIONS: { value: CloseAction; label: string }[] = [
  { value: "tray", label: "Ir para a bandeja" },
  { value: "quit", label: "Sair do app" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  theme: ThemePref;
  onThemeChange: (theme: ThemePref) => void;
  scale: Scale;
  onScaleChange: (scale: Scale) => void;
  closeToTray: boolean;
  onCloseToTrayChange: (closeToTray: boolean) => void;
  showInTaskbar: boolean;
  onShowInTaskbarChange: (show: boolean) => void;
};

const percent = (scale: Scale) => `${Math.round(scale * 100)}%`;

/** Popover da engrenagem: preferencias do app */
export function SettingsPopover({
  open,
  onClose,
  theme,
  onThemeChange,
  scale,
  onScaleChange,
  closeToTray,
  onCloseToTrayChange,
  showInTaskbar,
  onShowInTaskbarChange,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* clique fora fecha */}
      {open && <div className="absolute inset-0 z-20" onMouseDown={onClose} />}

      {/* fica montado para animar tambem ao fechar */}
      <div
        role="dialog"
        aria-label="Configurações"
        className={cn(
          "absolute top-11 right-3 z-30 w-80 origin-top-right rounded-xl p-3",
          "glass-edge bg-white/90 shadow-[0_18px_48px_rgb(0_0_0/0.25)] dark:bg-[#2a2a2d]/95",
          popoverMotion(open),
        )}
      >
        <h3 className="px-1 pb-2 text-[12px] font-semibold text-black/50 dark:text-white/50">Configurações</h3>

        <div className="flex items-center justify-between gap-3 px-1 py-1">
          <span id="settings-theme" className="text-[13px] text-black/75 dark:text-white/80">
            Aparência
          </span>
          <Segmented labelledBy="settings-theme" options={THEME_OPTIONS} value={theme} onChange={onThemeChange} />
        </div>

        <div className="flex items-start justify-between gap-3 px-1 pt-2 pb-1">
          <label htmlFor="settings-scale" className="pt-0.5 text-[13px] text-black/75 dark:text-white/80">
            Escala
          </label>

          {/* slider que encaixa nas 4 escalas, com as marcas embaixo */}
          <div className="w-[196px]">
            <input
              id="settings-scale"
              type="range"
              min={0}
              max={SCALES.length - 1}
              step={1}
              value={SCALES.indexOf(scale)}
              aria-valuetext={percent(scale)}
              onChange={(e) => onScaleChange(SCALES[Number(e.currentTarget.value)])}
              className="range-mac block w-full"
            />
            {/* marcas alinhadas ao centro do botao nas pontas (meia largura dele) */}
            <div className="flex justify-between px-2">
              {SCALES.map((s) => (
                <button
                  key={s}
                  type="button"
                  tabIndex={-1}
                  onClick={() => onScaleChange(s)}
                  className="flex w-0 flex-col items-center gap-0.5"
                >
                  <span className="h-1 w-px bg-black/25 dark:bg-white/30" />
                  <span
                    className={cn(
                      "text-[10px] tabular-nums transition-colors duration-150 ease-mac",
                      s === scale
                        ? "font-semibold text-black/75 dark:text-white/85"
                        : "text-black/40 dark:text-white/40",
                    )}
                  >
                    {percent(s)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* botao vermelho e Alt+F4 */}
        <div className="flex items-center justify-between gap-3 px-1 pt-2 pb-1">
          <span id="settings-close" className="text-[13px] text-black/75 dark:text-white/80">
            Ao fechar
          </span>
          <Segmented
            labelledBy="settings-close"
            options={CLOSE_OPTIONS}
            value={closeToTray ? "tray" : "quit"}
            onChange={(v) => onCloseToTrayChange(v === "tray")}
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-1 pt-2.5 pb-1">
          <span className="text-[13px] text-black/75 dark:text-white/80">Mostrar na barra de tarefas</span>
          <Switch label="Mostrar na barra de tarefas" checked={showInTaskbar} onChange={onShowInTaskbarChange} />
        </div>
      </div>
    </>
  );
}

/** Controle segmentado no estilo macOS */
function Segmented<T extends string>({
  labelledBy,
  options,
  value,
  onChange,
}: {
  labelledBy: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="flex rounded-lg bg-black/[0.06] p-0.5 dark:bg-white/[0.08]"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[12px] font-medium whitespace-nowrap",
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
  );
}
