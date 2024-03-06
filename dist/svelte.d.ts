/// <reference types="svelte" />
import type { CoreDatabase, Actions, Schema, Update, Bound, View } from "./core/types.js";
import { type Readable, type StoresValues } from "svelte/store";
import { database as coreDatabase } from "./core/crstore.js";
import type { CRSchema } from "./database/schema.js";
declare function database<S extends CRSchema>(schema: S, params?: Parameters<typeof coreDatabase>[1]): SvelteDatabase<Schema<S>>;
type SvelteStore<S, D extends any[] = []> = <T, A extends Actions<S>>(view: View<S, T, D>, actions?: A) => Readable<T[]> & PromiseLike<T[]> & Bound<A> & Update<S>;
type SvelteDatabase<S> = Omit<CoreDatabase<S>, "replica"> & {
    replicated: SvelteStore<S> & {
        with<D extends Readable<any>[]>(...stores: D): SvelteStore<S, StoresValues<D>>;
    };
};
export { database };
export type { SvelteStore, SvelteDatabase };
