import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DayKey } from "../lib/date";
import { cn } from "../lib/cn";
import { Calendar } from "./Calendar";

const GAP = 6;
const MARGIN = 8;

type Props = {
  /** botao do card que abriu o popover; null = fechado */
  anchor: DOMRect | null;
  /** dia atual da tarefa */
  value: DayKey;
  today: DayKey;
  markedDays: Set<DayKey>;
  onSelect: (day: DayKey) => void;
  onClose: () => void;
};

/**
 * Mini calendario do card para levar a tarefa a outro dia. Abre abaixo do
 * botao (ou acima, se nao couber) e fecha ao escolher.
 */
export function MoveDayPopover({ anchor, value, today, markedDays, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);

  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anchor, onClose]);

  // posiciona antes de pintar, ja sabendo o tamanho do popover
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return setPos(null);
    const { offsetWidth: w, offsetHeight: h } = ref.current;
    const left = Math.min(Math.max(anchor.right - w, MARGIN), window.innerWidth - w - MARGIN);
    const above = anchor.bottom + GAP + h > window.innerHeight - MARGIN;
    const top = above ? Math.max(anchor.top - GAP - h, MARGIN) : anchor.bottom + GAP;
    setPos({ top, left, above });
  }, [anchor]);

  if (!anchor) return null;

  return (
    <>
      {/* clique fora fecha */}
      <div className="fixed inset-0 z-20" onMouseDown={onClose} />

      <div
        ref={ref}
        role="dialog"
        aria-label="Mover para outro dia"
        style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}
        className={cn(
          "fixed z-30 w-64 rounded-xl p-3",
          pos?.above ? "origin-bottom-right" : "origin-top-right",
          "glass-edge bg-white/90 shadow-[0_18px_48px_rgb(0_0_0/0.25)] dark:bg-[#2a2a2d]/95",
          "transition-[opacity,scale,translate] duration-200 ease-mac",
          "starting:-translate-y-1 starting:scale-[0.97] starting:opacity-0",
        )}
      >
        <Calendar
          value={value}
          today={today}
          marked={markedDays}
          onSelect={(day) => {
            onSelect(day);
            onClose();
          }}
        />
      </div>
    </>
  );
}
