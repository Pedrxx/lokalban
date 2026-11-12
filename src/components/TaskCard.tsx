import { memo, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { Task } from "../types";
import { cn } from "../lib/cn";
import { IconButton } from "./IconButton";
import { PencilIcon, TrashIcon } from "./icons";
import { TaskEditor } from "./TaskEditor";

type Props = {
  task: Task;
  index: number;
  done: boolean;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

/** Superficie de vidro compartilhada pelos cards e pelo campo de nova tarefa */
export const cardSurface =
  "glass-edge rounded-card bg-white/75 shadow-[0_1px_2px_rgb(0_0_0/0.06)] dark:bg-white/[0.07]";

export const TaskCard = memo(function TaskCard({ task, index, done, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={editing}>
      {(provided, snapshot) => (
        // O elemento externo recebe o transform da lib; efeitos visuais ficam no interno
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="group/handle pb-2 outline-none"
        >
          <div
            onDoubleClick={() => setEditing(true)}
            className={cn(
              cardSurface,
              "group/card relative px-3 py-2.5 text-[13px] leading-snug",
              "transition-[background-color,box-shadow,transform,opacity] duration-200 ease-mac",
              "starting:scale-95 starting:opacity-0",
              "hover:bg-white/95 dark:hover:bg-white/[0.11]",
              snapshot.isDragging &&
                "scale-[1.03] rotate-[0.8deg] bg-white/95 shadow-[0_14px_34px_rgb(0_0_0/0.22)] dark:bg-[#3a3a3e]/95",
              "ring-sky-500/60 group-focus-visible/handle:ring-2",
              editing && "ring-2",
            )}
          >
            {editing ? (
              <TaskEditor
                initial={task.title}
                onSubmit={(title) => onUpdate(task.id, title)}
                onClose={() => setEditing(false)}
              />
            ) : (
              <>
                <p
                  className={cn(
                    "break-words whitespace-pre-wrap",
                    done &&
                      "text-black/45 line-through decoration-black/25 dark:text-white/40 dark:decoration-white/25",
                  )}
                >
                  {task.title}
                </p>

                {/* Acoes aparecem no hover, sobrepostas ao texto */}
                {!snapshot.isDragging && (
                  <div
                    className={cn(
                      "absolute top-1.5 right-1.5 flex gap-0.5 rounded-lg p-0.5",
                      "bg-white/90 shadow-sm dark:bg-[#2c2c2e]/95",
                      "opacity-0 transition-opacity duration-150 group-hover/card:opacity-100 focus-within:opacity-100",
                    )}
                  >
                    <IconButton label="Editar" onClick={() => setEditing(true)}>
                      <PencilIcon width={13} height={13} />
                    </IconButton>
                    <IconButton label="Excluir" tone="danger" onClick={() => onDelete(task.id)}>
                      <TrashIcon width={13} height={13} />
                    </IconButton>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
});
