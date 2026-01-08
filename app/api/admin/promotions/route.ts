import { NextResponse } from "next/server";
import { db } from "@/src/index";
import { coupons } from "@/src/db/schema";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function POST(request: Request) {
	const { authorized } = await validateAdminAccess("promotions");
	if (!authorized) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { code, discountType, discountValue, minOrderAmount, maxUses, validFrom, validUntil, isActive } = body;

		const [newCoupon] = await db
			.insert(coupons)
			.values({
				code: code.toUpperCase(),
				discountType,
				discountValue,
				minOrderAmount: minOrderAmount || null,
				usageLimit: maxUses ? parseInt(maxUses) : null,
				isActive,
				expiresAt: validUntil ? new Date(validUntil) : null,
			})
			.returning();

		return NextResponse.json({ coupon: newCoupon });
	} catch (error: any) {
		console.error("Error creating coupon:", error);
		if (error.code === "23505") {
			return NextResponse.json({ message: "Coupon code already exists" }, { status: 400 });
		}
		return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
	}
}

export async function GET() {
	const { authorized } = await validateAdminAccess("promotions");
	if (!authorized) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const couponsList = await db.query.coupons.findMany({
			orderBy: (coupons, { desc }) => desc(coupons.createdAt),
		});

		return NextResponse.json({ coupons: couponsList });
	} catch (error) {
		console.error("Error fetching coupons:", error);
		return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
	}
}
