import { db } from "@/src/index";
import { orders, products, orderItems, users } from "@/src/db/schema";
import { desc, eq, gte, lt, and, sql, sum, count } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export default async function AdminAnalyticsPage() {
	const { authorized } = await validateAdminAccess("analytics");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/analytics");
	}

	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

	// Daily revenue for the last 30 days
	const dailyRevenue = await db
		.select({
			date: sql<string>`DATE(${orders.createdAt})`,
			revenue: sum(orders.totalAmount),
			orders: count(),
		})
		.from(orders)
		.where(and(gte(orders.createdAt, thirtyDaysAgo), eq(orders.status, "delivered")))
		.groupBy(sql`DATE(${orders.createdAt})`)
		.orderBy(sql`DATE(${orders.createdAt})`);

	// Revenue by gender (using gender field instead of category)
	const revenueByGender = await db
		.select({
			gender: products.gender,
			revenue: sum(sql`${orderItems.quantity} * ${orderItems.priceAtPurchase}`),
			unitsSold: sum(orderItems.quantity),
		})
		.from(orderItems)
		.innerJoin(products, eq(orderItems.productId, products.id))
		.innerJoin(orders, eq(orderItems.orderId, orders.id))
		.where(eq(orders.status, "delivered"))
		.groupBy(products.gender)
		.orderBy(desc(sum(sql`${orderItems.quantity} * ${orderItems.priceAtPurchase}`)));

	// Revenue by brand
	const revenueByBrand = await db
		.select({
			brand: products.brand,
			revenue: sum(sql`${orderItems.quantity} * ${orderItems.priceAtPurchase}`),
			unitsSold: sum(orderItems.quantity),
		})
		.from(orderItems)
		.innerJoin(products, eq(orderItems.productId, products.id))
		.innerJoin(orders, eq(orderItems.orderId, orders.id))
		.where(eq(orders.status, "delivered"))
		.groupBy(products.brand)
		.orderBy(desc(sum(sql`${orderItems.quantity} * ${orderItems.priceAtPurchase}`)))
		.limit(10);

	// Top selling products
	const topSellingProducts = await db
		.select({
			productId: orderItems.productId,
			productName: products.name,
			brand: products.brand,
			imageUrl: products.imageUrl,
			revenue: sum(sql`${orderItems.quantity} * ${orderItems.priceAtPurchase}`),
			unitsSold: sum(orderItems.quantity),
		})
		.from(orderItems)
		.innerJoin(products, eq(orderItems.productId, products.id))
		.innerJoin(orders, eq(orderItems.orderId, orders.id))
		.where(eq(orders.status, "delivered"))
		.groupBy(orderItems.productId, products.name, products.brand, products.imageUrl)
		.orderBy(desc(sum(orderItems.quantity)))
		.limit(10);

	// New vs returning customers (30 days)
	const newCustomers = await db
		.select({ count: count() })
		.from(users)
		.where(gte(users.createdAt, thirtyDaysAgo))
		.then((r) => r[0]?.count || 0);

	// Returning customers - users who placed orders in the last 30 days AND had orders before that
	const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
	const returningCustomers = await db
		.select({
			count: sql<number>`COUNT(DISTINCT ${orders.userId})`,
		})
		.from(orders)
		.where(
			and(
				gte(orders.createdAt, thirtyDaysAgo),
				sql`${orders.userId} IN (SELECT user_id FROM orders WHERE created_at < ${thirtyDaysAgoISO}::timestamp)`
			)
		)
		.then((r) => Number(r[0]?.count || 0));

	// Monthly summary
	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

	const [thisMonthStats, lastMonthStats] = await Promise.all([
		db
			.select({
				revenue: sum(orders.totalAmount),
				orders: count(),
			})
			.from(orders)
			.where(and(gte(orders.createdAt, thisMonthStart), eq(orders.status, "delivered")))
			.then((r) => ({
				revenue: parseFloat(r[0]?.revenue || "0"),
				orders: r[0]?.orders || 0,
			})),
		db
			.select({
				revenue: sum(orders.totalAmount),
				orders: count(),
			})
			.from(orders)
			.where(and(gte(orders.createdAt, lastMonthStart), lt(orders.createdAt, thisMonthStart), eq(orders.status, "delivered")))
			.then((r) => ({
				revenue: parseFloat(r[0]?.revenue || "0"),
				orders: r[0]?.orders || 0,
			})),
	]);

	// Order status distribution
	const orderStatusDist = await db
		.select({
			status: orders.status,
			count: count(),
		})
		.from(orders)
		.where(gte(orders.createdAt, thirtyDaysAgo))
		.groupBy(orders.status);

	// Format data for client
	const analyticsData = {
		dailyRevenue: dailyRevenue.map((d) => ({
			date: d.date,
			revenue: parseFloat(String(d.revenue || 0)),
			orders: d.orders,
		})),
		revenueByGender: revenueByGender.map((g) => ({
			gender: g.gender || "Unisex",
			revenue: parseFloat(String(g.revenue || 0)),
			unitsSold: Number(g.unitsSold || 0),
		})),
		revenueByBrand: revenueByBrand.map((b) => ({
			brand: b.brand || "Unknown",
			revenue: parseFloat(String(b.revenue || 0)),
			unitsSold: Number(b.unitsSold || 0),
		})),
		topSellingProducts: topSellingProducts.map((p) => ({
			productId: p.productId,
			productName: p.productName || "Unknown",
			brand: p.brand || "Unknown",
			imageUrl: p.imageUrl,
			revenue: parseFloat(String(p.revenue || 0)),
			unitsSold: Number(p.unitsSold || 0),
		})),
		customerMetrics: {
			newCustomers,
			returningCustomers,
		},
		monthlyComparison: {
			thisMonth: thisMonthStats,
			lastMonth: lastMonthStats,
			revenueGrowth: lastMonthStats.revenue > 0 ? ((thisMonthStats.revenue - lastMonthStats.revenue) / lastMonthStats.revenue) * 100 : 0,
			ordersGrowth: lastMonthStats.orders > 0 ? ((thisMonthStats.orders - lastMonthStats.orders) / lastMonthStats.orders) * 100 : 0,
		},
		orderStatusDistribution: orderStatusDist.reduce((acc, item) => {
			acc[item.status || "unknown"] = item.count;
			return acc;
		}, {} as Record<string, number>),
	};

	return <AnalyticsClient data={analyticsData} />;
}
