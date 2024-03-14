import { extensionPath } from "@vlcn.io/crsqlite";
import SQLite from "bun:sqlite";
import { platform } from "os";

/**
 * @param {string} file
 * @param {{ binding?: string; extension?: string; }} paths
 * @param {number | { readonly?: boolean; create?: boolean; readwrite?: boolean; }} options
 * @returns {Promise<{ database: SQLite, env: "bun" }>}
 */
export async function load(file, paths, options = {}) {
  if (platform() === "darwin") {
    SQLite.setCustomSQLite(
      paths.binding || "/opt/homebrew/opt/sqlite/lib/libsqlite3.dylib",
    );
  }

  const database = new SQLite(file, options);
  
  database.run("PRAGMA journal_mode = wal");
  database.loadExtension(paths.extension || extensionPath);

  const prepare = database.prepare.bind(database);
  database.prepare = (...args) =>
    Object.assign(prepare(...args), { reader: true });

  return { database, env: "bun" };
}
