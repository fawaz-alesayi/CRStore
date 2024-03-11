import type { Connection, Schema } from "../core/types.js";
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
}): Promise<Connection<Schema<T>> | readonly [Connection<Schema<T>>, any]>;
export { init, defaultPaths };
