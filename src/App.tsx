import { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { GlassWindow } from "./components/GlassWindow";
import { TitleBar } from "./components/TitleBar";
import { Column } from "./components/Column";
import { ColumnSettings } from "./components/ColumnSettings";
import { IconButton } from "./components/IconButton";
import { GearIcon, PlusIcon } from "./components/icons";
import { UndoToast } from "./components/UndoToast";
import { useWindowControls } from "./hooks/useWindowControls";
import { useBoard } from "./hooks/useBoard";
import type { ColumnId } from "./types";
import { cn } from "./lib/cn";

export default function App() {
  const win = useWindowControls();
  const board = useBoard();
  const [composing, setComposing] = useState<ColumnId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { collapsed, toggleCollapse } = win;
  const firstColumn = board.columns[0]?.id ?? null;

  const newTask = useCallback(() => {
    if (collapsed) toggleCollapse();
    setSettingsOpen(false);
    setComposing(firstColumn);
  }, [collapsed, toggleCollapse, firstColumn]);

  const toggleSettings = useCallback(() => {
    if (collapsed) toggleCollapse();
    setSettingsOpen((o) => !o);
  }, [collapsed, toggleCollapse]);

  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // Ctrl+N cria uma tarefa na primeira coluna
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        newTask();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newTask]);

  const taskCounts = useMemo(
    () => Object.fromEntries(board.columns.map((c) => [c.id, board.tasks[c.id]?.length ?? 0])),
    [board.columns, board.tasks],
  );

  return (
    <GlassWindow>
      <TitleBar
        title="LokalBan"
        focused={win.focused}
        collapsed={win.collapsed}
        pinnedOnTop={win.pinnedOnTop}
        onClose={win.close}
        onCollapse={win.toggleCollapse}
        onTogglePin={win.togglePin}
        actions={
          <>
            <IconButton label="Nova tarefa (Ctrl+N)" onClick={newTask}>
              <PlusIcon />
            </IconButton>
            <IconButton
              label="Colunas"
              onClick={toggleSettings}
              className={cn(settingsOpen && "bg-black/[0.08] text-black/80 dark:bg-white/[0.12] dark:text-white/90")}
            >
              <GearIcon />
            </IconButton>
          </>
        }
      />

      {!board.ready ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-[12px] text-black/45 dark:text-white/45">
          {board.loadError ? `Não foi possível ler as tarefas salvas: ${board.loadError}` : null}
        </div>
      ) : (
        <DragDropContext onDragEnd={board.moveTask}>
          <main
            style={{ gridTemplateColumns: `repeat(${board.columns.length}, minmax(0, 1fr))` }}
            className={cn(
              "grid min-h-0 flex-1 gap-3 px-3 pb-3",
              "transition-opacity duration-300 ease-mac",
              win.collapsed && "pointer-events-none opacity-0",
            )}
          >
            {board.columns.map((col) => (
              <Column
                key={col.id}
                column={col}
                tasks={board.tasks[col.id] ?? []}
                composing={composing === col.id}
                onStartCompose={() => setComposing(col.id)}
                onEndCompose={() => setComposing((c) => (c === col.id ? null : c))}
                onAdd={(title) => board.addTask(col.id, title)}
                onUpdate={board.updateTask}
                onDelete={board.deleteTask}
              />
            ))}
          </main>
        </DragDropContext>
      )}

      <ColumnSettings
        open={settingsOpen}
        onClose={closeSettings}
        columns={board.columns}
        taskCounts={taskCounts}
        onAdd={board.addColumn}
        onRename={board.renameColumn}
        onRecolor={board.recolorColumn}
        onToggleDone={board.setColumnDone}
        onDelete={board.deleteColumn}
      />

      <UndoToast deleted={board.lastDeleted} onUndo={board.undoDelete} onDismiss={board.dismissUndo} />
    </GlassWindow>
  );
}
