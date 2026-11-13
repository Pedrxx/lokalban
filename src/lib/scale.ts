import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";

/** Escalas do app nas Configuracoes (marcas do slider) */
export const SCALES = [0.9, 1, 1.1, 1.25] as const;

export type Scale = (typeof SCALES)[number];

/** Copia da escala no localStorage, so para o primeiro quadro (como o tema) */
const CACHE_KEY = "lokalban:scale";

export function isScale(value: unknown): value is Scale {
  return SCALES.includes(value as Scale);
}

export function readCachedScale(): Scale {
  try {
    const value = Number(localStorage.getItem(CACHE_KEY));
    return isScale(value) ? value : 1;
  } catch {
    return 1;
  }
}

/**
 * No app usa o zoom nativo do webview (o arrasto continua com as coordenadas
 * certas); no navegador de preview, o zoom do CSS so para ver o efeito
 */
export function applyScale(scale: Scale) {
  if (isTauri()) {
    getCurrentWebview()
      .setZoom(scale)
      .catch((err) => console.error("Falha ao mudar a escala:", err));
  } else {
    document.documentElement.style.zoom = scale === 1 ? "" : String(scale);
  }
  try {
    localStorage.setItem(CACHE_KEY, String(scale));
  } catch {
    // sem localStorage a escala so chega depois de ler o board.json
  }
}
