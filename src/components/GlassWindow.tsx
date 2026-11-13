import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Container principal: camada de tinta translucida (70-80%) sobre o Acrylic
 * nativo do Windows, com borda interna de 1px e reflexo no topo.
 * Maximizada, a janela perde os cantos arredondados (como no Windows).
 */
export function GlassWindow({ children, maximized = false }: { children: ReactNode; maximized?: boolean }) {
  return (
    <div
      className={cn(
        "glass-edge relative flex h-full flex-col overflow-hidden bg-(--glass-tint) text-neutral-900 dark:text-neutral-100",
        maximized ? "rounded-none" : "rounded-window",
      )}
    >
      {children}
    </div>
  );
}
