import { NextResponse } from "next/server";
import { db } from "@/src/index";
import { coupons } from "@/src/db/schema";
import { validateAdminAccess } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { authorized } = await validateAdminAccess("promotions");
	if (!authorized) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const couponId = parseInt(id);
		const body = await request.json();

		const updateData: any = {};
		if (body.code !== undefined) updateData.code = body.code.toUpperCase();
		if (body.discountType !== undefined) updateData.discountType = body.discountType;
		if (body.discountValue !== undefined) updateData.discountValue = body.discountValue;
		if (body.minOrderAmount !== undefined) updateData.minOrderAmount = body.minOrderAmount || null;
		if (body.maxUses !== undefined) updateData.usageLimit = body.maxUses ? parseInt(body.maxUses) : null;
		if (body.isActive !== undefined) updateData.isActive = body.isActive;
		if (body.validUntil !== undefined) updateData.expiresAt = body.validUntil ? new Date(body.validUntil) : null;

		const [updatedCoupon] = await db.update(coupons).set(updateData).where(eq(coupons.id, couponId)).returning();

		return NextResponse.json({ coupon: updatedCoupon });
	} catch (error) {
		console.error("Error updating coupon:", error);
		return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
	}
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { authorized } = await validateAdminAccess("promotions");
	if (!authorized) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const couponId = parseInt(id);

		await db.delete(coupons).where(eq(coupons.id, couponId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting coupon:", error);
		return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
	}
}
