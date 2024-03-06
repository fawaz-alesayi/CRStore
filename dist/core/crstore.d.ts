import type { CoreDatabase, Schema, Error, Pull, Push } from "./types.js";
import type { CRSchema } from "../database/schema.js";
import { ready } from "./reactive.js";
declare function database<T extends CRSchema>(schema: T, { ssr, name, paths, error, push: remotePush, pull: remotePull, online, }?: {
    ssr?: boolean | undefined;
    name?: string | undefined;
    paths?: {
        wasm?: string | undefined;
        binding?: string | undefined;
        extension?: string | undefined;
    } | undefined;
    error?: Error;
    push?: Push;
    pull?: Pull;
    online?: (() => boolean) | undefined;
}): CoreDatabase<Schema<T>>;
export { database, ready };
