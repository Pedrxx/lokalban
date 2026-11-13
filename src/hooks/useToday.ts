import { useEffect, useState } from "react";
import { dayKey, type DayKey } from "../lib/date";

/**
 * Dia de hoje que se atualiza sozinho: na virada da meia-noite e quando a
 * janela volta a ter foco (o timer pode atrasar se o PC ficou suspenso)
 */
export function useToday(): DayKey {
  const [today, setToday] = useState(dayKey);

  useEffect(() => {
    let timer: number | undefined;
    const check = () => setToday(dayKey());
    const schedule = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = window.setTimeout(
        () => {
          check();
          schedule();
        },
        midnight.getTime() - now.getTime() + 1000,
      );
    };

    schedule();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return today;
}
