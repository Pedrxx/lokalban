import { cn } from "./cn";

/**
 * Abrir e fechar no estilo macOS, so com CSS. O elemento continua montado:
 * fechado ele fica display:none, e com transition-discrete o display so muda
 * no fim da transicao, entao a saida anima (o inverso da entrada, um pouco
 * mais rapida). A entrada vem do @starting-style ao sair do display:none.
 */
export function popoverMotion(open: boolean): string {
  return cn(
    "transition-[opacity,scale,translate,display] transition-discrete ease-mac",
    "starting:-translate-y-1 starting:scale-[0.97] starting:opacity-0",
    open ? "duration-200" : "hidden -translate-y-1 scale-[0.97] opacity-0 duration-150",
  );
}
