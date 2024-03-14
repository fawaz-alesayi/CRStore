/// <reference types="bun-types" />
/**
 * @param {string} file
 * @param {{ binding?: string; extension?: string; }} paths
 * @param {number | { readonly?: boolean; create?: boolean; readwrite?: boolean; }} options
 * @returns {Promise<{ database: SQLite, env: "bun" }>}
 */
export function load(file: string, paths: {
    binding?: string;
    extension?: string;
}, options?: number | {
    readonly?: boolean;
    create?: boolean;
    readwrite?: boolean;
}): Promise<{
    database: SQLite;
    env: "bun";
}>;
import SQLite from "bun:sqlite";
