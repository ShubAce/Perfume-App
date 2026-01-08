import { db } from "@/src/index";
import { orders, orderItems, products } from "@/src/db/schema";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { desc, sql, eq, gte, and, sum, count } from "drizzle-orm";
import FinanceClient from "./FinanceClient";

export default async function FinancePage() {
	const { authorized } = await validateAdminAccess("finance");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/finance");
	}

	// Get date ranges
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const weekStart = new Date(todayStart);
	weekStart.setDate(weekStart.getDate() - 7);
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const yearStart = new Date(now.getFullYear(), 0, 1);

	// Fetch financial data
	const [totalRevenue, todayRevenue, weekRevenue, monthRevenue, yearRevenue, recentTransactions, revenueByMonth] = await Promise.all([
		// Total Revenue (all time)
		db
			.select({ total: sum(orders.totalAmount) })
			.from(orders)
			.where(eq(orders.status, "delivered"))
			.then((r) => parseFloat(r[0]?.total || "0")),

		// Today's Revenue
		db
			.select({ total: sum(orders.totalAmount) })
			.from(orders)
			.where(and(gte(orders.createdAt, todayStart), eq(orders.status, "delivered")))
			.then((r) => parseFloat(r[0]?.total || "0")),

		// This Week's Revenue
		db
			.select({ total: sum(orders.totalAmount) })
			.from(orders)
			.where(and(gte(orders.createdAt, weekStart), eq(orders.status, "delivered")))
			.then((r) => parseFloat(r[0]?.total || "0")),

		// This Month's Revenue
		db
			.select({ total: sum(orders.totalAmount) })
			.from(orders)
			.where(and(gte(orders.createdAt, monthStart), eq(orders.status, "delivered")))
			.then((r) => parseFloat(r[0]?.total || "0")),

		// This Year's Revenue
		db
			.select({ total: sum(orders.totalAmount) })
			.from(orders)
			.where(and(gte(orders.createdAt, yearStart), eq(orders.status, "delivered")))
			.then((r) => parseFloat(r[0]?.total || "0")),

		// Recent Transactions
		db.query.orders.findMany({
			with: {
				user: true,
			},
			orderBy: desc(orders.createdAt),
			limit: 20,
		}),

		// Revenue by month (last 12 months)
		db
			.select({
				month: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
				revenue: sum(orders.totalAmount),
				orderCount: count(),
			})
			.from(orders)
			.where(eq(orders.status, "delivered"))
			.groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)
			.orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM') DESC`)
			.limit(12),
	]);

	const stats = {
		totalRevenue,
		todayRevenue,
		weekRevenue,
		monthRevenue,
		yearRevenue,
	};

	return (
		<FinanceClient
			stats={stats}
			transactions={recentTransactions}
			revenueByMonth={revenueByMonth}
		/>
	);
}
