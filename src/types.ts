import type { DayKey } from "./lib/date";

export type ColumnId = string;

export type Task = {
  id: string;
  title: string;
  createdAt: number;
  /** dia em que a tarefa aparece no quadro */
  date: DayKey;
};

/** Cores disponiveis para a bolinha da coluna (classes estaticas p/ o Tailwind) */
export const COLUMN_COLORS = {
  sky: "bg-sky-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  violet: "bg-violet-400",
  rose: "bg-rose-400",
  slate: "bg-slate-400",
} as const;

export type ColumnColor = keyof typeof COLUMN_COLORS;
export const COLOR_KEYS = Object.keys(COLUMN_COLORS) as ColumnColor[];

export type ColumnDef = {
  id: ColumnId;
  title: string;
  color: ColumnColor;
  /** tarefas desta coluna aparecem riscadas (ex.: "Concluido") */
  done?: boolean;
};

export type BoardState = {
  columns: ColumnDef[];
  tasks: Record<ColumnId, Task[]>;
};

export const MAX_COLUMNS = 5;

export const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: "todo", title: "A Fazer", color: "sky" },
  { id: "doing", title: "Em Andamento", color: "amber" },
  { id: "done", title: "Concluído", color: "emerald", done: true },
];
