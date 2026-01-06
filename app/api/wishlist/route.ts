import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { wishlistItems, products } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch all wishlist items for user
export async function GET() {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = parseInt(session.user.id);
		const userWishlist = await db.query.wishlistItems.findMany({
			where: eq(wishlistItems.userId, userId),
			with: {
				product: true,
			},
			orderBy: (wishlistItems, { desc }) => [desc(wishlistItems.createdAt)],
		});

		return NextResponse.json(userWishlist);
	} catch (error) {
		console.error("Error fetching wishlist:", error);
		return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
	}
}

// POST - Add item to wishlist
export async function POST(req: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = parseInt(session.user.id);
		const { productId } = await req.json();

		if (!productId) {
			return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
		}

		// Check if product exists
		const product = await db.query.products.findFirst({
			where: eq(products.id, productId),
		});

		if (!product) {
			return NextResponse.json({ error: "Product not found" }, { status: 404 });
		}

		// Check if already in wishlist
		const existing = await db.query.wishlistItems.findFirst({
			where: and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)),
		});

		if (existing) {
			return NextResponse.json({ error: "Item already in wishlist" }, { status: 409 });
		}

		const [newItem] = await db
			.insert(wishlistItems)
			.values({
				userId,
				productId,
			})
			.returning();

		// Return with product info
		const wishlistItem = await db.query.wishlistItems.findFirst({
			where: eq(wishlistItems.id, newItem.id),
			with: {
				product: true,
			},
		});

		return NextResponse.json(wishlistItem, { status: 201 });
	} catch (error) {
		console.error("Error adding to wishlist:", error);
		return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
	}
}
