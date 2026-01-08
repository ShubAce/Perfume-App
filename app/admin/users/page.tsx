import { db } from "@/src/index";
import { users, orders } from "@/src/db/schema";
import { desc, eq, ilike, or, and, sql, count, sum, inArray } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
	const { authorized } = await validateAdminAccess("users");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/users");
	}

	const params = await searchParams;
	const page = typeof params.page === "string" ? parseInt(params.page) : 1;
	const limit = 20;
	const offset = (page - 1) * limit;
	const search = typeof params.search === "string" ? params.search : undefined;
	const role = typeof params.role === "string" ? params.role : undefined;

	// Build where conditions
	const conditions = [];
	if (search) {
		conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)));
	}
	if (role && role !== "all") {
		conditions.push(eq(users.role, role));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Fetch users with pagination
	const [usersList, totalCount, roleCounts] = await Promise.all([
		db.query.users.findMany({
			where: whereClause,
			orderBy: desc(users.createdAt),
			limit,
			offset,
		}),
		db
			.select({ count: count() })
			.from(users)
			.where(whereClause)
			.then((r) => r[0]?.count || 0),
		db
			.select({
				role: users.role,
				count: count(),
			})
			.from(users)
			.groupBy(users.role),
	]);

	// Fetch order stats for each user
	const userIds = usersList.map((u) => u.id);
	const orderStats =
		userIds.length > 0
			? await db
					.select({
						userId: orders.userId,
						orderCount: count(),
						totalSpent: sum(orders.totalAmount),
						lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
					})
					.from(orders)
					.where(inArray(orders.userId, userIds))
					.groupBy(orders.userId)
			: [];

	const orderStatsMap = orderStats.reduce((acc, stat) => {
		if (stat.userId) {
			acc[stat.userId] = {
				orderCount: stat.orderCount,
				totalSpent: parseFloat(String(stat.totalSpent || 0)),
				lastOrderDate: stat.lastOrderDate,
			};
		}
		return acc;
	}, {} as Record<number, { orderCount: number; totalSpent: number; lastOrderDate: Date | null }>);

	const formattedUsers = usersList.map((user) => {
		const lastOrder = orderStatsMap[user.id]?.lastOrderDate;
		return {
			id: user.id,
			name: user.name || "No Name",
			email: user.email || "No Email",
			image: user.image,
			role: user.role,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt?.toISOString(),
			orderCount: orderStatsMap[user.id]?.orderCount || 0,
			totalSpent: orderStatsMap[user.id]?.totalSpent || 0,
			lastOrderDate: lastOrder ? (typeof lastOrder === "string" ? lastOrder : lastOrder.toISOString()) : null,
		};
	});

	const roleCountsMap = roleCounts.reduce((acc, item) => {
		acc[item.role || "user"] = item.count;
		return acc;
	}, {} as Record<string, number>);

	return (
		<UsersClient
			users={formattedUsers}
			totalCount={totalCount}
			currentPage={page}
			pageSize={limit}
			roleCounts={roleCountsMap}
			currentRole={role}
			currentSearch={search}
		/>
	);
}
