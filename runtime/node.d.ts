/**
 * @param {string} file
 * @param {{ binding?: string; extension?: string; }} paths
 * @param {SQLite.Options} options
 * @returns {Promise<{ database: import('better-sqlite3').Database; env: "node"}>}
 */
export function load(file: string, paths: {
    binding?: string;
    extension?: string;
}, options?: SQLite.Options): Promise<{
    database: import('better-sqlite3').Database;
    env: "node";
}>;
