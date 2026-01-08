import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function markMigrationsApplied() {
	try {
		// Get all migration files from the journal
		const migrations = [
			{ hash: "0000_curious_gamma_corps", created_at: 1767198229641 },
			{ hash: "0001_eminent_avengers", created_at: 1767200115849 },
			{ hash: "0002_early_paibok", created_at: 1767619612471 },
			{ hash: "0003_flowery_otto_octavius", created_at: 1767723422176 },
			{ hash: "0004_noisy_siren", created_at: 1767878443987 },
		];

		// Check which migrations are already recorded
		const existing = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
		const existingHashes = new Set(existing.map((r: any) => r.hash));

		console.log("Existing migrations:", existingHashes);

		// Insert missing migrations
		for (const migration of migrations) {
			if (!existingHashes.has(migration.hash)) {
				await sql`
					INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
					VALUES (${migration.hash}, ${migration.created_at})
				`;
				console.log(`✓ Marked migration as applied: ${migration.hash}`);
			} else {
				console.log(`- Already applied: ${migration.hash}`);
			}
		}

		console.log("\n✓ All migrations marked as applied!");
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await sql.end();
	}
}

markMigrationsApplied();
