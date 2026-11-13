import { useEffect } from "react";
import type { UndoAction } from "../hooks/useBoard";
import { cn } from "../lib/cn";
import { formatDayShort, type DayKey } from "../lib/date";

const TIMEOUT_MS = 5000;

type Props = {
  action: UndoAction | null;
  today: DayKey;
  onUndo: () => void;
  onDismiss: () => void;
};

/** Aviso "Tarefa excluida - Desfazer" (ou "Movida para..."), some sozinho depois de 5s */
export function UndoToast({ action, today, onUndo, onDismiss }: Props) {
  useEffect(() => {
    if (!action) return;
    const timer = window.setTimeout(onDismiss, TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [action, onDismiss]);

  if (!action) return null;

  const message =
    action.kind === "delete"
      ? "Tarefa excluída"
      : `Movida para ${action.to === today ? "hoje" : formatDayShort(action.to)}`;

  return (
    <div
      role="status"
      className={cn(
        "absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full py-1.5 pr-1.5 pl-4",
        "bg-neutral-900/90 text-[12px] text-white shadow-[0_8px_24px_rgb(0_0_0/0.25)] dark:bg-neutral-100/90 dark:text-neutral-900",
        "transition-[opacity,translate] duration-300 ease-spring starting:translate-y-3 starting:opacity-0",
      )}
    >
      <span className="max-w-56 truncate">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="rounded-full bg-white/15 px-3 py-1 font-semibold transition-colors hover:bg-white/25 dark:bg-black/10 dark:hover:bg-black/20"
      >
        Desfazer
      </button>
    </div>
  );
}
