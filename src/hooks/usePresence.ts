import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";

/**
 * Para o que sai da tela sem poder ficar montado escondido (ex.: um campo
 * com o texto digitado): continua renderizando durante a animacao de saida
 * e so desmonta depois. Devolve se deve renderizar.
 */
export function usePresence(open: boolean, exitMs: number): boolean {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : exitMs);
    return () => window.clearTimeout(timer);
  }, [open, exitMs]);

  return open || mounted;
}
