import { affectedTables } from "../database/operations.js";
import { defaultPaths, init } from "../database/index.js";
import { reactive, ready } from "./reactive.js";
import { queue } from "../database/queue.js";
function database(schema, { ssr = false, name = "crstore.db", paths = defaultPaths, error = undefined, push: remotePush = undefined, pull: remotePull = undefined, online = () => !!globalThis.navigator?.onLine, } = {}) {
    const dummy = !ssr && !!import.meta.env?.SSR;
    const { connection, database: db } = (dummy
        ? new Promise(() => {
            return {
                connection: {},
                database: {}
            };
        })
        : init(name, schema, paths));
    const channel = "BroadcastChannel" in globalThis
        ? new globalThis.BroadcastChannel(`${name}-sync`)
        : null;
    const tabUpdate = (event) => trigger(event.data, event.data[0]);
    const write = queue(connection, trigger);
    const read = queue(connection);
    channel?.addEventListener("message", tabUpdate);
    globalThis.addEventListener?.("online", pull);
    const listeners = new Map();
    let hold = () => { };
    pull();
    async function refresh(query, id) {
        return read
            .enqueue(id, (db) => db.getExecutor().executeQuery(query, id))
            .then((x) => x.rows);
    }
    function subscribe(tables, callback, options) {
        const listener = async (changes, sender) => {
            try {
                if (options && options.client === sender)
                    return;
                await callback(changes, sender);
            }
            catch (reason) {
                error?.(reason);
            }
        };
        tables.forEach((x) => {
            if (!listeners.has(x))
                listeners.set(x, new Set());
            listeners.get(x)?.add(listener);
        });
        // Immediately call when have options
        if (options) {
            connection.then(async (db) => {
                const changes = await db
                    .changesSince(options.version, {
                    filter: options.client,
                    chunk: true,
                })
                    .execute();
                if (changes.length)
                    changes.forEach((x) => listener(x));
            });
        }
        else
            listener("");
        return () => tables.forEach((x) => listeners.get(x)?.delete(listener));
    }
    async function push() {
        if (!remotePush || !online())
            return;
        const db = await connection;
        const { current, synced } = await db.selectVersion().execute();
        if (current <= synced)
            return;
        const changes = await db
            .changesSince(synced, { filter: null, chunk: true })
            .execute();
        await Promise.all(changes.map(remotePush));
        await db.updateVersion(current).execute();
    }
    async function pull() {
        globalThis.removeEventListener?.("offline", hold);
        hold();
        if (!remotePull || !online())
            return;
        const db = await connection;
        const { synced: version } = await db.selectVersion().execute();
        const client = await db.selectClient().execute();
        await push();
        hold = remotePull({ version, client }, {
            async onData(changes) {
                if (!changes.length)
                    return;
                await db.insertChanges(changes).execute();
                await trigger(changes, changes[0]);
            },
        }).unsubscribe;
        globalThis.addEventListener?.("offline", hold);
    }
    async function update(operation, ...args) {
        return write.enqueue({}, operation, ...args);
    }
    async function merge(changes) {
        if (!changes.length)
            return;
        const db = await connection;
        await trigger(await db.resolveChanges(changes).execute(), changes[0]);
    }
    async function trigger(changes, sender) {
        if (!changes.length)
            return;
        const callbacks = new Set();
        const tables = affectedTables(changes);
        listeners.get("*")?.forEach((x) => callbacks.add(x));
        tables.forEach((table) => listeners.get(table)?.forEach((x) => callbacks.add(x)));
        const promises = [...callbacks].map((x) => x(changes, sender));
        if (!sender) {
            channel?.postMessage(changes);
            await push();
        }
        await Promise.all(promises);
    }
    async function close() {
        hold();
        channel?.close();
        listeners.clear();
        globalThis.removeEventListener?.("online", pull);
        globalThis.removeEventListener?.("offline", hold);
        channel?.removeEventListener("message", tabUpdate);
        await connection.then((x) => x.destroy());
    }
    return {
        close,
        merge,
        update,
        subscribe,
        db,
        connection,
        replica: store.bind({
            connection,
            subscribe,
            update,
            refresh,
        }),
    };
}
function store(view, actions = {}, dependencies = []) {
    const { connection, update, refresh: read } = this;
    let query = null;
    let id = null;
    const { subscribe, set, bind } = reactive(async (...values) => {
        const db = await connection;
        const node = view(db, ...values).toOperationNode();
        const tables = affectedTables(node);
        const executor = db.getExecutor();
        id = { queryId: Math.random().toString(36).slice(2) };
        query = executor.compileQuery(executor.transformQuery(node, id), id);
        return this.subscribe(tables, refresh);
    }, dependencies);
    async function refresh() {
        await connection;
        if (!query || !id)
            return;
        set(await read(query, id));
    }
    const bound = {};
    for (const name in actions) {
        bound[name] = (...args) => update(actions[name], ...args);
    }
    return {
        ...bound,
        subscribe,
        bind,
        update(operation, ...args) {
            if (!operation)
                return refresh();
            return update(operation, ...args);
        },
        then(resolve = (x) => x, reject) {
            let data = [];
            const done = subscribe((x) => (data = x));
            // It is hard to know whether the current store's state is dirty,
            //   therefore we have to explicitly refresh it
            return refresh().then(() => (done(), resolve?.(data)), reject);
        },
    };
}
export { database, ready };
