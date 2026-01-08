import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { products, auditLogs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

// Helper to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, excludeId: number): Promise<string> {
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const existing = await db.query.products.findFirst({
			where: eq(products.slug, slug),
		});

		if (!existing || existing.id === excludeId) {
			return slug;
		}

		slug = `${baseSlug}-${counter}`;
		counter++;
	}
}

// GET - Get single product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { authorized, error } = await validateAdminAccess("products", "view");

		if (!authorized) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const productId = parseInt(id);

		const product = await db.query.products.findFirst({
			where: eq(products.id, productId),
		});

		if (!product) {
			return NextResponse.json({ error: "Product not found" }, { status: 404 });
		}

		return NextResponse.json(product);
	} catch (error) {
		console.error("Error fetching product:", error);
		return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
	}
}

// PATCH - Update product
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { authorized, session, error } = await validateAdminAccess("products", "edit");

		if (!authorized || !session?.user) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const productId = parseInt(id);
		const body = await request.json();

		// Get current product
		const currentProduct = await db.query.products.findFirst({
			where: eq(products.id, productId),
		});

		if (!currentProduct) {
			return NextResponse.json({ error: "Product not found" }, { status: 404 });
		}

		// Validate price if provided
		if (body.price !== undefined && parseFloat(body.price) <= 0) {
			return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
		}

		// Validate stock if provided
		if (body.stock !== undefined && parseInt(body.stock) < 0) {
			return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 });
		}

		// Handle slug update
		let slug = body.slug;
		if (slug && slug !== currentProduct.slug) {
			slug = await ensureUniqueSlug(slug, productId);
		}

		// Build update object
		const updateData: Record<string, any> = {
			updatedAt: new Date(),
		};

		if (body.name !== undefined) updateData.name = body.name;
		if (slug) updateData.slug = slug;
		if (body.description !== undefined) updateData.description = body.description;
		if (body.price !== undefined) updateData.price = body.price.toString();
		if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice?.toString() || null;
		if (body.stock !== undefined) updateData.stock = parseInt(body.stock);
		if (body.brand !== undefined) updateData.brand = body.brand;
		if (body.concentration !== undefined) updateData.concentration = body.concentration;
		if (body.size !== undefined) updateData.size = body.size;
		if (body.scentNotes !== undefined) updateData.scentNotes = body.scentNotes;
		if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
		if (body.gender !== undefined) updateData.gender = body.gender;
		if (body.isTrending !== undefined) updateData.isTrending = body.isTrending;
		if (body.isActive !== undefined) updateData.isActive = body.isActive;
		if (body.occasion !== undefined) updateData.occasion = body.occasion;
		if (body.longevity !== undefined) updateData.longevity = body.longevity;
		if (body.projection !== undefined) updateData.projection = body.projection;

		// Update product
		const [updatedProduct] = await db.update(products).set(updateData).where(eq(products.id, productId)).returning();

		// Track changes for audit log
		const changes: Record<string, { from: any; to: any }> = {};
		for (const key of Object.keys(body)) {
			if (key !== "updatedAt" && (currentProduct as any)[key] !== body[key]) {
				changes[key] = {
					from: (currentProduct as any)[key],
					to: body[key],
				};
			}
		}

		// Log the action
		await db.insert(auditLogs).values({
			adminId: parseInt(session.user.id),
			action: "product_update",
			entityType: "product",
			entityId: productId,
			details: {
				productName: updatedProduct.name,
				changes,
			},
			ipAddress: request.headers.get("x-forwarded-for") || "unknown",
		});

		return NextResponse.json(updatedProduct);
	} catch (error) {
		console.error("Error updating product:", error);
		return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
	}
}

// DELETE - Soft delete (disable) product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { authorized, session, error } = await validateAdminAccess("products", "edit");

		if (!authorized || !session?.user) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const productId = parseInt(id);
		const { searchParams } = new URL(request.url);
		const hardDelete = searchParams.get("hard") === "true";

		// Get current product
		const currentProduct = await db.query.products.findFirst({
			where: eq(products.id, productId),
		});

		if (!currentProduct) {
			return NextResponse.json({ error: "Product not found" }, { status: 404 });
		}

		if (hardDelete) {
			// Hard delete - only for super_admin
			const { role } = await validateAdminAccess("products", "edit");
			if (role !== "super_admin") {
				return NextResponse.json({ error: "Only super admins can permanently delete products" }, { status: 403 });
			}

			await db.delete(products).where(eq(products.id, productId));

			await db.insert(auditLogs).values({
				adminId: parseInt(session.user.id),
				action: "product_hard_delete",
				entityType: "product",
				entityId: productId,
				details: {
					productName: currentProduct.name,
					brand: currentProduct.brand,
				},
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
			});

			return NextResponse.json({ success: true, message: "Product permanently deleted" });
		} else {
			// Soft delete - disable product
			await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, productId));

			await db.insert(auditLogs).values({
				adminId: parseInt(session.user.id),
				action: "product_disable",
				entityType: "product",
				entityId: productId,
				details: {
					productName: currentProduct.name,
					brand: currentProduct.brand,
				},
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
			});

			return NextResponse.json({ success: true, message: "Product disabled" });
		}
	} catch (error) {
		console.error("Error deleting product:", error);
		return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
	}
}
