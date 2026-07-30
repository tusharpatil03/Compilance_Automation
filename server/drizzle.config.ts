import { loadEnvironment } from './src/config/env';
import { Config, defineConfig } from 'drizzle-kit';

loadEnvironment();

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} as Config);
