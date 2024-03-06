import { type Transaction } from "kysely";
declare function apply(db: Transaction<any>, { schema }: CRSchema): Promise<void>;
declare function primary<T extends CRTable>(table: T, ...keys: Keys<T["schema"]>[]): T;
declare function crr<T extends CRTable>(table: T): T;
declare function ordered<T extends CRTable>(table: T, by: Keys<T["schema"]>, ...grouped: Keys<T["schema"]>[]): T;
declare function index<T extends CRTable>(table: T, ...keys: Keys<T["schema"]>[]): T;
type Keys<T> = Exclude<keyof T, number | symbol>;
type CRColumn = {
    type: string;
};
type CRTable = {
    schema: Record<string, CRColumn>;
    ordered?: string[][];
    indices?: string[][];
    primary?: string[];
    crr?: boolean;
};
type CRSchema = {
    schema: Record<string, CRTable>;
};
export { apply, primary, crr, index, ordered };
export type { CRSchema };
