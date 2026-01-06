import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { carts, cartItems, products } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch user's cart from database
export async function GET(request: Request) {
	const session = await auth();

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const userId = parseInt(session.user.id);

		const userCart = await db.query.carts.findFirst({
			where: eq(carts.userId, userId),
			with: {
				items: {
					with: { product: true },
				},
			},
		});

		if (!userCart) {
			return NextResponse.json({ items: [] });
		}

		const items = userCart.items.map((item: any) => ({
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
		}));

		return NextResponse.json({ items });
	} catch (error) {
		console.error("Failed to fetch cart:", error);
		return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
	}
}

// POST - Sync cart items to database
export async function POST(request: Request) {
	const session = await auth();

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { items } = await request.json();
		const userId = parseInt(session.user.id);

		// Find or create user cart
		let userCart = await db.query.carts.findFirst({
			where: eq(carts.userId, userId),
		});

		if (!userCart) {
			const [newCart] = await db.insert(carts).values({ userId }).returning();
			userCart = newCart;
		}

		// Clear existing items
		await db.delete(cartItems).where(eq(cartItems.cartId, userCart.id));

		// Insert new items
		if (items.length > 0) {
			await db.insert(cartItems).values(
				items.map((item: any) => ({
					cartId: userCart.id,
					productId: item.productId,
					quantity: item.quantity,
				}))
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to sync cart:", error);
		return NextResponse.json({ error: "Failed to sync cart" }, { status: 500 });
	}
}

// PUT - Update item quantity
export async function PUT(request: Request) {
	const session = await auth();

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { productId, quantity } = await request.json();
		const userId = parseInt(session.user.id);

		const userCart = await db.query.carts.findFirst({
			where: eq(carts.userId, userId),
		});

		if (!userCart) {
			return NextResponse.json({ error: "Cart not found" }, { status: 404 });
		}

		if (quantity <= 0) {
			await db.delete(cartItems).where(and(eq(cartItems.cartId, userCart.id), eq(cartItems.productId, productId)));
		} else {
			await db
				.update(cartItems)
				.set({ quantity })
				.where(and(eq(cartItems.cartId, userCart.id), eq(cartItems.productId, productId)));
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update cart item:", error);
		return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 });
	}
}

// DELETE - Remove item from cart
export async function DELETE(request: Request) {
	const session = await auth();

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const productId = searchParams.get("productId");

		if (!productId) {
			return NextResponse.json({ error: "Product ID required" }, { status: 400 });
		}

		const userId = parseInt(session.user.id);

		const userCart = await db.query.carts.findFirst({
			where: eq(carts.userId, userId),
		});

		if (!userCart) {
			return NextResponse.json({ error: "Cart not found" }, { status: 404 });
		}

		await db.delete(cartItems).where(and(eq(cartItems.cartId, userCart.id), eq(cartItems.productId, parseInt(productId))));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete cart item:", error);
		return NextResponse.json({ error: "Failed to delete cart item" }, { status: 500 });
	}
}
