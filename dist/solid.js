import { createSignal, createEffect, onCleanup } from "solid-js";
import { database as coreDatabase } from "./core/crstore.js";
function database(schema, params = {}) {
    const { replica, ...rest } = coreDatabase(schema, params);
    function createReplica(view, actions, deps = []) {
        const [data, setData] = createSignal([]);
        const { bind, subscribe, ...rest } = replica(view, actions, deps.map((x) => x()));
        createEffect(() => onCleanup(subscribe(setData)));
        createEffect(() => bind(deps.map((x) => x())));
        return Object.assign(data, rest);
    }
    return {
        createReplica: createReplica,
        ...rest,
    };
}
export { database };
