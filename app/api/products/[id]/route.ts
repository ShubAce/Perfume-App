import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const productId = parseInt(id);

		if (isNaN(productId)) {
			return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
		}

		const product = await db.query.products.findFirst({
			where: eq(products.id, productId),
		});

		if (!product) {
			return NextResponse.json({ error: "Product not found" }, { status: 404 });
		}

		return NextResponse.json(product, {
			headers: {
				"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
			},
		});
	} catch (error) {
		console.error("Error fetching product:", error);
		return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
	}
}
