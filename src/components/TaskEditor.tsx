import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  initial?: string;
  placeholder?: string;
  /** chamado com o texto ja aparado (nunca vazio) */
  onSubmit: (title: string) => void;
  /** fecha o editor (Esc, clique fora ou depois de salvar) */
  onClose: () => void;
  /** true = depois do Enter limpa e continua aberto (criar varias em sequencia) */
  stayOpen?: boolean;
};

/**
 * Campo de texto que cresce sozinho.
 * Enter salva - Shift+Enter quebra linha - Esc cancela - clicar fora salva.
 */
export function TaskEditor({ initial = "", placeholder = "Descreva a tarefa…", onSubmit, onClose, stayOpen }: Props) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  const finished = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const finish = (save: boolean) => {
    if (finished.current) return;
    const text = value.trim();
    if (save && text) onSubmit(text);
    finished.current = true;
    onClose();
  };

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const text = value.trim();
          if (stayOpen && text) {
            onSubmit(text);
            setValue("");
          } else {
            finish(true);
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
        }
      }}
      className="block w-full resize-none overflow-hidden bg-transparent text-[13px] leading-snug outline-none select-text placeholder:text-black/35 dark:placeholder:text-white/35"
    />
  );
}
