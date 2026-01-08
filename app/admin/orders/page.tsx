import { db } from "@/src/index";
import { orders,addresses } from "@/src/db/schema";
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

	const formattedOrders = ordersList.map((order) => {
		// Get shipping address from the order (saved at checkout time)
		const shippingAddr = order.shippingAddress as {
			fullName?: string;
			phone?: string;
			address?: string;
			city?: string;
			state?: string;
			zipCode?: string;
			country?: string;
		} | null;

		return {
			id: order.id,
			userId: order.userId,
			userName: order.user?.name || "Guest",
			userEmail: order.user?.email || "N/A",
			userPhone: shippingAddr?.phone || null,
			shippingAddress: shippingAddr
				? {
						fullName: shippingAddr.fullName || order.user?.name || "N/A",
						phone: shippingAddr.phone || null,
						addressLine1: shippingAddr.address || "N/A",
						addressLine2: null,
						city: shippingAddr.city || "N/A",
						state: shippingAddr.state || "N/A",
						postalCode: shippingAddr.zipCode || "N/A",
						country: shippingAddr.country || "N/A",
				  }
				: null,
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
		};
	});

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
