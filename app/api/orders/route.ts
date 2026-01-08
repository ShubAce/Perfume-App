import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { orders, orderItems, products } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
	const session = await auth();

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { items, shippingAddress, totalAmount } = await request.json();

		// Create order
		const [order] = await db
			.insert(orders)
			.values({
				userId: parseInt(session.user.id),
				totalAmount: totalAmount.toString(),
				status: "pending",
			})
			.returning();

		// Create order items
		await db.insert(orderItems).values(
			items.map((item: any) => ({
				orderId: order.id,
				productId: item.productId,
				quantity: item.quantity,
				priceAtPurchase: item.priceAtPurchase.toString(),
			}))
		);

		// Reduce inventory for each ordered product
		for (const item of items) {
			await db
				.update(products)
				.set({
					stock: sql`${products.stock} - ${item.quantity}`,
				})
				.where(eq(products.id, item.productId));
		}

		// TODO: Save shipping address to user profile or order

		return NextResponse.json({ orderId: order.id, success: true });
	} catch (error) {
		console.error("Failed to create order:", error);
		return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
	}
}

export async function GET() {
	const session = await auth();

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const userOrders = await db.query.orders.findMany({
			where: (orders, { eq }) => eq(orders.userId, parseInt(session.user.id)),
			with: {
				items: {
					with: {
						product: true,
					},
				},
			},
			orderBy: (orders, { desc }) => [desc(orders.createdAt)],
		});

		return NextResponse.json({ orders: userOrders });
	} catch (error) {
		console.error("Failed to fetch orders:", error);
		return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
	}
}
