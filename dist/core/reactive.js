const empty = [];
const ready = (data) => data !== empty;
function reactive(start, parameters = []) {
    const subscribers = new Set();
    const invalidator = {
        stop: undefined,
        start: undefined,
    };
    let stop;
    let value = empty;
    function set(updated) {
        value = updated;
        if (stop)
            subscribers.forEach((x) => x(value));
    }
    function subscribe(fn) {
        subscribers.add(fn);
        if (subscribers.size === 1) {
            stop = start(...parameters);
            invalidator.stop = invalidator.start?.(invalidate);
        }
        fn(value);
        return () => {
            subscribers.delete(fn);
            if (subscribers.size === 0 && stop) {
                Promise.resolve(stop).then((x) => x());
                stop = undefined;
                invalidator.stop?.();
                invalidator.stop = undefined;
            }
        };
    }
    function bind(fn) {
        if (Array.isArray(fn))
            return invalidate(fn);
        invalidator.stop?.();
        invalidator.start = fn;
        if (stop)
            invalidator.stop = invalidator.start(invalidate);
    }
    function invalidate(updated) {
        if (JSON.stringify(updated) === JSON.stringify(parameters))
            return;
        parameters = updated.slice();
        if (!stop)
            return;
        Promise.resolve(stop).then((x) => x());
        stop = start(...parameters);
    }
    return { set, subscribe, bind };
}
export { reactive, ready };
