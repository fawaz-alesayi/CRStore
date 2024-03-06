const types = {
    boolean: "?",
    number: "+",
    string: "'",
    object: "&",
    bigint: "^",
    null: "!",
    "?": "boolean",
    "+": "number",
    "'": "string",
    "^": "bigint",
    "&": "object",
    "!": "null",
};
const encoders = {
    any: (x) => (typeof x) in types && x != null
        ? types[typeof x] +
            encoders[typeof x]?.(x) ||
            x.toString()
        : "!",
    object: (x) => btoa(String.fromCharCode.apply(null, x)),
    number: (x) => x.toString(),
    string: (x) => x.replaceAll(",", ",,").replaceAll("*", "**"),
    bigint: (x) => x.toString(),
    boolean: (x) => (+x).toString(),
};
const decoders = {
    any: (x) => decoders[types[x[0]]]?.(x.slice(1)),
    object: (x) => Uint8Array.from([...atob(x)].map((x) => x.charCodeAt(0))),
    number: (x) => parseFloat(x),
    string: (x) => x.replaceAll(",,", ",").replaceAll("**", "*"),
    bigint: (x) => BigInt(x),
    boolean: (x) => !!+x,
    null: () => null,
};
export function encode(data, schema) {
    const entries = [];
    const last = {};
    for (const item of data) {
        for (const [id, type] of schema) {
            const encoded = encoders[type](item[id]);
            if (last[id]?.[0] !== encoded) {
                const data = [encoded, 1];
                entries.push(data);
                last[id] = data;
            }
            else {
                last[id][1] += 1;
            }
        }
    }
    return entries
        .map(([data, count]) => (count > 1 ? "*" + String.fromCharCode(count + 43) : ",") + data)
        .join("");
}
export function decode(data, schema) {
    const items = [];
    for (let position = 0; position < data.length;) {
        let next = position - 1;
        do {
            next = [",", "*"]
                .map((x) => data.indexOf(x, next + 2))
                .filter((x) => ~x)
                .reduce((a, b) => Math.min(a, b), Infinity);
        } while (data[next + 1] === data[next] && next !== Infinity);
        let buffer = data.slice(position, next);
        const single = buffer[0] === ",";
        items.push([
            buffer.slice(single ? 1 : 2),
            single ? 1 : buffer.charCodeAt(1) - 43,
        ]);
        position = next;
    }
    const entries = items.slice(0, schema.length);
    const decoded = [];
    let current = schema.length;
    outer: for (;;) {
        const item = {};
        for (let i = 0; i < schema.length; i++) {
            if (!entries[i])
                break outer;
            const [key, type] = schema[i];
            item[key] = decoders[type](entries[i][0]);
            entries[i][1] -= 1;
            if (!entries[i][1])
                entries[i] = items[current++];
        }
        decoded.push(item);
    }
    return decoded;
}
export function chunk(items, { size = 1000, strict = true } = {}) {
    if (items.length <= size)
        return [items];
    const chunks = [];
    for (let offset = 0; offset < items.length;) {
        const firstVersion = items[offset].db_version;
        const edgeVersion = items[offset + size]?.db_version;
        const predicate = (x) => x.db_version === edgeVersion;
        let edgeIndex = Infinity;
        if (firstVersion === edgeVersion) {
            if (strict)
                edgeIndex = offset + size;
            else
                edgeIndex = items.findLastIndex(predicate, offset + size) + 1;
        }
        else if (edgeVersion != null) {
            edgeIndex = items.findIndex(predicate, offset);
        }
        chunks.push(items.slice(offset, edgeIndex));
        offset = edgeIndex;
    }
    return chunks;
}
