import type { ReactNode } from "react";
import { TrafficLights } from "./TrafficLights";
import { TITLEBAR_HEIGHT } from "../hooks/useWindowControls";
import { cn } from "../lib/cn";

type Props = {
  title: string;
  focused: boolean;
  collapsed: boolean;
  maximized: boolean;
  closeToTray: boolean;
  onClose: () => void;
  onCollapse: () => void;
  onToggleMaximize: () => void;
  /** Acoes do lado direito (ex.: botao "+ Nova tarefa" na Etapa 3) */
  actions?: ReactNode;
};

/**
 * Barra de titulo customizada. O <header> e a area de arrasto
 * (data-tauri-drag-region). O titulo tem pointer-events-none para o clique
 * "atravessar" ate o header; botoes nao arrastam.
 */
export function TitleBar({
  title,
  focused,
  collapsed,
  maximized,
  closeToTray,
  onClose,
  onCollapse,
  onToggleMaximize,
  actions,
}: Props) {
  return (
    <header
      data-tauri-drag-region
      style={{ height: TITLEBAR_HEIGHT }}
      className="relative flex shrink-0 items-center px-3.5"
    >
      <TrafficLights
        focused={focused}
        collapsed={collapsed}
        maximized={maximized}
        closeToTray={closeToTray}
        onClose={onClose}
        onCollapse={onCollapse}
        onToggleMaximize={onToggleMaximize}
      />

      <h1
        className={cn(
          "pointer-events-none absolute inset-x-0 text-center text-[13px] font-semibold tracking-tight transition-colors duration-200",
          focused ? "text-black/80 dark:text-white/85" : "text-black/40 dark:text-white/40",
        )}
      >
        {title}
      </h1>

      <div className="relative ml-auto flex items-center gap-1.5">{actions}</div>
    </header>
  );
}
