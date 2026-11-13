import { useEffect, useRef, useState } from "react";

/**
 * Teclas do mapa, por event.code (independe do layout do teclado):
 * "KeyN", "Comma", "ArrowLeft"...
 */
export type AltActions = Partial<Record<string, () => void>>;

/** Teclas que podem repetir segurando (trocar de dia) */
const REPEATABLE = new Set(["ArrowLeft", "ArrowRight"]);

/** Campo de texto com foco: ali o Alt nao faz nada */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
  return target instanceof HTMLInputElement && target.type !== "range";
}

/** AltGr (Ctrl+Alt no Windows) digita @, / e ° no ABNT2: nunca e atalho */
function isAltGr(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.key === "AltGraph" || e.getModifierState("AltGraph");
}

/**
 * Atalhos com Alt no estilo "key tips": segurar Alt mostra as dicas, soltar
 * esconde, Alt + tecla executa. Ficam de fora os atalhos do Windows (Alt+F4,
 * Alt+Tab, Alt+Espaco, Alt+Esc), o AltGr e a digitacao em campos de texto.
 * Devolve se as dicas estao visiveis.
 */
export function useAltShortcuts(actions: AltActions): boolean {
  const [showTips, setShowTips] = useState(false);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target) || isAltGr(e) || e.metaKey || e.shiftKey) {
        setShowTips(false);
        return;
      }
      if (e.key === "Alt") {
        if (!e.repeat) setShowTips(true);
        return;
      }
      if (!e.altKey) return;
      const action = actionsRef.current[e.code];
      if (!action || (e.repeat && !REPEATABLE.has(e.code))) return;
      e.preventDefault();
      setShowTips(false);
      action();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setShowTips(false);
    };
    // Alt+Tab e cliques fora tiram o foco sem soltar o Alt aqui dentro
    const hide = () => setShowTips(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", hide);
    window.addEventListener("pointerdown", hide);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", hide);
      window.removeEventListener("pointerdown", hide);
    };
  }, []);

  return showTips;
}
