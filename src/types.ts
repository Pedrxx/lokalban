import type { DayKey } from "./lib/date";

export type ColumnId = string;

export type Task = {
  id: string;
  title: string;
  createdAt: number;
  /** dia em que a tarefa aparece no quadro */
  date: DayKey;
};

/**
 * Cores da bolinha da coluna, na ordem da paleta de destaque do macOS
 * (classes estaticas p/ o Tailwind). As chaves ficam no board.json
 */
export const COLUMN_COLORS = {
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  rose: "bg-rose-400",
  red: "bg-red-500",
  orange: "bg-orange-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  slate: "bg-slate-400",
} as const;

export type ColumnColor = keyof typeof COLUMN_COLORS;
export const COLOR_KEYS = Object.keys(COLUMN_COLORS) as ColumnColor[];

/** Nomes das cores (dicas do seletor) */
export const COLOR_NAMES: Record<ColumnColor, string> = {
  sky: "Azul",
  violet: "Roxo",
  rose: "Rosa",
  red: "Vermelho",
  orange: "Laranja",
  amber: "Amarelo",
  emerald: "Verde",
  slate: "Grafite",
};

export type ColumnDef = {
  id: ColumnId;
  title: string;
  color: ColumnColor;
  /** tarefas desta coluna aparecem riscadas (ex.: "Concluido") */
  done?: boolean;
  /** primeiro dia em que a coluna aparece (sem = desde sempre) */
  from?: DayKey;
  /** ultimo dia em que a coluna aparece (sem = fixa, segue nos proximos dias) */
  until?: DayKey;
};

/** Preferencias salvas junto com o quadro (chave "settings" do board.json) */
export type Settings = {
  /** pendentes de dias passados vao para hoje */
  pendingToToday: boolean;
};

export const DEFAULT_SETTINGS: Settings = { pendingToToday: true };

export type BoardState = {
  columns: ColumnDef[];
  tasks: Record<ColumnId, Task[]>;
  settings: Settings;
};

export const MAX_COLUMNS = 5;

export const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: "todo", title: "A Fazer", color: "sky" },
  { id: "doing", title: "Em Andamento", color: "amber" },
  { id: "done", title: "Concluído", color: "emerald", done: true },
];
