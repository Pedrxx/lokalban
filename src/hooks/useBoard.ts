import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import {
  COLOR_KEYS,
  DEFAULT_COLUMNS,
  MAX_COLUMNS,
  type BoardState,
  type ColumnColor,
  type ColumnDef,
  type ColumnId,
  type Task,
} from "../types";
import { readBoard, writeBoard, type RawBoard } from "../lib/storage";
import { dayKey, isDayKey, type DayKey } from "../lib/date";
import { useToday } from "./useToday";

function isTask(value: unknown): value is Task {
  const t = value as Task;
  return typeof t === "object" && t !== null && typeof t.id === "string" && typeof t.title === "string";
}

function isColumn(value: unknown): value is ColumnDef {
  const c = value as ColumnDef;
  return typeof c === "object" && c !== null && typeof c.id === "string" && typeof c.title === "string";
}

/** Tarefas sem data (versoes anteriores ao calendario) passam a ser de hoje */
function withDate(task: Task, today: DayKey): Task {
  return isDayKey(task.date) ? task : { ...task, date: today };
}

function withDefaults(columns: ColumnDef[], rawTasks: Record<string, unknown>): BoardState {
  const today = dayKey();
  const tasks: Record<ColumnId, Task[]> = {};
  for (const col of columns) {
    const list = rawTasks[col.id];
    tasks[col.id] = Array.isArray(list) ? list.filter(isTask).map((t) => withDate(t, today)) : [];
  }
  return { columns, tasks };
}

/** Converte o que foi lido do disco (qualquer versao) e ignora dados malformados */
function parseBoard(raw: RawBoard): BoardState {
  if (raw?.kind === "v2") {
    const data = (raw.data ?? {}) as { columns?: unknown; tasks?: Record<string, unknown> };
    const columns = Array.isArray(data.columns)
      ? data.columns.filter(isColumn).map((c) => ({
          ...c,
          color: COLOR_KEYS.includes(c.color) ? c.color : "slate",
        }))
      : [];
    if (columns.length > 0) return withDefaults(columns, data.tasks ?? {});
  }
  if (raw?.kind === "v1") {
    return withDefaults(DEFAULT_COLUMNS, (raw.data ?? {}) as Record<string, unknown>);
  }
  return withDefaults(DEFAULT_COLUMNS, {});
}

export type DeletedTask = { task: Task; column: ColumnId; index: number };

