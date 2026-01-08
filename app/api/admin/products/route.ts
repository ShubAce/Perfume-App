import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { products, auditLogs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

// Helper to generate slug
function generateSlug(name: string, brand: string): string {
	const base = `${brand}-${name}`
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	return base;
}

// Helper to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const existing = await db.query.products.findFirst({
			where: eq(products.slug, slug),
		});

		if (!existing || (excludeId && existing.id === excludeId)) {
			return slug;
		}

		slug = `${baseSlug}-${counter}`;
		counter++;
	}
}

// GET - List all products (for admin)
export async function GET(request: NextRequest) {
	try {
		const { authorized, error } = await validateAdminAccess("products", "view");

		if (!authorized) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const productsList = await db.query.products.findMany({
			orderBy: (products, { desc }) => [desc(products.createdAt)],
		});

		return NextResponse.json(productsList);
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
	}
}

// POST - Create new product
export async function POST(request: NextRequest) {
	try {
		const { authorized, session, error } = await validateAdminAccess("products", "edit");

		if (!authorized || !session?.user) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		// Validate required fields
		const requiredFields = ["name", "brand", "price"];
		for (const field of requiredFields) {
			if (!body[field]) {
				return NextResponse.json({ error: `${field} is required` }, { status: 400 });
			}
		}

		// Validate price
		if (parseFloat(body.price) <= 0) {
			return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
		}

		// Validate stock
		if (body.stock !== undefined && parseInt(body.stock) < 0) {
			return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 });
		}

		// Generate unique slug
		let slug = body.slug || generateSlug(body.name, body.brand);
		slug = await ensureUniqueSlug(slug);

		// Create product
		const [newProduct] = await db
			.insert(products)
			.values({
				name: body.name,
				slug,
				description: body.description || null,
				price: body.price.toString(),
				originalPrice: body.originalPrice?.toString() || null,
				stock: parseInt(body.stock) || 0,
				brand: body.brand,
				concentration: body.concentration || null,
				size: body.size || null,
				scentNotes: body.scentNotes || null,
				imageUrl: body.imageUrl || null,
				gender: body.gender || "unisex",
				isTrending: body.isTrending || false,
				isActive: body.isActive !== false,
				occasion: body.occasion || null,
				longevity: body.longevity || null,
				projection: body.projection || null,
			})
			.returning();

		// Log the action
		await db.insert(auditLogs).values({
			adminId: parseInt(session.user.id),
			action: "product_create",
			entityType: "product",
			entityId: newProduct.id,
			details: {
				name: newProduct.name,
				brand: newProduct.brand,
				price: newProduct.price,
			},
			ipAddress: request.headers.get("x-forwarded-for") || "unknown",
		});

		return NextResponse.json(newProduct, { status: 201 });
	} catch (error) {
		console.error("Error creating product:", error);
		return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
	}
}
