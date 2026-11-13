import { memo, useEffect, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { Task } from "../types";
import { cn } from "../lib/cn";
import { IconButton } from "./IconButton";
import { CalendarIcon, PencilIcon, TrashIcon } from "./icons";
import { TaskEditor } from "./TaskEditor";

type Props = {
  task: Task;
  index: number;
  done: boolean;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  /** abre o mini calendario ancorado no botao clicado */
  onPickDay: (id: string, anchor: DOMRect) => void;
  /** saindo (excluida ou levada a outro dia): some, encolhe e os de baixo sobem */
  leaving?: boolean;
  /** voltou pelo Desfazer: entra com a mesma animacao de tarefa nova */
  appear?: boolean;
};

/** Superficie de vidro compartilhada pelos cards e pelo campo de nova tarefa */
export const cardSurface =
  "glass-edge rounded-card bg-white/75 shadow-[0_1px_2px_rgb(0_0_0/0.06)] dark:bg-white/[0.07]";

/** Ate quanto tempo depois de criada a tarefa ainda entra com animacao */
const ENTER_WINDOW_MS = 1000;
/** Duracao da entrada (a classe sai depois disso) */
const ENTER_MS = 250;

export const TaskCard = memo(function TaskCard({
  task,
  index,
  done,
  onUpdate,
  onDelete,
  onPickDay,
  leaving = false,
  appear = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  // So tarefa recem-criada (ou devolvida pelo Desfazer) entra com animacao, e
  // a classe sai logo depois: mudar de coluna (remonta o card) ou mover a
  // coluna (reinsere no DOM) nao pode repetir a entrada, senao o card "pisca"
  const [entering, setEntering] = useState(() => appear || Date.now() - task.createdAt < ENTER_WINDOW_MS);
  useEffect(() => {
    if (!entering) return;
    const timer = window.setTimeout(() => setEntering(false), ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [entering]);

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={editing || leaving}>
      {(provided, snapshot) => (
        // O elemento externo recebe o transform da lib; efeitos visuais ficam no interno.
        // Entrando e saindo, o externo anima a altura (os vizinhos acompanham)
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group/handle outline-none",
            "transition-[height,padding-bottom] ease-mac",
            (entering || leaving) && "overflow-clip [overflow-clip-margin:4px]",
            entering && "duration-200 starting:h-0 starting:pb-0",
            // pb-2 e pb-0 nunca juntas (no CSS a pb-2 venceria e a saida nao animaria)
            leaving ? "h-0 pb-0 duration-[180ms]" : "pb-2",
          )}
        >
          <div
            onDoubleClick={() => setEditing(true)}
            className={cn(
              cardSurface,
              "group/card relative px-3 py-2.5 text-[13px] leading-snug",
              // scale e rotate sao propriedades proprias no Tailwind v4 (nao transform):
              // com elas na transicao o card "assenta" suave ao ser solto
              "transition-[background-color,box-shadow,scale,rotate,opacity] duration-200 ease-mac",
              entering && "starting:scale-95 starting:opacity-0",
              leaving && "scale-95 opacity-0",
              "hover:bg-white/95 dark:hover:bg-white/[0.11]",
              snapshot.isDragging &&
                "scale-[1.03] rotate-[0.8deg] bg-white/95 shadow-[0_14px_34px_rgb(0_0_0/0.22)] dark:bg-[#3a3a3e]/95",
              "ring-sky-500/60 group-focus-visible/handle:ring-2",
              // editando, o card nao arrasta: nao mostra a mao de agarrar
              editing && "cursor-default ring-2",
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
                    <IconButton
                      label="Mover para outro dia"
                      onClick={(e) => onPickDay(task.id, e.currentTarget.getBoundingClientRect())}
                    >
                      <CalendarIcon width={13} height={13} />
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