export function useBoard() {
  const [state, setState] = useState<BoardState>(() => withDefaults(DEFAULT_COLUMNS, {}));
  /** so libera a tela (e o salvamento) depois de ler o arquivo */
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<DeletedTask | null>(null);

  // Dia exibido no quadro. Sempre abre em hoje e acompanha a virada do dia
  const today = useToday();
  const [day, setDay] = useState<DayKey>(today);
  const prevToday = useRef(today);
  useEffect(() => {
    const prev = prevToday.current;
    prevToday.current = today;
    setDay((d) => (d === prev ? today : d));
  }, [today]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const dayRef = useRef(day);
  dayRef.current = day;
  const lastDeletedRef = useRef(lastDeleted);
  lastDeletedRef.current = lastDeleted;

  // Carrega uma vez ao abrir
  useEffect(() => {
    let cancelled = false;
    readBoard()
      .then((raw) => {
        if (cancelled) return;
        setState(parseBoard(raw));
        setReady(true);
      })
      .catch((err) => {
        // Nao libera o salvamento: assim um erro de leitura nunca apaga o arquivo
        console.error("Falha ao ler as tarefas salvas:", err);
        if (!cancelled) setLoadError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persistencia: salva a cada mudanca (depois de carregado)
  useEffect(() => {
    if (!ready) return;
    writeBoard(state).catch((err) => console.error("Falha ao salvar as tarefas:", err));
  }, [state, ready]);

  // ---------------------------------------------------------------- tarefas

  const addTask = useCallback((column: ColumnId, title: string) => {
    const text = title.trim();
    if (!text) return;
    const task: Task = { id: crypto.randomUUID(), title: text, createdAt: Date.now(), date: dayRef.current };
    setState((s) => (s.tasks[column] ? { ...s, tasks: { ...s.tasks, [column]: [...s.tasks[column], task] } } : s));
  }, []);

  const updateTask = useCallback((id: string, title: string) => {
    const text = title.trim();
    if (!text) return;
    setState((s) => {
      const tasks: BoardState["tasks"] = {};
      for (const [col, list] of Object.entries(s.tasks)) {
        tasks[col] = list.map((t) => (t.id === id ? { ...t, title: text } : t));
      }
      return { ...s, tasks };
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    for (const [column, list] of Object.entries(stateRef.current.tasks)) {
      const index = list.findIndex((t) => t.id === id);
      if (index >= 0) {
        setLastDeleted({ task: list[index], column, index });
        setState((s) => ({ ...s, tasks: { ...s.tasks, [column]: s.tasks[column].filter((t) => t.id !== id) } }));
        return;
      }
    }
  }, []);

  const undoDelete = useCallback(() => {
    const deleted = lastDeletedRef.current;
    if (!deleted) return;
    const { task, column, index } = deleted;
    setState((s) => {
      const target = s.tasks[column];
      // coluna excluida nesse meio tempo, ou tarefa ja restaurada
      if (!target || Object.values(s.tasks).some((l) => l.some((t) => t.id === task.id))) return s;
      const list = [...target];
      list.splice(Math.min(index, list.length), 0, task);
      return { ...s, tasks: { ...s.tasks, [column]: list } };
    });
    setLastDeleted(null);
  }, []);

  const dismissUndo = useCallback(() => setLastDeleted(null), []);

  /**
   * Handler do onDragEnd do DragDropContext. Os indices do arrasto sao da
   * lista do dia exibido; aqui viram posicoes na lista completa da coluna.
   */
  const moveTask = useCallback(({ source, destination }: DropResult) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const from = source.droppableId;
    const to = destination.droppableId;
    const shown = dayRef.current;

    setState((s) => {
      if (!s.tasks[from] || !s.tasks[to]) return s;
      const moved = s.tasks[from].filter((t) => t.date === shown)[source.index];
      if (!moved) return s;
      const src = s.tasks[from].filter((t) => t.id !== moved.id);
      const dst = from === to ? src : [...s.tasks[to]];

      // entra antes da tarefa que hoje ocupa a posicao de destino no dia,
      // ou logo depois da ultima tarefa do dia
      const sameDay = dst.filter((t) => t.date === shown);
      const anchor = sameDay[destination.index];
      const last = sameDay[sameDay.length - 1];
      const at = anchor ? dst.indexOf(anchor) : last ? dst.indexOf(last) + 1 : dst.length;
      dst.splice(at, 0, moved);

      return { ...s, tasks: { ...s.tasks, [from]: src, [to]: dst } };
    });
  }, []);

  // ---------------------------------------------------------------- colunas

  /** Cria uma coluna e devolve o id (ou null se ja chegou no limite) */
  const addColumn = useCallback((): ColumnId | null => {
    const { columns } = stateRef.current;
    if (columns.length >= MAX_COLUMNS) return null;
    const used = new Set(columns.map((c) => c.color));
    const color = COLOR_KEYS.find((k) => !used.has(k)) ?? "slate";
    const column: ColumnDef = { id: crypto.randomUUID(), title: "Nova coluna", color };
    setState((s) => ({ columns: [...s.columns, column], tasks: { ...s.tasks, [column.id]: [] } }));
    return column.id;
  }, []);

  const updateColumn = useCallback((id: ColumnId, patch: Partial<Omit<ColumnDef, "id">>) => {
    if (patch.title !== undefined) {
      patch = { ...patch, title: patch.title.trim() };
      if (!patch.title) return;
    }
    setState((s) => ({ ...s, columns: s.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }, []);

  const renameColumn = useCallback((id: ColumnId, title: string) => updateColumn(id, { title }), [updateColumn]);
  const recolorColumn = useCallback((id: ColumnId, color: ColumnColor) => updateColumn(id, { color }), [updateColumn]);
  const setColumnDone = useCallback((id: ColumnId, done: boolean) => updateColumn(id, { done }), [updateColumn]);

  /** Exclui a coluna e as tarefas dela (sempre sobra pelo menos uma coluna) */
  const deleteColumn = useCallback((id: ColumnId) => {
    setState((s) => {
      if (s.columns.length <= 1) return s;
      const { [id]: _removed, ...tasks } = s.tasks;
      return { columns: s.columns.filter((c) => c.id !== id), tasks };
    });
  }, []);

  // ---------------------------------------------------------------- dias

  /** Tarefas do dia exibido, por coluna */
  const dayTasks = useMemo(() => {
    const tasks: BoardState["tasks"] = {};
    for (const [col, list] of Object.entries(state.tasks)) tasks[col] = list.filter((t) => t.date === day);
    return tasks;
  }, [state.tasks, day]);

  /** Total de tarefas por coluna, somando todos os dias */
  const taskTotals = useMemo(
    () => Object.fromEntries(Object.entries(state.tasks).map(([col, list]) => [col, list.length])),
    [state.tasks],
  );

  /** Dias que tem alguma tarefa (pontinhos do calendario) */
  const markedDays = useMemo(
    () => new Set(Object.values(state.tasks).flatMap((list) => list.map((t) => t.date))),
    [state.tasks],
  );

  return {
    ready,
    loadError,
    today,
    day,
    setDay,
    markedDays,
    columns: state.columns,
    tasks: dayTasks,
    taskTotals,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    lastDeleted,
    undoDelete,
    dismissUndo,
    addColumn,
    renameColumn,
    recolorColumn,
    setColumnDone,
    deleteColumn,
  };
}
