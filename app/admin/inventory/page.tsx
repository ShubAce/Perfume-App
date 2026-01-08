import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { desc, asc, sql } from "drizzle-orm";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
	const { authorized } = await validateAdminAccess("inventory");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/inventory");
	}

	// Fetch all products with inventory info
	const productsList = await db.query.products.findMany({
		orderBy: asc(products.stock),
	});

	// Calculate inventory stats
	const stats = {
		totalProducts: productsList.length,
		totalStock: productsList.reduce((sum, p) => sum + (p.stock || 0), 0),
		lowStock: productsList.filter((p) => (p.stock || 0) < 10).length,
		outOfStock: productsList.filter((p) => (p.stock || 0) === 0).length,
	};

	return (
		<InventoryClient
			products={productsList}
			stats={stats}
		/>
	);
}
