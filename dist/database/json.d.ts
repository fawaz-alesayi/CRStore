import type { ExtractTypeFromReferenceExpression, PluginTransformResultArgs, PluginTransformQueryArgs, ExpressionBuilder, StringReference, KyselyPlugin, Expression } from "kysely";
import { AggregateFunctionBuilder } from "kysely";
type Simplify<T> = T extends any[] | Date ? T : {
    [K in keyof T]: T[K];
} & NonNullable<unknown>;
type JSON<DB, TB extends keyof DB, OBJ> = {
    [K in keyof OBJ]: NonNullable<ExtractTypeFromReferenceExpression<DB, TB, OBJ[K]>> & NonNullable<unknown>;
};
declare function json<DB, TB extends keyof DB, OBJ extends Record<string, StringReference<DB, TB> | Expression<any>>>(kysely: ExpressionBuilder<DB, TB>, obj: OBJ): import("kysely").RawBuilder<Simplify<JSON<DB, TB, OBJ>>>;
declare function group<DB, TB extends keyof DB, EXP extends StringReference<DB, TB> | Expression<any>>(kysely: ExpressionBuilder<DB, TB>, expr: EXP): AggregateFunctionBuilder<DB, TB, NonNullable<ExtractTypeFromReferenceExpression<DB, TB, EXP>>[]>;
declare function groupJSON<DB, TB extends keyof DB, OBJ extends Record<string, StringReference<DB, TB> | Expression<any>>>(kysely: ExpressionBuilder<DB, TB>, obj: OBJ): AggregateFunctionBuilder<DB, TB, NonNullable<import("kysely").SelectType<Simplify<JSON<DB, TB, OBJ>>>>[]>;
declare class JSONPlugin implements KyselyPlugin {
    #private;
    transformQuery({ node, queryId }: PluginTransformQueryArgs): import("kysely").SelectQueryNode | import("kysely").RawNode | import("kysely").InsertQueryNode | import("kysely").UpdateQueryNode | import("kysely").DeleteQueryNode | import("kysely").CreateTableNode | import("kysely").CreateIndexNode | import("kysely").CreateSchemaNode | import("kysely").CreateViewNode | import("kysely").DropTableNode | import("kysely").DropIndexNode | import("kysely").DropSchemaNode | import("kysely").DropViewNode | import("kysely").AlterTableNode | import("kysely").CreateTypeNode | import("kysely").DropTypeNode;
    transformResult({ result, queryId }: PluginTransformResultArgs): Promise<import("kysely").QueryResult<import("kysely").UnknownRow>>;
    private getColumns;
    private parseObject;
}
export { json, group, groupJSON, JSONPlugin };
