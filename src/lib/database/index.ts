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
import type { Connection, Schema } from "../types";
import { Kysely, SqliteDialect } from "kysely";
import type { CRSchema } from "./schema";
import { CRDialect } from "./dialect";
import { JSONPlugin } from "./json";
import { apply } from "./schema";
import { load } from "./load";

const connections = new Map();
const defaultPaths = {
  wasm: "/sqlite.wasm",
  extension: "node_modules/@vlcn.io/crsqlite/build/Release/crsqlite.node",
  binding: undefined as string | undefined,
};

async function init<T extends CRSchema>(
  file: string,
  schema: T,
  paths = defaultPaths
) {
  type DB = Schema<T>;
  if (connections.has(file)) return connections.get(file) as Connection<DB>;

  const { database, browser } = await load(file, paths);
  const Dialect = browser ? CRDialect : SqliteDialect;
  const kysely = new Kysely<DB>({
    dialect: new Dialect({ database }),
    plugins: [new JSONPlugin()],
  });

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
