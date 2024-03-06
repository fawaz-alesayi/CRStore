import type { EncodedChanges, Operation } from "../core/types.js";
import type { Kysely } from "kysely";
declare function queue<S>(connection: Promise<Kysely<S>>, trigger?: (changes: EncodedChanges) => void): {
    enqueue<T extends any[], R>(id: object, operation: Operation<T, R, S>, ...args: T): Promise<R>;
};
export { queue };
