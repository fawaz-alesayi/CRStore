import type { Connection, Schema } from "../core/types.js";
import { Kysely } from "kysely";
import type { CRSchema } from "./schema.js";
declare const defaultPaths: {
    wasm?: string | undefined;
    binding?: string | undefined;
    extension?: string | undefined;
};
declare function init<T extends CRSchema>(file: string, schema: T, paths?: {
    wasm?: string | undefined;
    binding?: string | undefined;
    extension?: string | undefined;
}, customKyselyInstance?: Kysely<Schema<T>>): Promise<Connection<Schema<T>>>;
export { init, defaultPaths };
