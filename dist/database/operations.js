import { encode as genericEncode, decode as genericDecode, chunk, } from "./encoder.js";
import { sql } from "kysely";
const schema = [
    ["site_id", "object"],
    ["cid", "string"],
    ["pk", "object"],
    ["table", "string"],
    ["val", "any"],
    ["db_version", "number"],
    ["col_version", "number"],
    ["cl", "number"],
    ["seq", "number"],
];
function encode(changes) {
    return genericEncode(changes, schema);
}
function decode(encoded) {
    return genericDecode(encoded, schema);
}
function toBytes(data) {
    return Uint8Array.from([...data].map((x) => x.charCodeAt(0)));
}
function fromBytes(data) {
    return String.fromCharCode(...data);
}
function selectVersion() {
    const query = sql `SELECT 
    crsql_db_version() as current,
    IFNULL(MAX(version), 0) as synced
  FROM "__crstore_sync"`;
    return {
        execute: () => query.execute(this).then((x) => x.rows[0]),
    };
}
function updateVersion(version) {
    return this.updateTable("__crstore_sync").set({
        version: version != null ? version : sql `crsql_db_version()`,
    });
}
function selectClient() {
    const query = sql `SELECT crsql_site_id() as client`;
    return {
        execute: () => query.execute(this).then((x) => fromBytes(x.rows[0].client)),
    };
}
function changesSince(since, { filter = undefined, chunk: areChunked = false, } = {}) {
    let query = this.selectFrom("crsql_changes")
        // Overwrite `site_id` with the local one
        .select(sql `crsql_site_id()`.as("site_id"))
        .select([
        "cid",
        "pk",
        "table",
        "val",
        "db_version",
        "col_version",
        "cl",
        "seq",
    ])
        .where("db_version", ">", since)
        // Don't return tombstones when requesting the entire db
        .$if(!since, (qb) => qb.where("cid", "!=", "__crsql_del"))
        .$if(filter === null, (qb) => qb.where("site_id", "is", sql `crsql_site_id()`))
        .$if(typeof filter === "string", (qb) => qb.where("site_id", "is not", toBytes(filter)))
        .$castTo();
    return {
        execute: () => query
            .execute()
            .then((changes) => areChunked
            ? chunk(changes, { strict: false }).map(encode)
            : encode(changes)),
    };
}
function insertChanges(changes) {
    const run = async (db) => {
        if (!changes.length)
            return;
        const inserts = chunk(decode(changes)).map((changeset) => db.insertInto("crsql_changes").values(changeset).execute());
        await Promise.all(inserts);
        await updateVersion.bind(db)().execute();
    };
    return {
        execute: () => this.isTransaction ? run(this) : this.transaction().execute(run),
    };
}
function resolveChanges(changes) {
    return {
        execute: () => applyOperation
            .bind(this)((db) => insertChanges.bind(db)(changes).execute())
            .execute()
            .then((x) => x.changes),
    };
}
function applyOperation(operation, ...args) {
    return {
        execute: () => this.transaction().execute(async (db) => {
            const { current } = await selectVersion.bind(db)().execute();
            const result = await operation(db, ...args);
            const changes = await changesSince.bind(db)(current).execute();
            return { result, changes };
        }),
    };
}
function finalize() {
    const query = sql `select crsql_finalize();`;
    return {
        execute: () => query.execute(this),
    };
}
function affectedTables(target) {
    if (typeof target === "string") {
        return [...new Set(decode(target).map((x) => x.table))];
    }
    if (target.kind === "TableNode") {
        return [target.table.identifier.name];
    }
    if (target.kind === "ReferenceNode" && target.table) {
        return [target.table.table.identifier.name];
    }
    if (target.kind === "AliasNode") {
        return affectedTables(target.node);
    }
    if (target.kind === "SelectQueryNode") {
        const tables = [
            ...(target.from?.froms || []),
            ...(target.joins?.map((x) => x.table) || []),
            ...(target.selections?.map((x) => x.selection) || []),
            ...(target.with?.expressions.map((x) => x.expression) || []),
        ].flatMap(affectedTables);
        return [...new Set(tables)];
    }
    return [];
}
export { encode, decode, finalize, changesSince, selectClient, selectVersion, updateVersion, insertChanges, applyOperation, resolveChanges, affectedTables, };
