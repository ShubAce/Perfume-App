import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { carts, cartItems, products } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
	const session = await auth();

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { guestItems } = await request.json();
		const userId = parseInt(session.user.id);

		// Find or create user cart
		let userCart = await db.query.carts.findFirst({
			where: eq(carts.userId, userId),
			with: { items: true },
		});

		if (!userCart) {
			const [newCart] = await db.insert(carts).values({ userId }).returning();
			userCart = { ...newCart, items: [] };
		}

		// Merge guest items into user cart
		for (const guestItem of guestItems) {
			const existingItem = userCart.items.find((item: any) => item.productId === guestItem.productId);

			if (existingItem) {
				// Update quantity
				await db
					.update(cartItems)
					.set({ quantity: existingItem.quantity + guestItem.quantity })
					.where(eq(cartItems.id, existingItem.id));
			} else {
				// Add new item
				await db.insert(cartItems).values({
					cartId: userCart.id,
					productId: guestItem.productId,
					quantity: guestItem.quantity,
				});
			}
		}

		// Fetch updated cart with products
		const updatedCart = await db.query.carts.findFirst({
			where: eq(carts.id, userCart.id),
			with: {
				items: {
					with: { product: true },
				},
			},
		});

		const mergedItems =
			updatedCart?.items.map((item: any) => ({
				id: item.id,
				productId: item.productId,
				slug: item.product.slug,
				name: item.product.name,
				brand: item.product.brand,
				price: parseFloat(item.product.price),
				quantity: item.quantity,
				imageUrl: item.product.imageUrl,
				size: item.product.size,
				scentNotes: item.product.scentNotes,
			})) || [];

		return NextResponse.json({ mergedItems, success: true });
	} catch (error) {
		console.error("Failed to merge cart:", error);
		return NextResponse.json({ error: "Failed to merge cart" }, { status: 500 });
	}
}
