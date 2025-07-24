import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var db: ReturnType<typeof drizzle> | undefined;
}

const connectionString = process.env.POSTGRES_URL_NON_POOLING!;

const client = postgres(connectionString, {
  max: 1,
  ...(process.env.NODE_ENV === 'production' && {
    ssl: { rejectUnauthorized: false },
  }),
});

export const db = global.db || drizzle(client, { schema });

if (process.env.NODE_ENV !== 'production') {
  global.db = db;
}

export { schema };
export * from './schema';