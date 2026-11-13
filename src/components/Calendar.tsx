import { useEffect, useState } from "react";
import { dayKey, formatDayShort, formatMonth, parseDay, type DayKey } from "../lib/date";
import { cn } from "../lib/cn";
import { IconButton } from "./IconButton";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

type Props = {
  value: DayKey;
  today: DayKey;
  /** dias que ganham um pontinho (tem tarefas) */
  marked?: Set<DayKey>;
  onSelect: (day: DayKey) => void;
};

/**
 * Grade do mes no estilo do Calendario do macOS: semana comeca no domingo,
 * hoje em vermelho, dia escolhido preenchido. Sempre 6 linhas, para o
 * popover nao mudar de altura ao trocar de mes.
 */
export function Calendar({ value, today, marked, onSelect }: Props) {
  const [view, setView] = useState(() => monthOf(value));

  // acompanha mudancas de fora (ex.: virada do dia)
  useEffect(() => setView(monthOf(value)), [value]);

  const shift = (delta: number) => setView((v) => monthOf(dayKey(new Date(v.year, v.month + delta, 1))));

  const goToday = () => {
    setView(monthOf(today));
    onSelect(today);
  };

  const first = new Date(view.year, view.month, 1);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(view.year, view.month, i - first.getDay() + 1);
    return date.getMonth() === view.month ? dayKey(date) : null;
  });

  return (
    <div>
      <div className="flex items-center pb-2 pl-1">
        <h3 className="text-[13px] font-semibold tracking-tight text-black/80 dark:text-white/85">
          {formatMonth(view.year, view.month)}
        </h3>
        <div className="ml-auto flex items-center">
          <IconButton label="Mês anterior" onClick={() => shift(-1)}>
            <ChevronLeftIcon width={12} height={12} />
          </IconButton>
          <button
            type="button"
            onClick={goToday}
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium text-black/60 dark:text-white/65",
              "transition-colors duration-150 ease-mac",
              "hover:bg-black/[0.06] hover:text-black/80 active:bg-black/10 dark:hover:bg-white/10 dark:hover:text-white/90",
              "focus-visible:outline-2 focus-visible:outline-sky-500",
            )}
          >
            Hoje
          </button>
          <IconButton label="Próximo mês" onClick={() => shift(1)}>
            <ChevronRightIcon width={12} height={12} />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-7 pb-1 text-center text-[10px] font-semibold text-black/35 dark:text-white/35">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((key, i) => {
          if (!key) return <span key={i} className="h-7" />;
          const selected = key === value;
          const isToday = key === today;
          return (
            <button
              key={key}
              type="button"
              aria-label={formatDayShort(key)}
              aria-pressed={selected}
              onClick={() => onSelect(key)}
              className={cn(
                "relative mx-auto grid size-7 place-items-center rounded-full text-[12px] tabular-nums",
                "transition-colors duration-150 ease-mac",
                "focus-visible:outline-2 focus-visible:outline-sky-500",
                selected
                  ? cn("font-semibold text-white", isToday ? "bg-red-500" : "bg-sky-500")
                  : cn(
                      "hover:bg-black/[0.06] dark:hover:bg-white/10",
                      isToday ? "font-semibold text-red-500 dark:text-red-400" : "text-black/75 dark:text-white/80",
                    ),
              )}
            >
              {parseDay(key).getDate()}
              {marked?.has(key) && (
                <span
                  className={cn(
                    "absolute bottom-0.5 size-1 rounded-full",
                    selected ? "bg-white/80" : "bg-black/25 dark:bg-white/30",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function monthOf(key: DayKey) {
  const d = parseDay(key);
  return { year: d.getFullYear(), month: d.getMonth() };
}
