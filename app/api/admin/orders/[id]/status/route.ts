import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { orders, auditLogs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { authorized, session, error } = await validateAdminAccess("orders", "edit");

		if (!authorized || !session?.user) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const { status } = await request.json();

		const validStatuses = ["pending", "paid", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];
		if (!validStatuses.includes(status)) {
			return NextResponse.json({ error: "Invalid status" }, { status: 400 });
		}

		// Get current order
		const orderId = parseInt(id);
		const currentOrder = await db.query.orders.findFirst({
			where: eq(orders.id, orderId),
		});

		if (!currentOrder) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		// Update order status
		await db
			.update(orders)
			.set({
				status,
			})
			.where(eq(orders.id, orderId));

		// Log the action
		await db.insert(auditLogs).values({
			adminId: Number(session.user.id),
			action: "order_status_update",
			entityType: "order",
			entityId: orderId,
			details: JSON.stringify({
				previousStatus: currentOrder.status,
				newStatus: status,
			}),
			ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
		});

		return NextResponse.json({ success: true, status });
	} catch (error) {
		console.error("Error updating order status:", error);
		return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
	}
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { authorized, error } = await validateAdminAccess("orders", "view");

		if (!authorized) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const orderId = parseInt(id);

		const order = await db.query.orders.findFirst({
			where: eq(orders.id, orderId),
			with: {
				user: true,
				items: {
					with: {
						product: true,
					},
				},
			},
		});

		if (!order) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		return NextResponse.json(order);
	} catch (error) {
		console.error("Error fetching order:", error);
		return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
	}
}
