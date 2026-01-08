import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { orders } from "@/src/db/schema";
import { desc, eq, gte, and, sum } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
	try {
		const { authorized, error } = await validateAdminAccess("finance", "view");

		if (!authorized) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const period = searchParams.get("period") || "all";

		// Get date range based on period
		const now = new Date();
		let startDate: Date | null = null;

		switch (period) {
			case "today":
				startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				break;
			case "week":
				startDate = new Date(now);
				startDate.setDate(startDate.getDate() - 7);
				break;
			case "month":
				startDate = new Date(now.getFullYear(), now.getMonth(), 1);
				break;
			case "year":
				startDate = new Date(now.getFullYear(), 0, 1);
				break;
		}

		// Build conditions
		const conditions = [];
		if (startDate) {
			conditions.push(gte(orders.createdAt, startDate));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Fetch orders for financial report
		const ordersList = await db.query.orders.findMany({
			where: whereClause,
			with: {
				user: true,
			},
			orderBy: desc(orders.createdAt),
		});

		// Generate CSV
		const headers = ["Order ID", "Customer Name", "Customer Email", "Amount", "Status", "Payment ID", "Date"];

		const rows = ordersList.map((order) => {
			return [
				order.id,
				`"${(order.user?.name || "Guest").replace(/"/g, '""')}"`,
				order.user?.email || "",
				order.totalAmount,
				order.status || "pending",
				order.stripePaymentId || "",
				order.createdAt ? new Date(order.createdAt).toISOString() : "",
			].join(",");
		});

		// Add summary row
		const totalRevenue = ordersList.filter((o) => o.status === "delivered").reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
		const totalOrders = ordersList.length;
		const deliveredOrders = ordersList.filter((o) => o.status === "delivered").length;

		rows.push("");
		rows.push(`Summary,,,,,`);
		rows.push(`Total Orders,${totalOrders},,,,`);
		rows.push(`Delivered Orders,${deliveredOrders},,,,`);
		rows.push(`Total Revenue,₹${totalRevenue.toFixed(2)},,,,`);

		const csv = [headers.join(","), ...rows].join("\n");

		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="finance-report-${new Date().toISOString().split("T")[0]}.csv"`,
			},
		});
	} catch (error) {
		console.error("Error exporting finance report:", error);
		return NextResponse.json({ error: "Failed to export finance report" }, { status: 500 });
	}
}
