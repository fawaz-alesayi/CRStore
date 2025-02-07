import {
  applyOperation,
  resolveChanges,
  insertChanges,
  updateVersion,
  selectVersion,
  changesSince,
  selectClient,
  finalize,
} from "./operations";
import type { Connection, Schema } from "../core/types";
import { Kysely, SqliteDialect } from "kysely";
import type { CRSchema } from "./schema";
import { load } from "crstore/runtime";
import { CRDialect } from "./dialect";
import { JSONPlugin } from "./json";
import { apply } from "./schema";

const connections = new Map();
const defaultPaths = {} as {
  wasm?: string;
  binding?: string;
  extension?: string;
};

async function init<T extends CRSchema>(
  file: string,
  schema: T,
  paths = defaultPaths,
  customKyselyInstance?: Kysely<Schema<T>>,
) {
  type DB = Schema<T>;
  if (connections.has(file)) return connections.get(file) as Connection<DB>;

  let kysely: Kysely<DB>;
  if (!customKyselyInstance) {
    const { database, env } = await load(file, paths);
    const Dialect = env === "browser" ? CRDialect : SqliteDialect;
    kysely = new Kysely<DB>({
      dialect: new Dialect({ database }),
      plugins: [new JSONPlugin()],
    });
  } else {
    kysely = customKyselyInstance;
  }

  const close = kysely.destroy.bind(kysely);
  await kysely.transaction().execute((db) => apply(db, schema));

  const connection = Object.assign(kysely, {
    resolveChanges,
    applyOperation,
    insertChanges,
    updateVersion,
    selectVersion,
    selectClient,
    changesSince,
    async destroy() {
      connections.delete(file);
      await finalize.bind(kysely)().execute();
      return close();
    },
  }) as Connection<DB>;

  connections.set(file, connection);
  return connection;
}

export { init, defaultPaths };
