import { database as coreDatabase } from "./core/crstore.js";
import { useState, useMemo, useEffect } from "react";
function database(schema, params = {}) {
    const { replica, ...rest } = coreDatabase(schema, params);
    function useReplica(view, actions, deps = []) {
        const [data, setData] = useState([]);
        const { bind, subscribe, ...rest } = useMemo(() => replica(view, actions, deps), []);
        useEffect(() => subscribe(setData), []);
        useEffect(() => bind(deps), deps);
        const compound = useMemo(() => Object.assign(data, rest), [data]);
        return compound;
    }
    return { useReplica: useReplica, ...rest };
}
export { database };
