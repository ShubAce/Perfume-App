import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { asc, desc } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
	try {
		const { authorized, error } = await validateAdminAccess("inventory", "view");

		if (!authorized) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const filter = searchParams.get("filter") || "all";

		// Fetch products
		let productsList = await db.query.products.findMany({
			orderBy: asc(products.stock),
		});

		// Apply filter
		if (filter === "low") {
			productsList = productsList.filter((p) => p.stock > 0 && p.stock < 10);
		} else if (filter === "out") {
			productsList = productsList.filter((p) => p.stock === 0);
		}

		// Generate CSV
		const headers = ["Product ID", "Name", "Brand", "Price", "Stock", "Status", "Active"];

		const rows = productsList.map((product) => {
			const status = product.stock === 0 ? "Out of Stock" : product.stock < 10 ? "Low Stock" : "In Stock";
			return [
				product.id,
				`"${product.name.replace(/"/g, '""')}"`,
				`"${product.brand.replace(/"/g, '""')}"`,
				product.price,
				product.stock,
				status,
				product.isActive ? "Yes" : "No",
			].join(",");
		});

		const csv = [headers.join(","), ...rows].join("\n");

		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="inventory-export-${new Date().toISOString().split("T")[0]}.csv"`,
			},
		});
	} catch (error) {
		console.error("Error exporting inventory:", error);
		return NextResponse.json({ error: "Failed to export inventory" }, { status: 500 });
	}
}
