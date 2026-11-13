import { COLOR_KEYS, COLOR_NAMES, COLUMN_COLORS, type ColumnColor } from "../types";
import { cn } from "../lib/cn";
import { popoverMotion } from "../lib/motion";

type Props = {
  open: boolean;
  value: ColumnColor;
  onSelect: (color: ColumnColor) => void;
  className?: string;
};

/**
 * Popover pequeno com a paleta de destaque do macOS. A cor escolhida ganha
 * o pontinho branco no centro, como em Ajustes > Aparencia
 */
export function ColorPicker({ open, value, onSelect, className }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Cor da coluna"
      className={cn(
        "gap-2 rounded-xl p-2.5",
        "glass-edge bg-white/95 shadow-[0_10px_30px_rgb(0_0_0/0.22)] dark:bg-[#323236]/95",
        // fechado fica display:none (popoverMotion); o flex so quando aberto
        open && "flex",
        popoverMotion(open),
        className,
      )}
    >
      {COLOR_KEYS.map((key) => {
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={COLOR_NAMES[key]}
            title={COLOR_NAMES[key]}
            onClick={() => onSelect(key)}
            className={cn(
              "grid size-4 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]",
              "transition-transform duration-150 ease-spring hover:scale-115 active:scale-95",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
              COLUMN_COLORS[key],
            )}
          >
            {selected && <span className="size-1.5 rounded-full bg-white" />}
          </button>
        );
      })}
    </div>
  );
}
