import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { products, orderItems } from "@/src/db/schema";
import { desc, eq, sum, sql } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
	try {
		const { authorized, session, error } = await validateAdminAccess("products", "view");

		if (!authorized || !session?.user) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const gender = searchParams.get("gender");
		const includeDisabled = searchParams.get("includeDisabled") === "true";

		// Fetch all products
		const productsList = await db.query.products.findMany({
			orderBy: desc(products.createdAt),
		});

		// Filter based on params
		let filteredProducts = productsList;
		if (gender && gender !== "all") {
			filteredProducts = filteredProducts.filter((p) => p.gender === gender);
		}
		if (!includeDisabled) {
			filteredProducts = filteredProducts.filter((p) => p.isActive !== false);
		}

		// Get sales stats
		const salesStats = await db
			.select({
				productId: orderItems.productId,
				totalSold: sum(orderItems.quantity),
				revenue: sum(sql`${orderItems.quantity} * ${orderItems.priceAtPurchase}`),
			})
			.from(orderItems)
			.groupBy(orderItems.productId);

		const salesStatsMap = salesStats.reduce((acc, stat) => {
			if (stat.productId) {
				acc[stat.productId] = {
					totalSold: Number(stat.totalSold || 0),
					revenue: parseFloat(String(stat.revenue || 0)),
				};
			}
			return acc;
		}, {} as Record<number, { totalSold: number; revenue: number }>);

		// Generate CSV
		const headers = [
			"Product ID",
			"Name",
			"Slug",
			"Brand",
			"Gender",
			"Price",
			"Original Price",
			"Stock",
			"Status",
			"Concentration",
			"Size",
			"Units Sold",
			"Revenue",
			"Trending",
			"Created At",
		];

		const rows = filteredProducts.map((product) => [
			product.id,
			product.name,
			product.slug,
			product.brand,
			product.gender,
			product.price,
			product.originalPrice || "",
			product.stock,
			product.isActive !== false ? "Active" : "Disabled",
			product.concentration || "",
			product.size || "",
			salesStatsMap[product.id]?.totalSold || 0,
			salesStatsMap[product.id]?.revenue || 0,
			product.isTrending ? "Yes" : "No",
			product.createdAt ? new Date(product.createdAt).toISOString() : "N/A",
		]);

		const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");

		const filename = `products_${new Date().toISOString().split("T")[0]}.csv`;

		// Log export action
		const { auditLogs } = await import("@/src/db/schema");
		await db.insert(auditLogs).values({
			adminId: parseInt(session.user.id),
			action: "export_products",
			entityType: "product",
			entityId: null,
			details: {
				count: filteredProducts.length,
				filters: { gender, includeDisabled },
			},
			ipAddress: request.headers.get("x-forwarded-for") || "unknown",
		});

		return new NextResponse(csv, {
			status: 200,
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("Error exporting products:", error);
		return NextResponse.json({ error: "Failed to export products" }, { status: 500 });
	}
}
