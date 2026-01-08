import { db } from "@/src/index";
import { orders } from "@/src/db/schema";
import { desc, eq, or, and, sql, count } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
	const { authorized } = await validateAdminAccess("orders");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/orders");
	}

	const params = await searchParams;
	const page = typeof params.page === "string" ? parseInt(params.page) : 1;
	const limit = 20;
	const offset = (page - 1) * limit;
	const status = typeof params.status === "string" ? params.status : undefined;
	const search = typeof params.search === "string" ? params.search : undefined;

	// Build where conditions
	const conditions = [];
	if (status && status !== "all") {
		conditions.push(eq(orders.status, status as string));
	}
	if (search) {
		conditions.push(
			or(
				sql`${orders.id}::text ILIKE ${`%${search}%`}`,
				sql`EXISTS (SELECT 1 FROM users WHERE users.id = ${
					orders.userId
				} AND (users.name ILIKE ${`%${search}%`} OR users.email ILIKE ${`%${search}%`}))`
			)
		);
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Fetch orders with pagination
	const [ordersList, totalCount, statusCounts] = await Promise.all([
		db.query.orders.findMany({
			where: whereClause,
			with: {
				user: true,
				items: {
					with: {
						product: true,
					},
				},
			},
			orderBy: desc(orders.createdAt),
			limit,
			offset,
		}),
		db
			.select({ count: count() })
			.from(orders)
			.where(whereClause)
			.then((r) => r[0]?.count || 0),
		db
			.select({
				status: orders.status,
				count: count(),
			})
			.from(orders)
			.groupBy(orders.status),
	]);

	const formattedOrders = ordersList.map((order) => ({
		id: order.id,
		userId: order.userId,
		userName: order.user?.name || "Guest",
		userEmail: order.user?.email || "N/A",
		total: parseFloat(order.totalAmount),
		status: order.status,
		paymentId: order.stripePaymentId,
		itemCount: order.items.length,
		items: order.items.map((item) => ({
			id: item.id,
			productName: item.product?.name || "Unknown",
			productImage: item.product?.imageUrl,
			quantity: item.quantity,
			price: parseFloat(item.priceAtPurchase),
		})),
		createdAt: order.createdAt?.toISOString(),
	}));

	const statusCountsMap = statusCounts.reduce((acc, item) => {
		acc[item.status || "unknown"] = item.count;
		return acc;
	}, {} as Record<string, number>);

	return (
		<OrdersClient
			orders={formattedOrders}
			totalCount={totalCount}
			currentPage={page}
			pageSize={limit}
			statusCounts={statusCountsMap}
			currentStatus={status}
			currentSearch={search}
		/>
	);
}
