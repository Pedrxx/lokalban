import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type Props = {
  focused: boolean;
  collapsed: boolean;
  maximized: boolean;
  /** o vermelho esconde na bandeja (true) ou sai do app (false) */
  closeToTray: boolean;
  onClose: () => void;
  onCollapse: () => void;
  onToggleMaximize: () => void;
};

/**
 * Botoes "semaforo" do macOS. Como no Mac:
 *  - janela sem foco => bolinhas cinza
 *  - passar o mouse no grupo => cores + simbolos aparecem
 */
export function TrafficLights({
  focused,
  collapsed,
  maximized,
  closeToTray,
  onClose,
  onCollapse,
  onToggleMaximize,
}: Props) {
  return (
    <div className="group relative z-10 flex items-center gap-2">
      <Light
        label={closeToTray ? "Esconder (volta pelo ícone perto do relógio)" : "Sair do LokalBan"}
        focused={focused}
        on="bg-[#ff5f57]"
        hover="group-hover:bg-[#ff5f57]"
        onClick={onClose}
        glyph={<path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />}
      />
      <Light
        label={collapsed ? "Expandir" : "Recolher"}
        focused={focused}
        on="bg-[#febc2e]"
        hover="group-hover:bg-[#febc2e]"
        onClick={onCollapse}
        glyph={collapsed ? <path d="M2.5 4l2.5 2.5L7.5 4" /> : <path d="M2 5h6" />}
      />
      <Light
        label={maximized ? "Restaurar tamanho" : "Maximizar"}
        focused={focused}
        on="bg-[#28c840]"
        hover="group-hover:bg-[#28c840]"
        onClick={onToggleMaximize}
        glyph={
          // setas do macOS: para fora (maximizar) e para dentro (restaurar)
          <g fill="currentColor" stroke="none">
            {maximized ? (
              <>
                <path d="M4.6 4.6H1.4l3.2-3.2z" />
                <path d="M5.4 5.4h3.2L5.4 8.6z" />
              </>
            ) : (
              <>
                <path d="M2.2 2.2h3.6L2.2 5.8z" />
                <path d="M7.8 7.8H4.2l3.6-3.6z" />
              </>
            )}
          </g>
        }
      />
    </div>
  );
}

type LightProps = {
  label: string;
  focused: boolean;
  /** cor quando a janela tem foco */
  on: string;
  /** mesma cor, aplicada no hover do grupo quando sem foco */
  hover: string;
  glyph: ReactNode;
  onClick: () => void;
};

function Light({ label, focused, on, hover, glyph, onClick }: LightProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onDoubleClick={(e) => e.stopPropagation()}
      className={cn(
        "grid size-3 place-items-center rounded-full",
        "shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.18)]",
        "transition-[background-color,filter,transform] duration-150 ease-mac",
        "active:scale-90 active:brightness-75",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
        focused ? on : cn("bg-black/15 dark:bg-white/20", hover),
      )}
    >
      <svg
        viewBox="0 0 10 10"
        width="8"
        height="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="text-black/55 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        {glyph}
      </svg>
    </button>
  );
}
