import { applyOperation, resolveChanges, insertChanges, updateVersion, selectVersion, changesSince, selectClient, finalize, } from "./operations.js";
import { Kysely, SqliteDialect } from "kysely";
import { load } from "crstore/runtime";
import { CRDialect } from "./dialect.js";
import { JSONPlugin } from "./json.js";
import { apply } from "./schema.js";
const connections = new Map();
const defaultPaths = {};
async function init(file, schema, paths = defaultPaths) {
    if (connections.has(file))
        return connections.get(file);
    const { database, env } = await load(file, paths);
    const Dialect = env === "browser" ? CRDialect : SqliteDialect;
    const kysely = new Kysely({
        dialect: new Dialect({ database }),
        plugins: [new JSONPlugin()],
    });
    const close = kysely.destroy.bind(kysely);
    await kysely.transaction().execute((db) => apply(db, schema));
    const connection = Object.assign(kysely, {
        resolveChanges,
        applyOperation,
        insertChanges,
        updateVersion,
        selectVersion,
        selectClient,
        changesSince,
        async destroy() {
            connections.delete(file);
            await finalize.bind(kysely)().execute();
            return close();
        },
    });
    connections.set(file, connection);
    return [connection, database];
}
export { init, defaultPaths };
