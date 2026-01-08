import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { orders, users, orderItems, products } from "@/src/db/schema";
import { desc, eq, gte, lte, and } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
	try {
		const { authorized, session, error } = await validateAdminAccess("orders", "view");

		if (!authorized || !session?.user) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const status = searchParams.get("status");

		// Build conditions
		const conditions = [];
		if (startDate) {
			conditions.push(gte(orders.createdAt, new Date(startDate)));
		}
		if (endDate) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			conditions.push(lte(orders.createdAt, end));
		}
		if (status && status !== "all") {
			conditions.push(eq(orders.status, status));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Fetch orders with relations
		const ordersList = await db.query.orders.findMany({
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
		});

		// Generate CSV
		const headers = [
			"Order ID",
			"Customer Name",
			"Customer Email",
			"Total Amount",
			"Status",
			"Payment ID",
			"Items Count",
			"Products",
			"Created At",
		];

		const rows = ordersList.map((order) => [
			order.id,
			order.user?.name || "Guest",
			order.user?.email || "N/A",
			order.totalAmount,
			order.status || "pending",
			order.stripePaymentId || "N/A",
			order.items.length,
			order.items.map((item) => `${item.product?.name || "Unknown"} x${item.quantity}`).join("; "),
			order.createdAt ? new Date(order.createdAt).toISOString() : "N/A",
		]);

		const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");

		const filename = `orders_${new Date().toISOString().split("T")[0]}.csv`;

		// Log export action
		const { auditLogs } = await import("@/src/db/schema");
		await db.insert(auditLogs).values({
			adminId: Number(session.user.id),
			action: "export_orders",
			entityType: "order",
			entityId: null,
			details: JSON.stringify({
				count: ordersList.length,
				filters: { startDate, endDate, status },
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
		console.error("Error exporting orders:", error);
		return NextResponse.json({ error: "Failed to export orders" }, { status: 500 });
	}
}
