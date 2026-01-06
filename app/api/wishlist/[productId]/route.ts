import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { wishlistItems } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

// DELETE - Remove item from wishlist
export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { productId } = await params;
		const productIdNum = parseInt(productId);
		const userId = parseInt(session.user.id);

		const [deleted] = await db
			.delete(wishlistItems)
			.where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productIdNum)))
			.returning();

		if (!deleted) {
			return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error removing from wishlist:", error);
		return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
	}
}
