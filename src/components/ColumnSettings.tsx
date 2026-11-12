import { useEffect, useState } from "react";
import { COLOR_KEYS, COLUMN_COLORS, MAX_COLUMNS, type ColumnColor, type ColumnDef, type ColumnId } from "../types";
import { cn } from "../lib/cn";
import { IconButton } from "./IconButton";
import { CheckIcon, PlusIcon, TrashIcon } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  taskCounts: Record<ColumnId, number>;
  onAdd: () => ColumnId | null;
  onRename: (id: ColumnId, title: string) => void;
  onRecolor: (id: ColumnId, color: ColumnColor) => void;
  onToggleDone: (id: ColumnId, done: boolean) => void;
  onDelete: (id: ColumnId) => void;
};

/** Painel da engrenagem: criar, renomear, trocar cor e excluir colunas */
export function ColumnSettings({
  open,
  onClose,
  columns,
  taskCounts,
  onAdd,
  onRename,
  onRecolor,
  onToggleDone,
  onDelete,
}: Props) {
  const [focusId, setFocusId] = useState<ColumnId | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ColumnId | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLInputElement)) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canDelete = columns.length > 1;
  const atMax = columns.length >= MAX_COLUMNS;

  const requestDelete = (col: ColumnDef) => {
    const count = taskCounts[col.id] ?? 0;
    if (count === 0 || confirmDelete === col.id) {
      onDelete(col.id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(col.id);
    }
  };

  return (
    <>
      {/* clique fora fecha */}
      <div className="absolute inset-0 z-20" onMouseDown={onClose} />

      <div
        role="dialog"
        aria-label="Colunas"
        className={cn(
          "absolute top-11 right-3 z-30 w-80 origin-top-right rounded-xl p-3",
          "glass-edge bg-white/90 shadow-[0_18px_48px_rgb(0_0_0/0.25)] dark:bg-[#2a2a2d]/95",
          "transition-[opacity,scale,translate] duration-200 ease-mac",
          "starting:-translate-y-1 starting:scale-[0.97] starting:opacity-0",
        )}
      >
        <h3 className="px-1 pb-2 text-[12px] font-semibold text-black/50 dark:text-white/50">Colunas</h3>

        <ul className="flex flex-col gap-1">
          {columns.map((col) => {
            const count = taskCounts[col.id] ?? 0;
            const confirming = confirmDelete === col.id;
            return (
              <li key={col.id} className="flex items-center gap-1.5 rounded-lg px-1 py-0.5">
                <button
                  type="button"
                  title="Trocar cor"
                  aria-label="Trocar cor"
                  onClick={() => onRecolor(col.id, nextColor(col.color))}
                  className={cn(
                    "size-3.5 shrink-0 rounded-full transition-transform duration-150 ease-spring hover:scale-125 active:scale-95",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
                    COLUMN_COLORS[col.color],
                  )}
                />

                <input
                  key={col.title}
                  defaultValue={col.title}
                  maxLength={32}
                  aria-label="Nome da coluna"
                  ref={(el) => {
                    if (el && focusId === col.id) {
                      el.focus();
                      el.select();
                      setFocusId(null);
                    }
                  }}
                  onBlur={(e) => {
                    const v = e.currentTarget.value.trim();
                    if (v && v !== col.title) onRename(col.id, v);
                    else e.currentTarget.value = col.title;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") {
                      e.currentTarget.value = col.title;
                      e.currentTarget.blur();
                    }
                  }}
                  className={cn(
                    "min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-[13px] outline-none select-text",
                    "transition-colors duration-150 hover:bg-black/[0.04] focus:bg-black/[0.06] dark:hover:bg-white/[0.06] dark:focus:bg-white/10",
                    "focus:ring-2 focus:ring-sky-500/50",
                  )}
                />

                <IconButton
                  label={col.done ? "Tarefas riscadas (clique para desligar)" : "Riscar tarefas desta coluna"}
                  onClick={() => onToggleDone(col.id, !col.done)}
                  className={cn(col.done && "text-emerald-500 dark:text-emerald-400")}
                >
                  <CheckIcon width={13} height={13} />
                </IconButton>

                {confirming ? (
                  <button
                    type="button"
                    onClick={() => requestDelete(col)}
                    onBlur={() => setConfirmDelete(null)}
                    autoFocus
                    className="shrink-0 rounded-md bg-red-500 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-600"
                  >
                    Excluir {count} {count === 1 ? "tarefa" : "tarefas"}?
                  </button>
                ) : (
                  canDelete && (
                    <IconButton label="Excluir coluna" tone="danger" onClick={() => requestDelete(col)}>
                      <TrashIcon width={13} height={13} />
                    </IconButton>
                  )
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-2 border-t border-black/[0.06] pt-2 dark:border-white/[0.08]">
          <button
            type="button"
            disabled={atMax}
            onClick={() => {
              const id = onAdd();
              if (id) setFocusId(id);
            }}
            className={cn(
              "flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium",
              "text-black/55 dark:text-white/55",
              "transition-colors duration-150 ease-mac",
              "enabled:hover:bg-black/[0.05] enabled:hover:text-black/80 dark:enabled:hover:bg-white/[0.07] dark:enabled:hover:text-white/85",
              "disabled:opacity-40",
            )}
          >
            <PlusIcon width={12} height={12} />
            {atMax ? `Máximo de ${MAX_COLUMNS} colunas` : "Adicionar coluna"}
          </button>
        </div>
      </div>
    </>
  );
}

function nextColor(current: ColumnColor): ColumnColor {
  return COLOR_KEYS[(COLOR_KEYS.indexOf(current) + 1) % COLOR_KEYS.length];
}
