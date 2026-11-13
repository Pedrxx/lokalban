import { useEffect } from "react";
import type { DayKey } from "../lib/date";
import { cn } from "../lib/cn";
import { Calendar } from "./Calendar";

type Props = {
  open: boolean;
  onClose: () => void;
  day: DayKey;
  today: DayKey;
  markedDays: Set<DayKey>;
  onSelect: (day: DayKey) => void;
};

/** Popover do icone de calendario: escolher qual dia o quadro mostra */
export function CalendarPopover({ open, onClose, day, today, markedDays, onSelect }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* clique fora fecha */}
      <div className="absolute inset-0 z-20" onMouseDown={onClose} />

      <div
        role="dialog"
        aria-label="Calendário"
        className={cn(
          "absolute top-11 right-3 z-30 w-64 origin-top-right rounded-xl p-3",
          "glass-edge bg-white/90 shadow-[0_18px_48px_rgb(0_0_0/0.25)] dark:bg-[#2a2a2d]/95",
          "transition-[opacity,scale,translate] duration-200 ease-mac",
          "starting:-translate-y-1 starting:scale-[0.97] starting:opacity-0",
        )}
      >
        <Calendar value={day} today={today} marked={markedDays} onSelect={onSelect} />
      </div>
    </>
  );
}
