import { changesSince, selectVersion } from "./operations.js";
const raf = globalThis.requestAnimationFrame || globalThis.setTimeout;
const error = Symbol("error");
function queue(connection, trigger) {
    const queue = new Map();
    let queueing;
    async function dequeue() {
        if (queueing)
            return queueing;
        return (queueing = new Promise((resolve) => raf(async () => {
            const db = await connection;
            const result = new Map();
            await db
                .transaction()
                .execute(async (trx) => {
                const current = trigger && (await selectVersion.bind(trx)().execute()).current;
                for (const [id, query] of queue.entries()) {
                    const rows = await query(trx).catch((x) => ({ [error]: x }));
                    result.set(id, rows);
                }
                trigger?.((await changesSince.bind(trx)(current).execute()));
            })
                .catch((reason) => {
                if (String(reason).includes("driver has already been destroyed")) {
                    return;
                }
                throw reason;
            });
            queue.clear();
            queueing = undefined;
            resolve(result);
        })));
    }
    return {
        enqueue(id, operation, ...args) {
            queue.set(id, (db) => operation(db, ...args));
            return dequeue()
                .then((x) => x.get(id))
                .then((x) => {
                if (x && typeof x === "object" && error in x)
                    throw x[error];
                else
                    return x;
            });
        },
    };
}
export { queue };
