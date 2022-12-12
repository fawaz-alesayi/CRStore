import type { Kysely, FilterOperator, CompiledQuery } from "kysely";
import type { CRChange } from "./schema";
import { sql } from "kysely";

function toBytes(data: string) {
  return Uint8Array.from([...data].map((x) => x.charCodeAt(0)));
}

function fromBytes(data: Uint8Array) {
  return String.fromCharCode(...data);
}

function encode(changes: CRChange[]) {
  return changes.flatMap((x) => [
    String.fromCharCode(...x.site_id),
    x.cid,
    x.pk,
    x.table,
    x.val,
    x.version,
  ]);
}

function decode(encoded: any[]) {
  const changes: CRChange[] = [];
  for (let i = 0; i < encoded.length; i += 6) {
    changes.push({
      site_id: Uint8Array.from([...encoded[i]].map((x) => x.charCodeAt(0))),
      cid: encoded[i + 1],
      pk: encoded[i + 2],
      table: encoded[i + 3],
      val: encoded[i + 4],
      version: encoded[i + 5],
    });
  }
  return changes;
}

function selectVersion(this: Kysely<any>) {
  type Version = { version: number };
  const query = sql<Version>`SELECT crsql_dbversion() as version`;
  return {
    execute: () => query.execute(this).then((x) => x.rows[0].version),
  };
}

function selectClient(this: Kysely<any>) {
  type Client = { client: Uint8Array };
  const query = sql<Client>`SELECT crsql_siteid() as client`;
  return {
    execute: () => query.execute(this).then((x) => fromBytes(x.rows[0].client)),
  };
}

function changesSince(
  this: Kysely<any>,
  since: number,
  operator: FilterOperator = "!=",
  client?: string
) {
  let query = this.selectFrom("crsql_changes")
    .selectAll()
    .where("version", ">", since)
    // Don't return tombstones when requesting the entire db
    .if(!since, (qb) => qb.where("cid", "!=", "__crsql_del"))
    .if(client != null, (qb) =>
      qb.where("site_id", operator, toBytes(client || ""))
    );

  return {
    execute: () => query.execute().then(encode as any),
  };
}

function insertChanges(this: Kysely<any>, changes: any[]) {
  const query = this.insertInto("crsql_changes").values(decode(changes));

  return {
    async execute() {
      if (!changes.length) return;
      await query.execute();
    },
  };
}

function resolveChanges(this: Kysely<any>, changes: any[]) {
  return {
    execute: async () => {
      if (!changes.length) return [];
      return this.transaction().execute(async (db) => {
        const version = await selectVersion.bind(db)().execute();
        await insertChanges.bind(db)(changes).execute();
        return await changesSince.bind(db)(version).execute();
      });
    },
  };
}

function affectedTables(target: CompiledQuery | any[]) {
  if (Array.isArray(target)) {
    const tables = new Set<string>();
    for (let i = 3; i < target.length; i += 6) tables.add(target[i]);
    return [...tables];
  }

  const { query } = target;
  if (query.kind === "SelectQueryNode" || query.kind === "DeleteQueryNode") {
    return query.from.froms
      .filter((x) => x.kind === "TableNode")
      .map((x: any) => x.table.identifier.name as string);
  } else if (query.kind === "InsertQueryNode") {
    return [query.into.table.identifier.name];
  } else if (query.kind === "UpdateQueryNode") {
    if (query.table.kind === "AliasNode") return [];
    return [query.table.table.identifier.name];
  }

  return [];
}

export {
  selectClient,
  selectVersion,
  changesSince,
  insertChanges,
  resolveChanges,
  affectedTables,
};
