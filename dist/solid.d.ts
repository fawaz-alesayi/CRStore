import type { CoreDatabase, Actions, Update, Schema, Bound, View } from "./core/types.js";
import { database as coreDatabase } from "./core/crstore.js";
import type { CRSchema } from "./database/schema.js";
import type { Accessor } from "solid-js";
declare function database<S extends CRSchema>(schema: S, params?: Parameters<typeof coreDatabase>[1]): SolidDatabase<Schema<S>>;
type SolidStore<S> = <T, A extends Actions<S>, D extends Accessor<any>[] = []>(view: View<S, T, SignalValues<D>>, actions?: A, deps?: D) => Accessor<T[]> & Bound<A> & Update<S>;
type SolidDatabase<S> = Omit<CoreDatabase<S>, "replica"> & {
    createReplica: SolidStore<S>;
};
type SignalValues<T> = {
    [K in keyof T]: T[K] extends Accessor<infer U> ? U : never;
};
export { database };
export type { SolidStore, SolidDatabase };
