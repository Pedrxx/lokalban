import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/** Aparencia escolhida nas Configuracoes ("auto" segue o Windows) */
export type ThemePref = "auto" | "light" | "dark";

export const THEME_PREFS: ThemePref[] = ["auto", "light", "dark"];

/**
 * Copia da preferencia no localStorage, so para pintar o primeiro quadro
 * no tema certo (o board.json, que e a fonte da verdade, chega depois)
 */
const CACHE_KEY = "lokalban:theme";

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

export function isThemePref(value: unknown): value is ThemePref {
  return THEME_PREFS.includes(value as ThemePref);
}

export function readCachedTheme(): ThemePref {
  try {
    const value = localStorage.getItem(CACHE_KEY);
    return isThemePref(value) ? value : "auto";
  } catch {
    return "auto";
  }
}

/**
 * Aplica no <html> (data-theme claro/escuro, que o CSS segue) e, no app,
 * no tema da janela, para o vidro e as barras de rolagem acompanharem
 */
export function applyTheme(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "auto" && darkQuery().matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  try {
    localStorage.setItem(CACHE_KEY, pref);
  } catch {
    // sem localStorage o tema so chega depois de ler o board.json
  }
}

/** No app, o tema da janela; "auto" (null) devolve ao do Windows */
export function applyWindowTheme(pref: ThemePref) {
  if (!isTauri()) return;
  getCurrentWindow()
    .setTheme(pref === "auto" ? null : pref)
    .catch((err) => console.error("Falha ao trocar o tema da janela:", err));
}

/** Em "auto", reaplica quando o Windows troca de tema; devolve o cancelamento */
export function followSystemTheme(onChange: () => void): () => void {
  const query = darkQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
