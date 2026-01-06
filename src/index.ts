import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		"DATABASE_URL is not defined. Create a .env.local with `DATABASE_URL=postgres://...` or set the environment variable.\n" +
			"If you want to load .env.local automatically, install dotenv: `npm install dotenv --save-dev`"
	);
}

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
