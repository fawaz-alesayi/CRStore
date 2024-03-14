/**
 * @param {string} file
 * @param {{ wasm?: string; }} paths
 * @returns {Promise<{ database: SQLite3, env: "browser" }>}
 */
export function load(file: string, paths: {
    wasm?: string;
}): Promise<{
    database: SQLite3;
    env: "browser";
}>;
import { SQLite3 } from "@vlcn.io/crsqlite-wasm";
