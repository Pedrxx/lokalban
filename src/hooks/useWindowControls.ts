import { useCallback, useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

export const TITLEBAR_HEIGHT = 44;
const MIN_WIDTH = 720;
const MIN_HEIGHT = 420;

const inTauri = isTauri();

/**
 * Controles da janela-widget:
 *  - vermelho: esconde a janela (o Rust intercepta o fechamento; volta pela
 *              bandeja e "Sair" fica no menu do icone perto do relogio)
 *  - amarelo:  recolhe a janela ate a barra de titulo (minimizar nao serve:
 *              sem icone na barra de tarefas nao haveria como restaurar)
 *  - verde:    alterna entre "na area de trabalho" e "acima das janelas"
 */
export function useWindowControls(scale = 1) {
  const [focused, setFocused] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [pinnedOnTop, setPinnedOnTop] = useState(false);
  const expandedHeight = useRef(600);
  // recolhida, a janela fica com a altura da barra de titulo, que acompanha a escala
  const collapsedHeight = Math.round(TITLEBAR_HEIGHT * scale);

  // trocar a escala com a janela recolhida ajusta a altura dela
  useEffect(() => {
    if (!inTauri || !collapsed) return;
    const win = getCurrentWindow();
    (async () => {
      const size = (await win.innerSize()).toLogical(await win.scaleFactor());
      await win.setMinSize(new LogicalSize(MIN_WIDTH, collapsedHeight));
      await win.setSize(new LogicalSize(size.width, collapsedHeight));
    })().catch((err) => console.error("Falha ao ajustar a janela recolhida:", err));
  }, [collapsed, collapsedHeight]);

  useEffect(() => {
    if (!inTauri) return;
    const win = getCurrentWindow();
    let disposed = false;
    let unlisten: (() => void) | undefined;

    win.isFocused().then((f) => !disposed && setFocused(f));
    win.onFocusChanged(({ payload }) => setFocused(payload)).then((fn) => (disposed ? fn() : (unlisten = fn)));

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  const close = useCallback(async () => {
    if (!inTauri) return;
    await getCurrentWindow().close();
  }, []);

  const toggleCollapse = useCallback(async () => {
    if (!inTauri) {
      setCollapsed((c) => !c);
      return;
    }
    const win = getCurrentWindow();
    try {
      const size = (await win.innerSize()).toLogical(await win.scaleFactor());
      if (!collapsed) {
        expandedHeight.current = size.height;
        await win.setMinSize(new LogicalSize(MIN_WIDTH, collapsedHeight));
        await win.setSize(new LogicalSize(size.width, collapsedHeight));
      } else {
        await win.setSize(new LogicalSize(size.width, expandedHeight.current));
        await win.setMinSize(new LogicalSize(MIN_WIDTH, MIN_HEIGHT));
      }
      setCollapsed(!collapsed);
    } catch (err) {
      console.error("Falha ao recolher a janela:", err);
    }
  }, [collapsed, collapsedHeight]);

  const togglePin = useCallback(async () => {
    const next = !pinnedOnTop;
    if (inTauri) {
      const win = getCurrentWindow();
      try {
        // A ordem importa: desligar um modo antes de ligar o outro
        if (next) {
          await win.setAlwaysOnBottom(false);
          await win.setAlwaysOnTop(true);
        } else {
          await win.setAlwaysOnTop(false);
          await win.setAlwaysOnBottom(true);
        }
      } catch (err) {
        console.error("Falha ao alterar a camada da janela:", err);
        return;
      }
    }
    setPinnedOnTop(next);
  }, [pinnedOnTop]);

  return { focused, collapsed, pinnedOnTop, close, toggleCollapse, togglePin };
}
