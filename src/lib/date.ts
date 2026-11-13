/** Dia no formato "AAAA-MM-DD", sempre no horario local */
export type DayKey = string;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(date: Date = new Date()): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isDayKey(value: unknown): value is DayKey {
  return typeof value === "string" && DAY_RE.test(value);
}

/** Converte de volta para Date (meia-noite local) */
export function parseDay(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "ter., 10 de nov." */
export function formatDayShort(key: DayKey): string {
  return parseDay(key).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

/** "novembro de 2026" */
export function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
