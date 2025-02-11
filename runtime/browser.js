import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";
import wasmSqlite, { SQLite3 } from "@vlcn.io/crsqlite-wasm";

/**
 * @param {string} file
 * @param {{ wasm?: string; }} paths
 * @returns {Promise<{ database: SQLite3, env: "browser" }>}
 */
export async function load(file, paths) {
  const sqlite = await wasmSqlite(() => paths.wasm || wasmUrl);
  const database = await sqlite.open(file);
  return { database, env: "browser" };
}
