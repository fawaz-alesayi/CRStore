declare const ready: (data: unknown[]) => boolean;
declare function reactive<T extends any[], U extends any[] = []>(start: (...args: U) => (() => void) | Promise<() => void>, parameters?: U): {
    set: (updated: T) => void;
    subscribe: (fn: (value: T) => void) => () => void;
    bind: (fn: U | ((set: (updated: U) => void) => () => void)) => void;
};
export { reactive, ready };
