import { invoke, isTauri } from "@tauri-apps/api/core";

/** chaves antigas do localStorage (usadas so para migrar) */
const LS_V2 = "lokalban:board:v2";
const LS_V1 = "lokalban:board:v1";

export type RawBoard =
  | { kind: "v2"; data: unknown } // { columns, tasks }
  | { kind: "v1"; data: unknown } // { todo, doing, done }
  | null;

/**
 * No app: le %APPDATA%\com.lokalban.widget\board.json.
 * Se o arquivo ainda nao existe, migra do localStorage (versoes anteriores).
 * No navegador (preview): usa so o localStorage.
 */
export async function readBoard(): Promise<RawBoard> {
  if (isTauri()) {
    const json = await invoke<string | null>("load_board");
    if (json) return { kind: "v2", data: JSON.parse(json) };
  }
  const v2 = localStorage.getItem(LS_V2);
  if (v2) return { kind: "v2", data: JSON.parse(v2) };
  const v1 = localStorage.getItem(LS_V1);
  if (v1) return { kind: "v1", data: JSON.parse(v1) };
  return null;
}

export async function writeBoard(board: unknown): Promise<void> {
  const json = JSON.stringify(board, null, 2);
  if (isTauri()) {
    await invoke("save_board", { json });
  } else {
    localStorage.setItem(LS_V2, json);
  }
}
