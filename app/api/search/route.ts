import { NextResponse } from "next/server";
import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { ilike, or, sql, desc, asc, eq, and, gte, lte } from "drizzle-orm";

// Helper to create fuzzy/typo-tolerant search
function createFuzzyCondition(column: any, searchTerm: string) {
	// Create variations for typo tolerance
	const term = searchTerm.toLowerCase();
	return or(
		ilike(column, `%${term}%`),
		ilike(column, `%${term.slice(0, -1)}%`), // Missing last char
		ilike(column, `%${term.slice(1)}%`) // Missing first char
	);
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);

	const query = searchParams.get("q") || "";
	const limit = parseInt(searchParams.get("limit") || "20");
	const offset = parseInt(searchParams.get("offset") || "0");

	// Filters
	const gender = searchParams.get("gender");
	const brand = searchParams.get("brand");
	const minPrice = searchParams.get("minPrice");
	const maxPrice = searchParams.get("maxPrice");
	const concentration = searchParams.get("concentration");
	const mood = searchParams.get("mood");
	const occasion = searchParams.get("occasion");
	const season = searchParams.get("season");

	// Sorting
	const sortBy = searchParams.get("sortBy") || "relevance";
	const sortOrder = searchParams.get("sortOrder") || "desc";

	try {
		// Build search conditions
		const searchConditions: any[] = [];

		if (query) {
			const searchTerm = query.trim();
			searchConditions.push(
				or(
					createFuzzyCondition(products.name, searchTerm),
					createFuzzyCondition(products.brand, searchTerm),
					createFuzzyCondition(products.description, searchTerm),
					// Search in JSON scent notes
					sql`${products.scentNotes}::text ILIKE ${`%${searchTerm}%`}`
				)
			);
		}

		// Apply filters
		if (gender && gender !== "all") {
			searchConditions.push(eq(products.gender, gender));
		}

		if (brand) {
			searchConditions.push(ilike(products.brand, `%${brand}%`));
		}

		if (minPrice) {
			searchConditions.push(gte(products.price, minPrice));
		}

		if (maxPrice) {
			searchConditions.push(lte(products.price, maxPrice));
		}

		if (concentration) {
			searchConditions.push(eq(products.concentration, concentration));
		}

		// Mood/occasion/season search in description or notes
		if (mood) {
			searchConditions.push(or(ilike(products.description, `%${mood}%`), sql`${products.scentNotes}::text ILIKE ${`%${mood}%`}`));
		}

		if (occasion) {
			searchConditions.push(ilike(products.description, `%${occasion}%`));
		}

		if (season) {
			searchConditions.push(ilike(products.description, `%${season}%`));
		}

		// Build sort order
		let orderClause;
		switch (sortBy) {
			case "price-low":
				orderClause = asc(products.price);
				break;
			case "price-high":
				orderClause = desc(products.price);
				break;
			case "newest":
				orderClause = desc(products.createdAt);
				break;
			case "popular":
				orderClause = desc(products.isTrending);
				break;
			default:
				// Relevance - prioritize trending and exact matches
				orderClause = desc(products.isTrending);
		}

		// Execute query
		const whereClause = searchConditions.length > 0 ? and(...searchConditions) : undefined;

		const [searchResults, totalCount] = await Promise.all([
			db.query.products.findMany({
				where: whereClause,
				limit,
				offset,
				orderBy: orderClause,
			}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(products)
				.where(whereClause)
				.then((res) => Number(res[0]?.count || 0)),
		]);

		// Get unique brands for filter suggestions
		const brands = await db.selectDistinct({ brand: products.brand }).from(products).limit(20);

		// Get unique concentrations for filter suggestions
		const concentrations = await db
			.selectDistinct({ concentration: products.concentration })
			.from(products)
			.where(sql`${products.concentration} IS NOT NULL`)
			.limit(10);

		// Generate search suggestions based on query
		const suggestions: { type: string; text: string }[] = [];

		if (query) {
			// Brand suggestions
			const matchingBrands = brands.filter((b) => b.brand.toLowerCase().includes(query.toLowerCase()));
			matchingBrands.slice(0, 3).forEach((b) => {
				suggestions.push({ type: "brand", text: b.brand });
			});

			// Note suggestions
			const noteKeywords = ["citrus", "woody", "floral", "oriental", "fresh", "spicy", "sweet", "musky"];
			noteKeywords
				.filter((n) => n.includes(query.toLowerCase()))
				.slice(0, 3)
				.forEach((n) => {
					suggestions.push({ type: "note", text: n.charAt(0).toUpperCase() + n.slice(1) });
				});
		}

		return NextResponse.json(
			{
				products: searchResults,
				suggestions,
				pagination: {
					total: totalCount,
					limit,
					offset,
					hasMore: offset + limit < totalCount,
				},
				filters: {
					brands: brands.map((b) => b.brand),
					concentrations: concentrations.map((c) => c.concentration).filter(Boolean),
					genders: ["men", "women", "unisex"],
				},
			},
			{
				headers: {
					"Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
				},
			}
		);
	} catch (error) {
		console.error("Search failed:", error);
		return NextResponse.json({ error: "Search failed" }, { status: 500 });
	}
}
