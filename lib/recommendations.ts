import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { eq, and, ne, or, desc, sql, ilike } from "drizzle-orm";

interface ScentNotes {
	top: string[];
	middle: string[];
	base: string[];
}

interface Product {
	id: number;
	name: string;
	brand: string;
	slug: string;
	price: string;
	imageUrl: string | null;
	gender: string;
	concentration: string | null;
	scentNotes: ScentNotes | null;
	isTrending: boolean;
}

// Get similar products based on scent notes
export async function getSimilarByNotes(productId: number, notes: ScentNotes | null, limit = 4): Promise<Product[]> {
	if (!notes) return [];

	const allNotes = [...(notes.top || []), ...(notes.middle || []), ...(notes.base || [])];
	if (allNotes.length === 0) return [];

	try {
		// Search for products with similar notes
		const conditions = allNotes.slice(0, 5).map((note) => sql`COALESCE(${products.scentNotes}::text, '') ILIKE ${`%${note}%`}`);

		const similar = await db.query.products.findMany({
			where: and(ne(products.id, productId), or(...conditions)),
			limit,
			orderBy: desc(products.isTrending),
		});

		return similar as Product[];
	} catch (error) {
		console.error("getSimilarByNotes error:", error);
		return [];
	}
}

// Get products from the same brand
export async function getSamebraBrand(productId: number, brand: string, limit = 4): Promise<Product[]> {
	const sameBrand = await db.query.products.findMany({
		where: and(eq(products.brand, brand), ne(products.id, productId)),
		limit,
		orderBy: desc(products.isTrending),
	});

	return sameBrand as Product[];
}

// Get products for same gender
export async function getSameGender(productId: number, gender: string, limit = 4): Promise<Product[]> {
	const sameGender = await db.query.products.findMany({
		where: and(eq(products.gender, gender), ne(products.id, productId)),
		limit,
		orderBy: desc(products.isTrending),
	});

	return sameGender as Product[];
}

// Get trending products
export async function getTrendingProducts(limit = 6): Promise<Product[]> {
	const trending = await db.query.products.findMany({
		where: eq(products.isTrending, true),
		limit,
		orderBy: desc(products.createdAt),
	});

	return trending as Product[];
}

// Get seasonal recommendations
export async function getSeasonalPicks(season: "spring" | "summer" | "fall" | "winter", limit = 6): Promise<Product[]> {
	const seasonNotes: Record<string, string[]> = {
		spring: ["floral", "green", "citrus", "light", "fresh"],
		summer: ["citrus", "aquatic", "fresh", "light", "marine"],
		fall: ["woody", "spicy", "amber", "warm", "oriental"],
		winter: ["oriental", "woody", "vanilla", "amber", "musk"],
	};

	const notes = seasonNotes[season];

	try {
		// Use COALESCE to handle NULL values and cast JSON to text for searching
		const conditions = notes.map((note) => sql`COALESCE(${products.scentNotes}::text, '') ILIKE ${`%${note}%`}`);

		const picks = await db.query.products.findMany({
			where: or(...conditions),
			limit,
			orderBy: desc(products.isTrending),
		});

		return picks as Product[];
	} catch (error) {
		console.error("getSeasonalPicks error:", error);
		// Fallback: return trending products if query fails
		const fallbackPicks = await db.query.products.findMany({
			where: eq(products.isActive, true),
			limit,
			orderBy: desc(products.isTrending),
		});
		return fallbackPicks as Product[];
	}
}

// Get mood-based recommendations
export async function getMoodPicks(mood: string, limit = 6): Promise<Product[]> {
	const moodNotes: Record<string, string[]> = {
		fresh: ["citrus", "green", "aquatic", "mint", "bergamot"],
		sensual: ["vanilla", "musk", "amber", "jasmine", "rose"],
		woody: ["cedar", "sandalwood", "vetiver", "oud", "patchouli"],
		spicy: ["pepper", "cinnamon", "cardamom", "ginger", "clove"],
		sweet: ["vanilla", "caramel", "honey", "praline", "tonka"],
		romantic: ["rose", "jasmine", "peony", "ylang", "tuberose"],
		bold: ["oud", "leather", "tobacco", "incense", "smoky"],
		mysterious: ["incense", "amber", "oud", "dark", "oriental"],
	};

	const notes = moodNotes[mood.toLowerCase()] || ["fresh"];

	try {
		// Create OR conditions for each scent note
		// Use COALESCE to handle NULL values and cast JSON to text for searching
		const conditions = notes.map((note) => sql`COALESCE(${products.scentNotes}::text, '') ILIKE ${`%${note}%`}`);

		const picks = await db.query.products.findMany({
			where: or(...conditions),
			limit,
			orderBy: desc(products.isTrending),
		});

		return picks as Product[];
	} catch (error) {
		console.error("getMoodPicks error:", error);
		// Fallback: return trending products if query fails
		const fallbackPicks = await db.query.products.findMany({
			where: eq(products.isActive, true),
			limit,
			orderBy: desc(products.isTrending),
		});
		return fallbackPicks as Product[];
	}
}

