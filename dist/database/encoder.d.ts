declare const encoders: {
    readonly any: (x: any) => string;
    readonly object: (x: number[]) => string;
    readonly number: (x: number) => string;
    readonly string: (x: string) => string;
    readonly bigint: (x: BigInt) => string;
    readonly boolean: (x: boolean) => string;
};
export declare function encode<TSchema extends Schema>(data: FromSchema<TSchema>[], schema: TSchema): string;
export declare function decode<TSchema extends Schema>(data: string, schema: TSchema): { [K in TSchema[number][0]]: Types[Extract<TSchema[number], readonly [K, any]>[1]]; }[];
export declare function chunk<T extends {
    db_version: number;
}>(items: T[], { size, strict }?: {
    size?: number | undefined;
    strict?: boolean | undefined;
}): T[][];
type Types = {
    object: Uint8Array;
    boolean: boolean;
    number: number;
    string: string;
    bigint: bigint;
    any: unknown;
    null: null;
};
type Schema = readonly (readonly [string, keyof typeof encoders])[];
type FromSchema<TSchema extends Schema> = {
    [K in TSchema[number][0]]: Types[Extract<TSchema[number], readonly [K, any]>[1]];
} & NonNullable<unknown>;
export {};
