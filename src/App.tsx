import { useCallback, useEffect, useState } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { GlassWindow } from "./components/GlassWindow";
import { TitleBar } from "./components/TitleBar";
import { Column } from "./components/Column";
import { ColumnSettings } from "./components/ColumnSettings";
import { CalendarPopover } from "./components/CalendarPopover";
import { MoveDayPopover } from "./components/MoveDayPopover";
import { IconButton } from "./components/IconButton";
import { CalendarIcon, GearIcon, PinIcon, PlusIcon } from "./components/icons";
import { KeyTip, KeyTipsContext } from "./components/KeyTip";
import { SettingsPopover } from "./components/SettingsPopover";
import { UndoToast } from "./components/UndoToast";
import { useWindowControls } from "./hooks/useWindowControls";
import { useBoard } from "./hooks/useBoard";
import { useTheme } from "./hooks/useTheme";
import { useAltShortcuts } from "./hooks/useAltShortcuts";
import type { ColumnId } from "./types";
import { cn } from "./lib/cn";
import { addDays, formatDayShort, type DayKey } from "./lib/date";
import { prefersReducedMotion } from "./lib/motion";
import { applyScale } from "./lib/scale";

/** Popover aberto na barra de titulo (um por vez) */
type Panel = "calendar" | "columns" | "settings" | null;

const activeButton = "bg-black/[0.08] text-black/80 dark:bg-white/[0.12] dark:text-white/90";

/** Duracao da saida do card (excluir, levar a outro dia) antes de sair do quadro */
const LEAVE_MS = 180;
/** Quanto tempo o card devolvido pelo Desfazer fica marcado para entrar animado */
const APPEAR_MS = 400;

