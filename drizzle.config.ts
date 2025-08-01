import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL_NON_POOLING!,
  },
  verbose: true,
  strict: true,
});