import { SqliteDialect, CompiledQuery } from "kysely";
class CRDialect extends SqliteDialect {
    database;
    constructor(config) {
        super(config);
        this.database = async () => typeof config.database === "function"
            ? config.database()
            : config.database;
    }
    createDriver() {
        const load = this.database;
        const waiter = mutex();
        let db;
        let connection;
        return {
            async init() {
                db = await load();
                connection = {
                    async executeQuery(query) {
                        return {
                            rows: (await db.execO(query.sql, query.parameters)),
                        };
                    },
                    async *streamQuery() {
                        throw new Error("Sqlite driver doesn't support streaming");
                    },
                };
            },
            async acquireConnection() {
                await waiter.lock();
                return connection;
            },
            async beginTransaction(connection) {
                await connection.executeQuery(CompiledQuery.raw("begin"));
            },
            async commitTransaction(connection) {
                await connection.executeQuery(CompiledQuery.raw("commit"));
            },
            async rollbackTransaction(connection) {
                await connection.executeQuery(CompiledQuery.raw("rollback"));
            },
            async releaseConnection() {
                waiter.unlock();
            },
            async destroy() {
                db?.close();
            },
        };
    }
}
function mutex() {
    let promise;
    let resolve;
    return {
        async lock() {
            while (promise)
                await promise;
            promise = new Promise((r) => (resolve = r));
        },
        unlock() {
            const unlock = resolve;
            promise = undefined;
            resolve = undefined;
            unlock?.();
        },
    };
}
export { CRDialect };
