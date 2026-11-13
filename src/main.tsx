import React from "react";
import ReactDOM from "react-dom/client";
import { isTauri } from "@tauri-apps/api/core";
import "@fontsource-variable/inter";
import "./index.css";
import App from "./App";
import { applyTheme, applyWindowTheme, readCachedTheme } from "./lib/theme";

// Fora do Tauri (navegador comum) ativa o "papel de parede" de preview
if (!isTauri()) {
  document.documentElement.classList.add("browser-preview");
}

// Tema antes do primeiro quadro (a janela aparece antes do board.json ser lido)
const cachedTheme = readCachedTheme();
applyTheme(cachedTheme);
applyWindowTheme(cachedTheme);

// No app instalado, esconde o menu de clique direito do navegador
// (mantido em campos de texto para copiar/colar)
if (import.meta.env.PROD) {
  document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest("input, textarea")) e.preventDefault();
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
