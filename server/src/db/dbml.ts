import schema from './schema'; // Import your schema definition
import { pgGenerate } from 'drizzle-dbml-generator'; // Using Postgres

const out = './schema.dbml';
const relational = false;

pgGenerate({ schema, out, relational });
