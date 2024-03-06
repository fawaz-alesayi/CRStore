import type { Operation, Node, Change, EncodedChanges } from "../core/types.js";
import type { Kysely } from "kysely";
declare function encode(changes: Change[]): EncodedChanges;
declare function decode(encoded: EncodedChanges): {
    site_id: Uint8Array;
    cid: string;
    pk: Uint8Array;
    table: string;
    val: unknown;
    db_version: number;
    col_version: number;
    cl: number;
    seq: number;
}[];
declare function selectVersion(this: Kysely<any>): {
    execute: () => Promise<{
        current: number;
        synced: number;
    }>;
};
declare function updateVersion(this: Kysely<any>, version?: number): import("kysely").UpdateQueryBuilder<any, "__crstore_sync", "__crstore_sync", import("kysely").UpdateResult>;
declare function selectClient(this: Kysely<any>): {
    execute: () => Promise<string>;
};
declare function changesSince(this: Kysely<any>, since: number, { filter, chunk: areChunked, }?: {
    filter?: string | number | undefined;
    chunk?: boolean | undefined;
}): {
    execute: () => Promise<string | string[]>;
};
declare function insertChanges(this: Kysely<any>, changes: EncodedChanges): {
    execute: () => Promise<void>;
};
declare function resolveChanges(this: Kysely<any>, changes: EncodedChanges): {
    execute: () => Promise<string | string[]>;
};
declare function applyOperation<T extends any[], R>(this: Kysely<any>, operation: Operation<T, R>, ...args: T): {
    execute: () => Promise<{
        result: Awaited<R>;
        changes: string | string[];
    }>;
};
declare function finalize(this: Kysely<any>): {
    execute: () => Promise<import("kysely").QueryResult<unknown>>;
};
declare function affectedTables(target: Node | EncodedChanges): string[];
export { encode, decode, finalize, changesSince, selectClient, selectVersion, updateVersion, insertChanges, applyOperation, resolveChanges, affectedTables, };
