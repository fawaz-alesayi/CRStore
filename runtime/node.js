import SQLite from "better-sqlite3";
import { extensionPath } from "@vlcn.io/crsqlite";
/**
 * @param {string} file
 * @param {{ binding?: string; extension?: string; }} paths
 * @param {SQLite.Options} options
 * @returns {Promise<{ database: import('better-sqlite3').Database; env: "node"}>}
 */
export async function load(file, paths, options = {}) {
  /**
   * @type {SQLite.Options}
   */
  const databaseOptions = { nativeBinding: paths.binding, ...options }
  const database = new SQLite(file, databaseOptions);
  database.pragma("journal_mode = WAL");

  database.loadExtension(paths.extension || extensionPath);
  return { database, env: "node" };
}
