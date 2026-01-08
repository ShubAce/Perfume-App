import { db } from "@/src/index";
import { orders, users, products, orderItems } from "@/src/db/schema";
import { sql, eq, gte, lt, and, count, sum, desc } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

// Calculate date ranges
function getDateRanges() {
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const weekStart = new Date(todayStart);
	weekStart.setDate(weekStart.getDate() - 7);
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
	const thirtyDaysAgo = new Date(todayStart);
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	return { now, todayStart, weekStart, monthStart, lastMonthStart, lastMonthEnd, thirtyDaysAgo };
}

export default async function AdminDashboard() {
	const { authorized, error } = await validateAdminAccess("dashboard");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin");
	}

	const dates = getDateRanges();

	// Fetch all KPIs in parallel
	const [
		totalRevenue,
		todayRevenue,
		monthRevenue,
		lastMonthRevenue,
		totalOrders,
		todayOrders,
		pendingOrders,
		totalUsers,
		activeUsers,
		newUsersThisMonth,
		totalProducts,
		lowStockProducts,
		recentOrders,
		topProducts,
		ordersByStatus,
	] = await Promise.all([
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
			.where(and(gte(orders.createdAt, dates.todayStart), eq(orders.status, "delivered")))
			.then((r) => parseFloat(r[0]?.total || "0")),

		// This Month's Revenue
		db
			.select({ total: sum(orders.totalAmount) })
			.from(orders)
			.where(and(gte(orders.createdAt, dates.monthStart), eq(orders.status, "delivered")))
			.then((r) => parseFloat(r[0]?.total || "0")),

		// Last Month's Revenue
		db
			.select({ total: sum(orders.totalAmount) })
			.from(orders)
			.where(and(gte(orders.createdAt, dates.lastMonthStart), lt(orders.createdAt, dates.monthStart), eq(orders.status, "delivered")))
			.then((r) => parseFloat(r[0]?.total || "0")),

		// Total Orders
		db
			.select({ count: count() })
			.from(orders)
			.then((r) => r[0]?.count || 0),

		// Today's Orders
		db
			.select({ count: count() })
			.from(orders)
			.where(gte(orders.createdAt, dates.todayStart))
			.then((r) => r[0]?.count || 0),

		// Pending Orders
		db
			.select({ count: count() })
			.from(orders)
			.where(eq(orders.status, "pending"))
			.then((r) => r[0]?.count || 0),

		// Total Users
		db
			.select({ count: count() })
			.from(users)
			.then((r) => r[0]?.count || 0),

		// Active Users (30 days) - users who placed orders
		db
			.select({ count: sql<number>`COUNT(DISTINCT ${orders.userId})` })
			.from(orders)
			.where(gte(orders.createdAt, dates.thirtyDaysAgo))
			.then((r) => Number(r[0]?.count || 0)),

		// New Users This Month
		db
			.select({ count: count() })
			.from(users)
			.where(gte(users.createdAt, dates.monthStart))
			.then((r) => r[0]?.count || 0),

		// Total Products
		db
			.select({ count: count() })
			.from(products)
			.then((r) => r[0]?.count || 0),

		// Low Stock Products (< 10)
		db
			.select({ count: count() })
			.from(products)
			.where(sql`${products.stock} < 10`)
			.then((r) => r[0]?.count || 0),

		// Recent Orders
		db.query.orders.findMany({
			with: {
				user: true,
				items: {
					with: {
						product: true,
					},
				},
			},
			orderBy: desc(orders.createdAt),
			limit: 10,
		}),

		// Top Products by Sales
		db
			.select({
				productId: orderItems.productId,
				totalSold: sum(orderItems.quantity),
				revenue: sum(sql`${orderItems.quantity} * ${orderItems.priceAtPurchase}`),
			})
			.from(orderItems)
			.groupBy(orderItems.productId)
			.orderBy(desc(sum(orderItems.quantity)))
			.limit(5),

		// Orders by Status
		db
			.select({
				status: orders.status,
				count: count(),
			})
			.from(orders)
			.groupBy(orders.status),
	]);

	// Calculate AOV
	const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

	// Calculate MoM growth
	const momGrowth = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

	// Fetch product details for top products
	const topProductDetails = await Promise.all(
		topProducts.map(async (tp) => {
			const product = await db.query.products.findFirst({
				where: eq(products.id, tp.productId!),
			});
			return {
				...tp,
				product,
			};
		})
	);

	// Format data for client
	const dashboardData = {
		kpis: {
			totalRevenue,
			todayRevenue,
			monthRevenue,
			momGrowth,
			totalOrders,
			todayOrders,
			pendingOrders,
			aov,
			totalUsers,
			activeUsers,
			newUsersThisMonth,
			totalProducts,
			lowStockProducts,
		},
		recentOrders: recentOrders.map((order) => ({
			id: order.id,
			userId: order.userId,
			userName: order.user?.name || "Guest",
			userEmail: order.user?.email || "N/A",
			total: parseFloat(order.totalAmount),
			status: order.status,
			itemCount: order.items.length,
			createdAt: order.createdAt?.toISOString(),
		})),
		topProducts: topProductDetails.map((tp) => ({
			id: tp.productId,
			name: tp.product?.name || "Unknown",
			brand: tp.product?.brand || "Unknown",
			imageUrl: tp.product?.imageUrl,
			totalSold: Number(tp.totalSold || 0),
			revenue: parseFloat(String(tp.revenue || 0)),
		})),
		ordersByStatus: ordersByStatus.reduce((acc, item) => {
			acc[item.status || "unknown"] = item.count;
			return acc;
		}, {} as Record<string, number>),
	};

	return <DashboardClient data={dashboardData} />;
}
