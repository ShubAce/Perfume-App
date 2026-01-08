import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { coupons } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
	try {
		const { authorized, error } = await validateAdminAccess("promotions", "view");

		if (!authorized) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		// Fetch coupons
		const couponsList = await db.query.coupons.findMany({
			orderBy: desc(coupons.createdAt),
		});

		// Generate CSV
		const headers = [
			"Coupon ID",
			"Code",
			"Discount Type",
			"Discount Value",
			"Min Order Amount",
			"Usage Limit",
			"Used Count",
			"Active",
			"Expires At",
			"Created At",
		];

		const rows = couponsList.map((coupon) => {
			return [
				coupon.id,
				coupon.code,
				coupon.discountType,
				coupon.discountValue,
				coupon.minOrderAmount || "",
				coupon.usageLimit || "Unlimited",
				coupon.usedCount || 0,
				coupon.isActive ? "Yes" : "No",
				coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "No expiry",
				coupon.createdAt ? new Date(coupon.createdAt).toISOString().split("T")[0] : "",
			].join(",");
		});

		const csv = [headers.join(","), ...rows].join("\n");

		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="promotions-export-${new Date().toISOString().split("T")[0]}.csv"`,
			},
		});
	} catch (error) {
		console.error("Error exporting promotions:", error);
		return NextResponse.json({ error: "Failed to export promotions" }, { status: 500 });
	}
}
