import type { CoreDatabase, Actions, Schema, Update, Bound, View } from "./core/types.js";
import { database as coreDatabase } from "./core/crstore.js";
import type { CRSchema } from "./database/schema.js";
declare function database<S extends CRSchema>(schema: S, params?: Parameters<typeof coreDatabase>[1]): ReactDatabase<Schema<S>>;
type ReactStore<S> = <T, A extends Actions<S>, D extends any[] = []>(view: View<S, T, D>, actions?: A, deps?: D) => T[] & Bound<A> & Update<S>;
type ReactDatabase<S> = Omit<CoreDatabase<S>, "replica"> & {
    useReplica: ReactStore<S>;
};
export { database };
export type { ReactStore, ReactDatabase };
