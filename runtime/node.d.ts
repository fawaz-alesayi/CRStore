/**
 * @param {string} file
 * @param {{ binding?: string; extension?: string; }} paths
 * @param {SQLite.Options} options
 * @returns {Promise<{ database: Database, env: "node", }>}
 */
export function load(file: string, paths: {
    binding?: string;
    extension?: string;
}, options?: SQLite.Options): Promise<{
    database: Database;
    env: "node";
}>;
import { Database } from "better-sqlite3";
