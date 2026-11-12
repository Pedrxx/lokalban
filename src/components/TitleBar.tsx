import type { ReactNode } from "react";
import { TrafficLights } from "./TrafficLights";
import { TITLEBAR_HEIGHT } from "../hooks/useWindowControls";
import { cn } from "../lib/cn";

type Props = {
  title: string;
  focused: boolean;
  collapsed: boolean;
  pinnedOnTop: boolean;
  onClose: () => void;
  onCollapse: () => void;
  onTogglePin: () => void;
  /** Acoes do lado direito (ex.: botao "+ Nova tarefa" na Etapa 3) */
  actions?: ReactNode;
};

/**
 * Barra de titulo customizada. O <header> e a area de arrasto
 * (data-tauri-drag-region). O titulo tem pointer-events-none para o clique
 * "atravessar" ate o header; botoes nao arrastam.
 */
export function TitleBar({ title, focused, collapsed, pinnedOnTop, onClose, onCollapse, onTogglePin, actions }: Props) {
  return (
    <header
      data-tauri-drag-region
      style={{ height: TITLEBAR_HEIGHT }}
      className="relative flex shrink-0 items-center px-3.5"
    >
      <TrafficLights
        focused={focused}
        collapsed={collapsed}
        pinnedOnTop={pinnedOnTop}
        onClose={onClose}
        onCollapse={onCollapse}
        onTogglePin={onTogglePin}
      />

      <h1
        className={cn(
          "pointer-events-none absolute inset-x-0 text-center text-[13px] font-semibold tracking-tight transition-colors duration-200",
          focused ? "text-black/80 dark:text-white/85" : "text-black/40 dark:text-white/40",
        )}
      >
        {title}
      </h1>

      <div className="relative ml-auto flex items-center gap-1.5">
        {pinnedOnTop && (
          <span
            title="Fixado acima das janelas"
            className="flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-black/55 dark:bg-white/10 dark:text-white/60"
          >
            <PinIcon />
            Fixado
          </span>
        )}
        {actions}
      </div>
    </header>
  );
}

function PinIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M9.8 1.2a1 1 0 0 1 1.4 0l3.6 3.6a1 1 0 0 1 0 1.4l-1.1 1.1a1 1 0 0 1-1 .25L10.4 9.8l.3 2.6a1 1 0 0 1-.3.8l-.7.7a.5.5 0 0 1-.7 0L6.4 11.3 2.6 15.1a.6.6 0 0 1-.85-.85L5.6 10.4 3 7.8a.5.5 0 0 1 0-.7l.7-.7a1 1 0 0 1 .8-.3l2.6.3 2.25-2.3a1 1 0 0 1 .25-1z" />
    </svg>
  );
}
