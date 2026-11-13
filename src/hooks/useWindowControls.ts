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
 *  - verde:    maximiza e volta ao tamanho solto, como no macOS
 *  - alfinete: alterna entre "na area de trabalho" e "acima das janelas"
 *              (o estado fica salvo nas configuracoes)
 */
export function useWindowControls({
  scale = 1,
  pinnedOnTop = false,
  onPinnedChange,
}: {
  scale?: number;
  /** acima das janelas (salvo nas configuracoes) */
  pinnedOnTop?: boolean;
  onPinnedChange: (pinned: boolean) => void;
}) {
  const [focused, setFocused] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const expandedHeight = useRef(600);
  // recolhida, a janela fica com a altura da barra de titulo, que acompanha a escala
  const collapsedHeight = Math.round(TITLEBAR_HEIGHT * scale);

  // camada da janela: segue o estado salvo (ao abrir, ja carregado do board.json)
  useEffect(() => {
    if (!inTauri) return;
    const win = getCurrentWindow();
    // A ordem importa: desligar um modo antes de ligar o outro
    const apply = pinnedOnTop
      ? win.setAlwaysOnBottom(false).then(() => win.setAlwaysOnTop(true))
      : win.setAlwaysOnTop(false).then(() => win.setAlwaysOnBottom(true));
    apply.catch((err) => console.error("Falha ao alterar a camada da janela:", err));
  }, [pinnedOnTop]);

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

  // foco (semaforo cinza sem foco) e maximizada (tambem muda com duplo clique na barra)
  useEffect(() => {
    if (!inTauri) return;
    const win = getCurrentWindow();
    let disposed = false;
    const unlisten: (() => void)[] = [];
    const keep = (fn: () => void) => (disposed ? fn() : unlisten.push(fn));
    const syncMaximized = () => win.isMaximized().then((m) => !disposed && setMaximized(m));

    win.isFocused().then((f) => !disposed && setFocused(f));
    syncMaximized();
    win.onFocusChanged(({ payload }) => setFocused(payload)).then(keep);
    win.onResized(syncMaximized).then(keep);

    return () => {
      disposed = true;
      unlisten.forEach((fn) => fn());
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
      if (!collapsed) {
        // maximizada nao recolhe: volta antes ao tamanho solto
        if (await win.isMaximized()) await win.toggleMaximize();
        const size = (await win.innerSize()).toLogical(await win.scaleFactor());
        expandedHeight.current = size.height;
        await win.setMinSize(new LogicalSize(MIN_WIDTH, collapsedHeight));
        await win.setSize(new LogicalSize(size.width, collapsedHeight));
      } else {
        const size = (await win.innerSize()).toLogical(await win.scaleFactor());
        await win.setSize(new LogicalSize(size.width, expandedHeight.current));
        await win.setMinSize(new LogicalSize(MIN_WIDTH, MIN_HEIGHT));
      }
      setCollapsed(!collapsed);
    } catch (err) {
      console.error("Falha ao recolher a janela:", err);
    }
  }, [collapsed, collapsedHeight]);

  const toggleMaximize = useCallback(async () => {
    if (!inTauri) return;
    try {
      // recolhida, expande antes de maximizar
      if (collapsed) await toggleCollapse();
      await getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.error("Falha ao maximizar a janela:", err);
    }
  }, [collapsed, toggleCollapse]);

  const togglePin = useCallback(() => onPinnedChange(!pinnedOnTop), [onPinnedChange, pinnedOnTop]);

  return { focused, collapsed, maximized, close, toggleCollapse, toggleMaximize, togglePin };
}
