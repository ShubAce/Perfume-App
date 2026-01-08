/**
 * Admin User Seed Script
 *
 * This script creates or updates admin users for the perfume app.
 *
 * Usage:
 *   npx tsx src/db/seed-admin.ts
 *
 * Or add to package.json scripts:
 *   "seed:admin": "tsx src/db/seed-admin.ts"
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

// Import schema
import { users } from "./schema";

// Create database connection directly (not importing from index.ts)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error("❌ DATABASE_URL is not defined in .env file");
	console.error("   Make sure you have a .env file at the project root with:");
	console.error("   DATABASE_URL=postgres://...");
	process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

// ============================================
// CONFIGURE YOUR ADMIN USERS HERE
// ============================================
const adminUsers = [
	{
		name: "Super Admin",
		email: "admin@perfume.com",
		password: "Admin@123456", // Change this in production!
		role: "super_admin" as const,
	},
	{
		name: "Operations Manager",
		email: "ops@perfume.com",
		password: "Ops@123456", // Change this in production!
		role: "operations" as const,
	},
	{
		name: "Support Agent",
		email: "support@perfume.com",
		password: "Support@123456", // Change this in production!
		role: "support" as const,
	},
	{
		name: "Marketing Manager",
		email: "marketing@perfume.com",
		password: "Marketing@123456", // Change this in production!
		role: "marketing" as const,
	},
];

// ============================================
// SEED FUNCTION
// ============================================
async function seedAdminUsers() {
	console.log("🔐 Starting Admin User Seed...\n");

	for (const adminUser of adminUsers) {
		try {
			// Check if user already exists
			const existingUser = await db.select().from(users).where(eq(users.email, adminUser.email)).limit(1);

			if (existingUser.length > 0) {
				// Update existing user's role
				await db
					.update(users)
					.set({
						role: adminUser.role,
						name: adminUser.name,
					})
					.where(eq(users.email, adminUser.email));

				console.log(`✅ Updated existing user: ${adminUser.email} → ${adminUser.role}`);
			} else {
				// Hash password and create new user
				const hashedPassword = await bcrypt.hash(adminUser.password, 12);

				await db.insert(users).values({
					name: adminUser.name,
					email: adminUser.email,
					password: hashedPassword,
					role: adminUser.role,
					emailVerified: new Date(), // Mark as verified
				});

				console.log(`✅ Created new admin user: ${adminUser.email} (${adminUser.role})`);
			}
		} catch (error) {
			console.error(`❌ Failed to seed user ${adminUser.email}:`, error);
		}
	}

	console.log("\n🎉 Admin seed completed!");
	console.log("\n📋 Admin Credentials:");
	console.log("─".repeat(50));
	adminUsers.forEach((user) => {
		console.log(`   ${user.role.padEnd(15)} | ${user.email.padEnd(25)} | ${user.password}`);
	});
	console.log("─".repeat(50));
	console.log("\n⚠️  IMPORTANT: Change these passwords in production!\n");
}

// ============================================
// UTILITY: Promote existing user to admin
// ============================================
async function promoteToAdmin(email: string, role: "super_admin" | "admin" | "operations" | "support" | "marketing" = "admin") {
	const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

	if (existingUser.length === 0) {
		console.log(`❌ User not found: ${email}`);
		return false;
	}

	await db.update(users).set({ role }).where(eq(users.email, email));

	console.log(`✅ Promoted ${email} to ${role}`);
	return true;
}

// ============================================
// CLI INTERFACE
// ============================================
async function main() {
	const args = process.argv.slice(2);

	if (args[0] === "promote" && args[1]) {
		// Usage: npx tsx src/db/seed-admin.ts promote user@email.com admin
		const email = args[1];
		const role = (args[2] as any) || "admin";
		await promoteToAdmin(email, role);
	} else {
		// Default: seed all admin users
		await seedAdminUsers();
	}

	// Close the database connection
	await client.end();
	process.exit(0);
}

main().catch(async (error) => {
	console.error("Fatal error:", error);
	await client.end();
	process.exit(1);
});