export default function App() {
  const board = useBoard();
  const { theme, scale, pinnedOnTop, closeToTray, showInTaskbar } = board.settings;
  const win = useWindowControls({
    scale,
    pinnedOnTop,
    closeToTray,
    showInTaskbar,
    onPinnedChange: board.setPinnedOnTop,
  });
  useTheme(theme, board.ready);

  // escala do board.json (antes de ler, vale a copia aplicada no main.tsx)
  useEffect(() => {
    if (board.ready) applyScale(scale);
  }, [board.ready, scale]);
  const [composing, setComposing] = useState<ColumnId | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  /** tarefa cujo mini calendario esta aberto, e o botao onde ancorar */
  const [picking, setPicking] = useState<{ id: string; anchor: DOMRect } | null>(null);

  const { collapsed, toggleCollapse } = win;
  const firstColumn = board.columns[0]?.id ?? null;

  const newTask = useCallback(() => {
    if (collapsed) toggleCollapse();
    setPanel(null);
    setPicking(null);
    setComposing(firstColumn);
  }, [collapsed, toggleCollapse, firstColumn]);

  const togglePanel = useCallback(
    (which: Exclude<Panel, null>) => {
      if (collapsed) toggleCollapse();
      setPanel((p) => (p === which ? null : which));
    },
    [collapsed, toggleCollapse],
  );

  const closePanel = useCallback(() => setPanel(null), []);
  const pickDay = useCallback((id: string, anchor: DOMRect) => setPicking({ id, anchor }), []);
  const closePicker = useCallback(() => setPicking(null), []);

  // Saida e volta animadas: o card anima e so depois a tarefa sai do quadro
  // (excluir, levar a outro dia); no Desfazer ela volta e entra animada
  const [leavingIds, setLeavingIds] = useState<Set<string>>(() => new Set());
  const [appearingIds, setAppearingIds] = useState<Set<string>>(() => new Set());
  const markFor = useCallback((set: typeof setLeavingIds, id: string, ms: number, then?: () => void) => {
    set((s) => new Set(s).add(id));
    window.setTimeout(
      () => {
        then?.();
        set((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
      },
      prefersReducedMotion() ? 0 : ms,
    );
  }, []);
  const { deleteTask, moveTaskToDay, undo, lastAction } = board;
  const removeTask = useCallback(
    (id: string) => markFor(setLeavingIds, id, LEAVE_MS, () => deleteTask(id)),
    [markFor, deleteTask],
  );
  const moveToDay = useCallback(
    (id: string, to: DayKey) => {
      if (to === board.day) return;
      markFor(setLeavingIds, id, LEAVE_MS, () => moveTaskToDay(id, to));
    },
    [markFor, moveTaskToDay, board.day],
  );
  const undoWithEntry = useCallback(() => {
    const id = lastAction?.task.id;
    undo();
    if (id) markFor(setAppearingIds, id, APPEAR_MS);
  }, [markFor, undo, lastAction]);

  // um so contexto de arrasto: colunas (pelo topo) e tarefas
  const { moveColumn, moveTask } = board;
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (result.type !== "COLUMN") return moveTask(result);
      if (result.destination) moveColumn(result.source.index, result.destination.index);
    },
    [moveColumn, moveTask],
  );

  // com "Pendentes vao para hoje" ligada, pendente nao vai para o passado
  const pickingColumn = picking && board.columns.find((c) => board.tasks[c.id]?.some((t) => t.id === picking.id));
  const minDay = pickingColumn && !pickingColumn.done && board.settings.pendingToToday ? board.today : undefined;

  // Atalhos com Alt (segurar Alt mostra as teclas sobre os botoes)
  const { setDay, today, day } = board;
  const showTips = useAltShortcuts({
    KeyN: newTask,
    KeyC: () => togglePanel("columns"),
    KeyD: () => togglePanel("calendar"),
    Comma: () => togglePanel("settings"),
    KeyH: () => setDay(today),
    ArrowLeft: () => setDay(addDays(day, -1)),
    ArrowRight: () => setDay(addDays(day, 1)),
    KeyF: win.togglePin,
    KeyR: win.toggleCollapse,
    // mesmo que o botao vermelho: segue a opcao "Ao fechar"
    KeyE: win.close,
  });

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

  return (
    <GlassWindow maximized={win.maximized}>
      <KeyTipsContext.Provider value={showTips}>
        <TitleBar
          title="LokalBan"
          focused={win.focused}
          collapsed={win.collapsed}
          maximized={win.maximized}
          closeToTray={closeToTray}
          onClose={win.close}
          onCollapse={win.toggleCollapse}
          onToggleMaximize={win.toggleMaximize}
          actions={
            <>
              {board.day !== board.today && (
                <button
                  type="button"
                  title="Voltar para hoje (Alt+H)"
                  onClick={() => board.setDay(board.today)}
                  className={cn(
                    "relative flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-black/55 dark:bg-white/10 dark:text-white/60",
                    "transition-colors duration-150 ease-mac hover:bg-black/[0.08] hover:text-black/75 dark:hover:bg-white/15 dark:hover:text-white/80",
                    "focus-visible:outline-2 focus-visible:outline-sky-500",
                  )}
                >
                  <CalendarIcon width={10} height={10} strokeWidth={1.75} />
                  {formatDayShort(board.day)}
                  <KeyTip keys="H" />
                </button>
              )}
              <IconButton
                label="Colunas (Alt+C)"
                onClick={() => togglePanel("columns")}
                keyTip="C"
                className={cn(panel === "columns" && activeButton)}
              >
                <PlusIcon />
              </IconButton>
              <IconButton
                label="Calendário (Alt+D · Alt+← e Alt+→ trocam o dia)"
                onClick={() => togglePanel("calendar")}
                keyTip={"D\n← →"}
                className={cn(panel === "calendar" && activeButton)}
              >
                <CalendarIcon />
              </IconButton>
              <IconButton
                label="Configurações (Alt+,)"
                onClick={() => togglePanel("settings")}
                keyTip=","
                className={cn(panel === "settings" && activeButton)}
              >
                <GearIcon />
              </IconButton>
              <IconButton
                label={
                  pinnedOnTop ? "Desafixar (volta para trás das janelas) (Alt+F)" : "Fixar acima das janelas (Alt+F)"
                }
                onClick={win.togglePin}
                keyTip="F"
                className={cn(pinnedOnTop && "text-sky-500! dark:text-sky-400!")}
              >
                <PinIcon width={13} height={13} />
              </IconButton>
            </>
          }
        />

        {!board.ready ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-[12px] text-black/45 dark:text-white/45">
            {board.loadError ? `Não foi possível ler as tarefas salvas: ${board.loadError}` : null}
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="board" type="COLUMN" direction="horizontal">
              {(provided) => (
                // flex com espaco por padding (a lib nao considera o gap ao deslocar as colunas)
                <main
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex min-h-0 flex-1 px-1.5 pb-3",
                    "transition-opacity duration-300 ease-mac",
                    win.collapsed && "pointer-events-none opacity-0",
                  )}
                >
                  {board.columns.map((col, index) => (
                    <Column
                      key={col.id}
                      column={col}
                      index={index}
                      tasks={board.tasks[col.id] ?? []}
                      composing={composing === col.id}
                      onStartCompose={() => setComposing(col.id)}
                      onEndCompose={() => setComposing((c) => (c === col.id ? null : c))}
                      onAdd={(title) => board.addTask(col.id, title)}
                      onUpdate={board.updateTask}
                      onDelete={removeTask}
                      onPickDay={pickDay}
                      leavingIds={leavingIds}
                      appearingIds={appearingIds}
                    />
                  ))}
                  {provided.placeholder}
                </main>
              )}
            </Droppable>
          </DragDropContext>
        )}

        <CalendarPopover
          open={panel === "calendar"}
          onClose={closePanel}
          day={board.day}
          today={board.today}
          markedDays={board.markedDays}
          onSelect={board.setDay}
          pendingToToday={board.settings.pendingToToday}
          onPendingToTodayChange={board.setPendingToToday}
        />

        <MoveDayPopover
          anchor={picking?.anchor ?? null}
          value={board.day}
          today={board.today}
          markedDays={board.markedDays}
          minDay={minDay}
          onSelect={(day) => picking && moveToDay(picking.id, day)}
          onClose={closePicker}
        />

        <SettingsPopover
          open={panel === "settings"}
          onClose={closePanel}
          theme={theme}
          onThemeChange={board.setTheme}
          scale={scale}
          onScaleChange={board.setScale}
          closeToTray={closeToTray}
          onCloseToTrayChange={board.setCloseToTray}
          showInTaskbar={showInTaskbar}
          onShowInTaskbarChange={board.setShowInTaskbar}
        />

        <ColumnSettings
          open={panel === "columns"}
          onClose={closePanel}
          day={board.day}
          columns={board.columns}
          locked={board.lockedColumns}
          taskCounts={board.taskTotals}
          onAdd={board.addColumn}
          onRename={board.renameColumn}
          onRecolor={board.recolorColumn}
          onToggleDone={board.setColumnDone}
          onTogglePin={board.setColumnPinned}
          onMove={board.moveColumn}
          onDelete={board.deleteColumn}
        />

        <UndoToast action={board.lastAction} today={board.today} onUndo={undoWithEntry} onDismiss={board.dismissUndo} />
      </KeyTipsContext.Provider>
    </GlassWindow>
  );
}
