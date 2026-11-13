import { Draggable, Droppable } from "@hello-pangea/dnd";
import { COLUMN_COLORS, type ColumnDef, type Task } from "../types";
import { cn } from "../lib/cn";
import { PlusIcon } from "./icons";
import { KeyTip } from "./KeyTip";
import { TaskCard, cardSurface } from "./TaskCard";
import { TaskEditor } from "./TaskEditor";

type Props = {
  column: ColumnDef;
  /** posicao entre as colunas do dia (arrastar para reordenar) */
  index: number;
  tasks: Task[];
  composing: boolean;
  onStartCompose: () => void;
  onEndCompose: () => void;
  onAdd: (title: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onPickDay: (id: string, anchor: DOMRect) => void;
};

export function Column({
  column,
  index,
  tasks,
  composing,
  onStartCompose,
  onEndCompose,
  onAdd,
  onUpdate,
  onDelete,
  onPickDay,
}: Props) {
  return (
    <Draggable draggableId={`column:${column.id}`} index={index}>
      {(dragProvided, dragSnapshot) => (
        // O elemento externo recebe o transform da lib (e o espaco entre colunas);
        // efeitos visuais ficam no interno
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col px-1.5"
        >
          <section
            className={cn(
              "flex min-h-0 flex-1 flex-col rounded-xl bg-(--panel)",
              "transition-[background-color,box-shadow,scale] duration-200 ease-mac",
              dragSnapshot.isDragging &&
                "scale-[1.02] bg-white/85 shadow-[0_18px_44px_rgb(0_0_0/0.25)] dark:bg-[#2c2c2e]/95",
            )}
          >
            {/* o topo da coluna e a alca para arrastar */}
            <header
              {...dragProvided.dragHandleProps}
              aria-label={`Coluna ${column.title}: arraste para reordenar`}
              className="flex items-center gap-2 rounded-t-xl px-3 pt-3 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-inset"
            >
              <span className={cn("size-2 shrink-0 rounded-full", COLUMN_COLORS[column.color])} />
              <h2 className="truncate text-[13px] font-semibold tracking-tight text-black/75 dark:text-white/80">
                {column.title}
              </h2>
              <span className="ml-auto rounded-full bg-black/5 px-1.5 text-[11px] font-medium tabular-nums text-black/45 dark:bg-white/10 dark:text-white/50">
                {tasks.length}
              </span>
            </header>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "scroll-thin mx-1.5 min-h-0 flex-1 overflow-y-auto rounded-lg px-1.5 pt-0.5",
                    "transition-colors duration-200 ease-mac",
                    snapshot.isDraggingOver && "bg-black/[0.04] dark:bg-white/[0.05]",
                  )}
                >
                  {tasks.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={i}
                      done={!!column.done}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      onPickDay={onPickDay}
                    />
                  ))}
                  {provided.placeholder}

                  {composing ? (
                    <div className={cn(cardSurface, "mb-2 px-3 py-2.5 ring-2 ring-sky-500/60")}>
                      <TaskEditor stayOpen onSubmit={onAdd} onClose={onEndCompose} />
                      <p className="mt-1.5 text-[11px] text-black/35 dark:text-white/35">
                        Enter salva · Shift+Enter quebra linha · Esc cancela
                      </p>
                    </div>
                  ) : (
                    tasks.length === 0 &&
                    !snapshot.isDraggingOver && (
                      <p className="py-6 text-center text-[12px] text-black/30 dark:text-white/30">Nenhuma tarefa</p>
                    )
                  )}
                </div>
              )}
            </Droppable>

            <button
              type="button"
              onClick={onStartCompose}
              className={cn(
                "mx-1.5 mb-1.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium",
                "text-black/45 dark:text-white/45",
                "transition-colors duration-150 ease-mac",
                "hover:bg-black/[0.05] hover:text-black/75 dark:hover:bg-white/[0.07] dark:hover:text-white/80",
                "focus-visible:outline-2 focus-visible:outline-sky-500",
              )}
            >
              <PlusIcon width={12} height={12} />
              Nova tarefa
              {/* Alt+N cria na primeira coluna */}
              {index === 0 && <KeyTip keys="N" placement="inline" />}
            </button>
          </section>
        </div>
      )}
    </Draggable>
  );
}
