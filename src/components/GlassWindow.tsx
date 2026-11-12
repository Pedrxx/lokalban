import type { ReactNode } from "react";

/**
 * Container principal: camada de tinta translucida (70-80%) sobre o Acrylic
 * nativo do Windows, com borda interna de 1px e reflexo no topo.
 */
export function GlassWindow({ children }: { children: ReactNode }) {
  return (
    <div className="glass-edge relative flex h-full flex-col overflow-hidden rounded-window bg-(--glass-tint) text-neutral-900 dark:text-neutral-100">
      {children}
    </div>
  );
}
