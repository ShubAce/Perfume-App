import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { orders, orderItems, products, users } from "@/src/db/schema";
import { sql, desc, gte, eq, and, sum } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
	try {
		const { authorized, error } = await validateAdminAccess("analytics", "view");

		if (!authorized) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type") || "summary";
		const days = parseInt(searchParams.get("days") || "30");

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		if (type === "summary") {
			// Daily revenue summary
			const dailyRevenue = await db
				.select({
					date: sql<string>`DATE(${orders.createdAt})`,
					revenue: sql<number>`SUM(${orders.totalAmount})`,
					orderCount: sql<number>`COUNT(*)`,
				})
				.from(orders)
				.where(gte(orders.createdAt, startDate))
				.groupBy(sql`DATE(${orders.createdAt})`)
				.orderBy(desc(sql`DATE(${orders.createdAt})`));

			const headers = ["Date", "Revenue", "Order Count"];
			const rows = dailyRevenue.map((day) => {
				return [day.date, day.revenue || 0, day.orderCount].join(",");
			});

			const csv = [headers.join(","), ...rows].join("\n");

			return new NextResponse(csv, {
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": `attachment; filename="analytics-summary-${new Date().toISOString().split("T")[0]}.csv"`,
				},
			});
		} else if (type === "products") {
			// Top selling products
			const topProducts = await db
				.select({
					productId: orderItems.productId,
					productName: products.name,
					brand: products.brand,
					unitsSold: sql<number>`SUM(${orderItems.quantity})`,
					revenue: sql<number>`SUM(${orderItems.quantity} * ${orderItems.priceAtPurchase})`,
				})
				.from(orderItems)
				.innerJoin(products, eq(orderItems.productId, products.id))
				.innerJoin(orders, eq(orderItems.orderId, orders.id))
				.where(gte(orders.createdAt, startDate))
				.groupBy(orderItems.productId, products.name, products.brand)
				.orderBy(desc(sql`SUM(${orderItems.quantity} * ${orderItems.priceAtPurchase})`))
				.limit(50);

			const headers = ["Product ID", "Product Name", "Brand", "Units Sold", "Revenue"];
			const rows = topProducts.map((p) => {
				return [p.productId, `"${p.productName.replace(/"/g, '""')}"`, `"${p.brand.replace(/"/g, '""')}"`, p.unitsSold, p.revenue].join(",");
			});

			const csv = [headers.join(","), ...rows].join("\n");

			return new NextResponse(csv, {
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": `attachment; filename="top-products-${new Date().toISOString().split("T")[0]}.csv"`,
				},
			});
		} else if (type === "brands") {
			// Revenue by brand
			const brandRevenue = await db
				.select({
					brand: products.brand,
					unitsSold: sql<number>`SUM(${orderItems.quantity})`,
					revenue: sql<number>`SUM(${orderItems.quantity} * ${orderItems.priceAtPurchase})`,
				})
				.from(orderItems)
				.innerJoin(products, eq(orderItems.productId, products.id))
				.innerJoin(orders, eq(orderItems.orderId, orders.id))
				.where(gte(orders.createdAt, startDate))
				.groupBy(products.brand)
				.orderBy(desc(sql`SUM(${orderItems.quantity} * ${orderItems.priceAtPurchase})`));

			const headers = ["Brand", "Units Sold", "Revenue"];
			const rows = brandRevenue.map((b) => {
				return [`"${b.brand.replace(/"/g, '""')}"`, b.unitsSold, b.revenue].join(",");
			});

			const csv = [headers.join(","), ...rows].join("\n");

			return new NextResponse(csv, {
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": `attachment; filename="brand-analytics-${new Date().toISOString().split("T")[0]}.csv"`,
				},
			});
		}

		return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
	} catch (error) {
		console.error("Error exporting analytics:", error);
		return NextResponse.json({ error: "Failed to export analytics" }, { status: 500 });
	}
}
