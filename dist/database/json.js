import { sql, AggregateFunctionNode, AggregateFunctionBuilder } from "kysely";
function json(kysely, obj) {
    const entires = Object.entries(obj).flatMap(([key, value]) => [
        sql.lit(key),
        typeof value === "string" ? kysely.ref(value) : value,
    ]);
    return sql `json_object(${sql.join(entires)})`
        .withPlugin({
        transformQuery({ node }) {
            return { ...node, json: true };
        },
    })
        .$castTo();
}
function group(kysely, expr) {
    const reference = typeof expr === "string"
        ? kysely.ref(expr).toOperationNode()
        : expr.toOperationNode();
    return new AggregateFunctionBuilder({
        aggregateFunctionNode: {
            ...AggregateFunctionNode.create("json_group_array", [reference]),
            json: true,
        },
    });
}
function groupJSON(kysely, obj) {
    return group(kysely, json(kysely, obj));
}
class JSONPlugin {
    #jsonNodes = new WeakMap();
    transformQuery({ node, queryId }) {
        if (node.kind !== "SelectQueryNode")
            return node;
        this.#jsonNodes.set(queryId, new Set(this.getColumns(node)));
        return node;
    }
    async transformResult({ result, queryId }) {
        if (!Array.isArray(result.rows))
            return result;
        const mapped = this.#jsonNodes.get(queryId);
        if (!mapped)
            return result;
        result.rows.forEach((row) => this.parseObject(row, mapped));
        return result;
    }
    getColumns(node) {
        const columns = [];
        for (const key in node) {
            if (node[key] && typeof node[key] === "object") {
                if (node[key]["json"] === true && typeof node.alias?.name == "string") {
                    columns.push(node.alias?.name);
                }
                columns.push(...this.getColumns(node[key]));
            }
        }
        return columns;
    }
    parseObject(object, keys) {
        for (const key in object) {
            if (keys.has(key))
                object[key] = JSON.parse(String(object[key]));
            if (typeof object[key] === "object")
                this.parseObject(object[key], keys);
        }
    }
}
export { json, group, groupJSON, JSONPlugin };
