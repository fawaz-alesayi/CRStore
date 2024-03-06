import { derived, get } from "svelte/store";
import { database as coreDatabase } from "./core/crstore.js";
function database(schema, params = {}) {
    const { replica, ...rest } = coreDatabase(schema, params);
    function storeWith(...deps) {
        return function (view, actions) {
            const dependency = deps.length ? derived(deps, (x) => x) : undefined;
            const initial = dependency && get(dependency);
            const { bind, ...rest } = replica(view, actions, initial);
            bind((update) => dependency?.subscribe(update));
            return rest;
        };
    }
    return {
        replicated: Object.assign(storeWith(), { with: storeWith }),
        ...rest,
    };
}
export { database };
