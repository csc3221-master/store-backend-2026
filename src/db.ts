import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Row = Record<string, unknown>;
export interface Statement {
  text: string;
  params?: unknown[];
}

let client: NeonQueryFunction<false, false> | undefined;

function getClient(): NeonQueryFunction<false, false> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  client ??= neon(databaseUrl);
  return client;
}

export async function query<T extends Row = Row>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await getClient().query(text, params)) as T[];
}

export async function transaction<T extends Row = Row>(
  statements: Statement[],
): Promise<T[][]> {
  const sql = getClient();
  return (await sql.transaction((tx) =>
    statements.map((statement) =>
      tx.query(statement.text, statement.params ?? []),
    ),
  )) as T[][];
}
