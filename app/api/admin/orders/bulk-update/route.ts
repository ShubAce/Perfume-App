import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { orders, auditLogs } from "@/src/db/schema";
import { inArray } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
	try {
		const { authorized, session, error } = await validateAdminAccess("orders", "edit");

		if (!authorized || !session?.user) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { orderIds, status } = await request.json();

		if (!Array.isArray(orderIds) || orderIds.length === 0) {
			return NextResponse.json({ error: "No orders specified" }, { status: 400 });
		}

		const validStatuses = ["pending", "paid", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];
		if (!validStatuses.includes(status)) {
			return NextResponse.json({ error: "Invalid status" }, { status: 400 });
		}

		// Update all orders
		await db
			.update(orders)
			.set({
				status,
			})
			.where(inArray(orders.id, orderIds));

		// Log the bulk action
		await db.insert(auditLogs).values({
			adminId: Number(session.user.id),
			action: "bulk_order_status_update",
			entityType: "order",
			entityId: "bulk",
			details: JSON.stringify({
				orderIds,
				newStatus: status,
				count: orderIds.length,
			}),
			ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
		});

		return NextResponse.json({ success: true, updated: orderIds.length });
	} catch (error) {
		console.error("Error bulk updating orders:", error);
		return NextResponse.json({ error: "Failed to update orders" }, { status: 500 });
	}
}