// Get occasion-based recommendations
export async function getOccasionPicks(occasion: string, limit = 6): Promise<Product[]> {
	const occasionCriteria: Record<string, { notes: string[]; concentration?: string }> = {
		office: { notes: ["fresh", "light", "clean", "citrus"], concentration: "Eau de Toilette" },
		date: { notes: ["sensual", "romantic", "vanilla", "musk", "rose"] },
		party: { notes: ["bold", "sweet", "spicy", "oriental"] },
		daily: { notes: ["fresh", "light", "citrus", "clean"], concentration: "Eau de Toilette" },
		special: { notes: ["oud", "amber", "luxury", "rare"], concentration: "Parfum" },
		beach: { notes: ["aquatic", "marine", "coconut", "fresh", "citrus"] },
		evening: { notes: ["oriental", "amber", "woody", "warm"] },
	};

	const criteria = occasionCriteria[occasion.toLowerCase()] || occasionCriteria.daily;

	try {
		const conditions = criteria.notes.map((note) => sql`COALESCE(${products.scentNotes}::text, '') ILIKE ${`%${note}%`}`);

		let whereClause = or(...conditions);
		if (criteria.concentration) {
			whereClause = and(whereClause, eq(products.concentration, criteria.concentration));
		}

		const picks = await db.query.products.findMany({
			where: whereClause,
			limit,
			orderBy: desc(products.isTrending),
		});

		return picks as Product[];
	} catch (error) {
		console.error("getOccasionPicks error:", error);
		const fallbackPicks = await db.query.products.findMany({
			where: eq(products.isActive, true),
			limit,
			orderBy: desc(products.isTrending),
		});
		return fallbackPicks as Product[];
	}
}

// Get price-based alternatives (more affordable)
export async function getAffordableAlternatives(productId: number, currentPrice: number, notes: ScentNotes | null, limit = 4): Promise<Product[]> {
	if (!notes) return [];

	const allNotes = [...(notes.top || []), ...(notes.middle || []), ...(notes.base || [])];

	try {
		const noteConditions = allNotes.slice(0, 3).map((note) => sql`COALESCE(${products.scentNotes}::text, '') ILIKE ${`%${note}%`}`);

		const alternatives = await db.query.products.findMany({
			where: and(ne(products.id, productId), sql`${products.price}::numeric < ${currentPrice}`, or(...noteConditions)),
			limit,
			orderBy: desc(products.price),
		});

		return alternatives as Product[];
	} catch (error) {
		console.error("getAffordableAlternatives error:", error);
		return [];
	}
}

// Get complementary products (pairs well with)
export async function getComplementaryProducts(productId: number, notes: ScentNotes | null, gender: string, limit = 4): Promise<Product[]> {
	if (!notes) return [];

	// Find products with complementary notes
	const complementaryMap: Record<string, string[]> = {
		citrus: ["woody", "musk", "amber"],
		floral: ["woody", "musk", "vanilla"],
		woody: ["citrus", "spicy", "amber"],
		oriental: ["citrus", "fresh", "green"],
		fresh: ["woody", "amber", "musk"],
		spicy: ["sweet", "woody", "citrus"],
	};

	const allNotes = [...(notes.top || []), ...(notes.middle || []), ...(notes.base || [])].map((n) => n.toLowerCase());
	const complementary: string[] = [];

	for (const note of allNotes) {
		for (const [key, values] of Object.entries(complementaryMap)) {
			if (note.includes(key)) {
				complementary.push(...values);
			}
		}
	}

	const uniqueComplementary = [...new Set(complementary)].slice(0, 5);
	if (uniqueComplementary.length === 0) return [];

	try {
		const conditions = uniqueComplementary.map((note) => sql`COALESCE(${products.scentNotes}::text, '') ILIKE ${`%${note}%`}`);

		const picks = await db.query.products.findMany({
			where: and(ne(products.id, productId), eq(products.gender, gender), or(...conditions)),
			limit,
			orderBy: desc(products.isTrending),
		});

		return picks as Product[];
	} catch (error) {
		console.error("getComplementaryProducts error:", error);
		return [];
	}
}

// Get personalized recommendations based on user preferences
export async function getPersonalizedPicks(
	preferences: {
		brands: string[];
		scentFamilies: string[];
		viewedProductIds: number[];
	},
	limit = 8
): Promise<Product[]> {
	const conditions: any[] = [];

	// Prefer favorite brands
	if (preferences.brands.length > 0) {
		conditions.push(or(...preferences.brands.map((brand) => eq(products.brand, brand))));
	}

	// Prefer favorite scent families
	if (preferences.scentFamilies.length > 0) {
		conditions.push(or(...preferences.scentFamilies.map((scent) => sql`COALESCE(${products.scentNotes}::text, '') ILIKE ${`%${scent}%`}`)));
	}

	// Exclude already viewed
	if (preferences.viewedProductIds.length > 0) {
		conditions.push(
			sql`${products.id} NOT IN (${sql.join(
				preferences.viewedProductIds.map((id) => sql`${id}`),
				sql`, `
			)})`
		);
	}

	const picks = await db.query.products.findMany({
		where: conditions.length > 0 ? and(...conditions) : undefined,
		limit,
		orderBy: desc(products.isTrending),
	});

	return picks as Product[];
}
