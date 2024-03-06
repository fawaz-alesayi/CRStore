import { sql } from "kysely";
function covert(type) {
    const types = {
        any: "blob",
        string: "text",
        number: "real",
        unknown: "blob",
        instance: "blob",
        bigint: "integer",
        integer: "integer",
        boolean: "boolean",
    };
    const mapped = types[type];
    if (mapped)
        return mapped;
    throw new Error(`Type "${type}" is not allowed in the database schema!`);
}
async function apply(db, { schema }) {
    for (const table in schema) {
        const current = schema[table];
        // Create tables
        let query = db.schema.createTable(table).ifNotExists();
        for (const column in current.schema) {
            const { type } = current.schema[column];
            query = query.addColumn(column, current.ordered?.find(([x]) => x === column) ? "blob" : covert(type), (col) => (current.primary?.includes(column) ? col.notNull() : col));
        }
        // Add constrains
        if (current.primary) {
            query = query.addPrimaryKeyConstraint("primary_key", current.primary);
        }
        await query.execute();
        // Create indices
        for (const index of current.indices || []) {
            await db.schema
                .createIndex(`${table}_${index.join("_")}`)
                .ifNotExists()
                .on(table)
                .columns(index)
                .execute();
        }
        // Register CRRs
        if (current.crr) {
            await sql `SELECT crsql_as_crr(${table})`.execute(db);
        }
        // Register fraction index
        for (const ordered of current.ordered || []) {
            await sql `SELECT crsql_fract_as_ordered(${table},${sql.join(ordered)})`.execute(db);
        }
        // Create a special table for version sync
        await db.schema
            .createTable("__crstore_sync")
            .ifNotExists()
            .addColumn("version", "integer")
            .execute();
        await sql `INSERT INTO __crstore_sync (version) SELECT 0
      WHERE NOT EXISTS (SELECT * FROM __crstore_sync)
    `.execute(db);
    }
}
function primary(table, ...keys) {
    table.primary = keys;
    return table;
}
function crr(table) {
    table.crr = true;
    return table;
}
function ordered(table, by, ...grouped) {
    if (!table.ordered)
        table.ordered = [];
    table.ordered.push([by, ...grouped]);
    return table;
}
function index(table, ...keys) {
    if (!table.indices)
        table.indices = [];
    table.indices.push(keys);
    return table;
}
export { apply, primary, crr, index, ordered };
