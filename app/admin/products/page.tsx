import { db } from "@/src/index";
import { products, orderItems } from "@/src/db/schema";
import { desc, eq, ilike, or, and, sql, count, sum, lt, inArray } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import ProductsClient from "./ProductsClient";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
	const { authorized } = await validateAdminAccess("products");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/products");
	}

	const params = await searchParams;
	const page = typeof params.page === "string" ? parseInt(params.page) : 1;
	const limit = 20;
	const offset = (page - 1) * limit;
	const search = typeof params.search === "string" ? params.search : undefined;
	const gender = typeof params.gender === "string" ? params.gender : undefined;
	const stockFilter = typeof params.stock === "string" ? params.stock : undefined;

	// Build where conditions
	const conditions = [];
	if (search) {
		conditions.push(or(ilike(products.name, `%${search}%`), ilike(products.brand, `%${search}%`)));
	}
	if (gender && gender !== "all") {
		conditions.push(eq(products.gender, gender));
	}
	if (stockFilter === "low") {
		conditions.push(lt(products.stock, 10));
	} else if (stockFilter === "out") {
		conditions.push(eq(products.stock, 0));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Fetch products with pagination
	const [productsList, totalCount, genders, stockStats] = await Promise.all([
		db.query.products.findMany({
			where: whereClause,
			orderBy: desc(products.createdAt),
			limit,
			offset,
		}),
		db
			.select({ count: count() })
			.from(products)
			.where(whereClause)
			.then((r) => r[0]?.count || 0),
		db
			.selectDistinct({ gender: products.gender })
			.from(products)
			.where(sql`${products.gender} IS NOT NULL`),
		Promise.all([
			db
				.select({ count: count() })
				.from(products)
				.then((r) => r[0]?.count || 0),
			db
				.select({ count: count() })
				.from(products)
				.where(lt(products.stock, 10))
				.then((r) => r[0]?.count || 0),
			db
				.select({ count: count() })
				.from(products)
				.where(eq(products.stock, 0))
				.then((r) => r[0]?.count || 0),
		]),
	]);

	// Fetch sales stats for products
	const productIds = productsList.map((p) => p.id);
	const salesStats =
		productIds.length > 0
			? await db
					.select({
						productId: orderItems.productId,
						totalSold: sum(orderItems.quantity),
						revenue: sum(sql`${orderItems.quantity} * ${orderItems.priceAtPurchase}`),
					})
					.from(orderItems)
					.where(inArray(orderItems.productId, productIds))
					.groupBy(orderItems.productId)
			: [];

	const salesStatsMap = salesStats.reduce((acc, stat) => {
		if (stat.productId) {
			acc[stat.productId] = {
				totalSold: Number(stat.totalSold || 0),
				revenue: parseFloat(String(stat.revenue || 0)),
			};
		}
		return acc;
	}, {} as Record<number, { totalSold: number; revenue: number }>);

	const formattedProducts = productsList.map((product) => ({
		id: product.id,
		name: product.name,
		slug: product.slug,
		brand: product.brand,
		gender: product.gender,
		concentration: product.concentration,
		price: parseFloat(product.price),
		stock: product.stock,
		imageUrl: product.imageUrl,
		isTrending: product.isTrending,
		isActive: (product as { isActive?: boolean }).isActive !== false,
		createdAt: product.createdAt?.toISOString(),
		totalSold: salesStatsMap[product.id]?.totalSold || 0,
		revenue: salesStatsMap[product.id]?.revenue || 0,
	}));

	const genderList = genders.map((g) => g.gender).filter(Boolean) as string[];

	return (
		<ProductsClient
			products={formattedProducts}
			totalCount={totalCount}
			currentPage={page}
			pageSize={limit}
			genders={genderList}
			currentGender={gender}
			currentSearch={search}
			currentStockFilter={stockFilter}
			stockStats={{
				total: stockStats[0],
				lowStock: stockStats[1],
				outOfStock: stockStats[2],
			}}
		/>
	);
}
