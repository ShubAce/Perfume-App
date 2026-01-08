import { db } from "@/src/index";
import { coupons } from "@/src/db/schema";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import PromotionsClient from "./PromotionsClient";

export default async function PromotionsPage() {
	const { authorized } = await validateAdminAccess("promotions");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/promotions");
	}

	// Fetch all coupons/promotions
	const couponsList = await db.query.coupons.findMany({
		orderBy: desc(coupons.createdAt),
	});

	return <PromotionsClient coupons={couponsList} />;
}
