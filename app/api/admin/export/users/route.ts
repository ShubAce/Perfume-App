import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { users, orders } from "@/src/db/schema";
import { desc, eq, gte, lte, and, count, sum, sql } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
	try {
		const { authorized, session, error } = await validateAdminAccess("users", "view");

		if (!authorized || !session?.user) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const role = searchParams.get("role");

		// Build conditions
		const conditions = [];
		if (startDate) {
			conditions.push(gte(users.createdAt, new Date(startDate)));
		}
		if (endDate) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			conditions.push(lte(users.createdAt, end));
		}
		if (role && role !== "all") {
			conditions.push(eq(users.role, role));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Fetch users
		const usersList = await db.query.users.findMany({
			where: whereClause,
			orderBy: desc(users.createdAt),
		});

		// Get order stats for each user
		const orderStats = await db
			.select({
				userId: orders.userId,
				orderCount: count(),
				totalSpent: sum(orders.totalAmount),
			})
			.from(orders)
			.groupBy(orders.userId);

		const orderStatsMap = orderStats.reduce((acc, stat) => {
			if (stat.userId) {
				acc[stat.userId] = {
					orderCount: stat.orderCount,
					totalSpent: parseFloat(String(stat.totalSpent || 0)),
				};
			}
			return acc;
		}, {} as Record<number, { orderCount: number; totalSpent: number }>);

		// Generate CSV
		const headers = ["User ID", "Name", "Email", "Role", "Email Verified", "Orders Count", "Total Spent", "Created At"];

		const rows = usersList.map((user) => [
			user.id,
			user.name || "N/A",
			user.email,
			user.role || "customer",
			user.emailVerified ? "Yes" : "No",
			orderStatsMap[user.id]?.orderCount || 0,
			orderStatsMap[user.id]?.totalSpent || 0,
			user.createdAt ? new Date(user.createdAt).toISOString() : "N/A",
		]);

		const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");

		const filename = `users_${new Date().toISOString().split("T")[0]}.csv`;

		// Log export action
		const { auditLogs } = await import("@/src/db/schema");
		await db.insert(auditLogs).values({
			adminId: Number(session.user.id),
			action: "export_users",
			entityType: "user",
			entityId: null,
			details: JSON.stringify({
				count: usersList.length,
				filters: { startDate, endDate, role },
			}),
			ipAddress: request.headers.get("x-forwarded-for") || "unknown",
		});

		return new NextResponse(csv, {
			status: 200,
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("Error exporting users:", error);
		return NextResponse.json({ error: "Failed to export users" }, { status: 500 });
	}
}
