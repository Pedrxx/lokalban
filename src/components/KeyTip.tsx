import { createContext, useContext } from "react";
import { cn } from "../lib/cn";

/** Dicas visiveis (Alt pressionado), vindo do useAltShortcuts no App */
export const KeyTipsContext = createContext(false);

/**
 * Selo com a tecla do atalho (Alt + tecla). "below" fica embaixo do controle
 * (dentro de um elemento com position relative); "inline" fica no fluxo, no
 * fim da linha. So aparece com o Alt pressionado.
 */
export function KeyTip({ keys, placement = "below" }: { keys?: string; placement?: "below" | "inline" }) {
  const visible = useContext(KeyTipsContext);
  if (!visible || !keys) return null;

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none",
        placement === "below" ? "absolute top-full left-1/2 z-40 mt-1 -translate-x-1/2" : "ml-auto",
        "rounded-[5px] px-1 py-px text-[10px] leading-tight font-semibold text-center whitespace-pre tabular-nums",
        "bg-neutral-900/85 text-white shadow-[0_2px_6px_rgb(0_0_0/0.2)] dark:bg-white/90 dark:text-neutral-900",
        "transition-[opacity,scale] duration-150 ease-mac starting:scale-90 starting:opacity-0",
      )}
    >
      {keys}
    </span>
  );
}
