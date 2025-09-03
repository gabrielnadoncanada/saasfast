import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/db/drizzle/schema/*",
  out: "./shared/db/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
