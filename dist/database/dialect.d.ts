import { SqliteDialect, type DatabaseConnection } from "kysely";
declare class CRDialect extends SqliteDialect {
    database: () => Promise<CRDatabase>;
    constructor(config: CRDialectConfig);
    createDriver(): {
        init(): Promise<void>;
        acquireConnection(): Promise<DatabaseConnection>;
        beginTransaction(connection: DatabaseConnection): Promise<void>;
        commitTransaction(connection: DatabaseConnection): Promise<void>;
        rollbackTransaction(connection: DatabaseConnection): Promise<void>;
        releaseConnection(): Promise<void>;
        destroy(): Promise<void>;
    };
}
interface CRDialectConfig {
    database: CRDatabase | (() => Promise<CRDatabase>);
}
interface CRDatabase {
    close(): void;
    execO<T extends {}>(sql: string, bind?: readonly unknown[]): Promise<T[]>;
}
export { CRDialect };
