import { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { COLUMN_COLORS, MAX_COLUMNS, type ColumnColor, type ColumnDef, type ColumnId } from "../types";
import { cn } from "../lib/cn";
import { formatDayShort, type DayKey } from "../lib/date";
import { popoverMotion } from "../lib/motion";
import { ColorPicker } from "./ColorPicker";
import { IconButton } from "./IconButton";
import { CheckIcon, GripIcon, PinIcon, PlusIcon, TrashIcon } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  /** dia exibido: a lista mostra as colunas dele */
  day: DayKey;
  columns: ColumnDef[];
  /** fixas que nao podem ser desafixadas nem excluidas neste dia */
  locked: Set<ColumnId>;
  taskCounts: Record<ColumnId, number>;
  onAdd: () => ColumnId | null;
  onRename: (id: ColumnId, title: string) => void;
  onRecolor: (id: ColumnId, color: ColumnColor) => void;
  onToggleDone: (id: ColumnId, done: boolean) => void;
  onTogglePin: (id: ColumnId, pinned: boolean) => void;
  /** reordena (indices da lista do dia) */
  onMove: (from: number, to: number) => void;
  onDelete: (id: ColumnId) => void;
};

/** Painel do "+": criar, renomear, trocar cor, fixar e excluir colunas */
export function ColumnSettings({
  open,
  onClose,
  day,
  columns,
  locked,
  taskCounts,
  onAdd,
  onRename,
  onRecolor,
  onToggleDone,
  onTogglePin,
  onMove,
  onDelete,
}: Props) {
  const [focusId, setFocusId] = useState<ColumnId | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ColumnId | null>(null);
  /** coluna com o seletor de cor aberto */
  const [coloring, setColoring] = useState<ColumnId | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(null);
      setColoring(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      // defaultPrevented: Esc que cancelou um arrasto da lista nao fecha o painel
      if (e.key !== "Escape" || e.defaultPrevented || e.target instanceof HTMLInputElement) return;
      // Esc fecha primeiro o seletor de cor, depois o painel
      if (coloring) setColoring(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, coloring]);

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
      {open && <div className="absolute inset-0 z-20" onMouseDown={onClose} />}

      {/* fica montado para animar tambem ao fechar */}
      <div
        role="dialog"
        aria-label="Colunas"
        className={cn(
          "absolute top-11 right-3 z-30 w-96 origin-top-right rounded-xl p-3",
          "glass-edge bg-white/90 shadow-[0_18px_48px_rgb(0_0_0/0.25)] dark:bg-[#2a2a2d]/95",
          popoverMotion(open),
        )}
      >
        {/* com o seletor de cor aberto, clique em outro ponto do painel fecha so ele */}
        {coloring && <div className="absolute inset-0 z-10" onMouseDown={() => setColoring(null)} />}

        <h3 className="px-1 pb-2 text-[12px] font-semibold text-black/50 dark:text-white/50">Colunas</h3>

        <DragDropContext
          onDragStart={() => setColoring(null)}
          onDragEnd={({ source, destination }) => destination && onMove(source.index, destination.index)}
        >
          <Droppable droppableId="column-list">
            {(listProvided) => (
              // espaco entre linhas por padding (a lib nao considera o gap ao deslocar)
              <ul ref={listProvided.innerRef} {...listProvided.droppableProps}>
                {columns.map((col, index) => {
                  const count = taskCounts[col.id] ?? 0;
                  const confirming = confirmDelete === col.id;
                  const pinned = !col.until;
                  const isLocked = locked.has(col.id);
                  return (
                    <Draggable key={col.id} draggableId={`column-row:${col.id}`} index={index}>
                      {(provided, snapshot) => (
                        <li ref={provided.innerRef} {...provided.draggableProps} className="pb-1">
                          <div
                            className={cn(
                              "group/row flex items-center gap-1.5 rounded-lg py-0.5 pr-1",
                              "transition-[background-color,box-shadow] duration-200 ease-mac",
                              snapshot.isDragging && "bg-white shadow-[0_8px_24px_rgb(0_0_0/0.18)] dark:bg-[#3a3a3e]",
                            )}
                          >
                            <div
                              {...provided.dragHandleProps}
                              aria-label={`Arrastar ${col.title} para reordenar`}
                              title="Arraste para reordenar"
                              className={cn(
                                "grid h-6 w-3 shrink-0 place-items-center rounded text-black/35 dark:text-white/40",
                                "opacity-0 transition-opacity duration-150 group-hover/row:opacity-100",
                                "outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sky-500/60",
                                snapshot.isDragging && "opacity-100",
                              )}
                            >
                              <GripIcon width={10} height={12} />
                            </div>

                            <div className="relative shrink-0">
                              <button
                                type="button"
                                title="Cor da coluna"
                                aria-label="Cor da coluna"
                                aria-expanded={coloring === col.id}
                                onClick={() => setColoring((c) => (c === col.id ? null : col.id))}
                                className={cn(
                                  "block size-3.5 rounded-full transition-transform duration-150 ease-spring hover:scale-125 active:scale-95",
                                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
                                  COLUMN_COLORS[col.color],
                                )}
                              />
                              <ColorPicker
                                open={coloring === col.id}
                                value={col.color}
                                onSelect={(color) => {
                                  onRecolor(col.id, color);
                                  setColoring(null);
                                }}
                                className="absolute top-full -left-2.5 z-20 mt-2 origin-top-left"
                              />
                            </div>

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

                            {col.until && (
                              <span className="shrink-0 text-[11px] text-black/40 dark:text-white/40">
                                {col.from === day && col.until === day
                                  ? "só neste dia"
                                  : `até ${formatDayShort(col.until)}`}
                              </span>
                            )}

                            <IconButton
                              label={
                                !pinned
                                  ? "Fixar daqui em diante"
                                  : isLocked
                                    ? "Pelo menos uma coluna fica fixa"
                                    : `Desafixar (fica até ${formatDayShort(day)})`
                              }
                              disabled={isLocked}
                              onClick={() => onTogglePin(col.id, !pinned)}
                              className={cn(pinned && "text-sky-500! dark:text-sky-400!")}
                            >
                              <PinIcon width={12} height={12} />
                            </IconButton>

                            <IconButton
                              label={
                                col.done ? "Tarefas riscadas (clique para desligar)" : "Riscar tarefas desta coluna"
                              }
                              onClick={() => onToggleDone(col.id, !col.done)}
                              className={cn(col.done && "text-emerald-500! dark:text-emerald-400!")}
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
                              !isLocked && (
                                <IconButton label="Excluir coluna" tone="danger" onClick={() => requestDelete(col)}>
                                  <TrashIcon width={13} height={13} />
                                </IconButton>
                              )
                            )}
                          </div>
                        </li>
                      )}
                    </Draggable>
                  );
                })}
                {listProvided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>

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
