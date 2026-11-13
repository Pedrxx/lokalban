import { useEffect } from "react";
import { applyTheme, applyWindowTheme, followSystemTheme, type ThemePref } from "../lib/theme";

/**
 * Aplica a aparencia escolhida. Antes de ler o board.json vale a copia em
 * cache aplicada no main.tsx; em "auto", acompanha a troca de tema do Windows
 */
export function useTheme(pref: ThemePref, ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    applyTheme(pref);
    applyWindowTheme(pref);
    if (pref !== "auto") return;
    return followSystemTheme(() => applyTheme(pref));
  }, [pref, ready]);
}
