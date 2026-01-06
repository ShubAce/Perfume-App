import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { sql, inArray, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const productIdsParam = searchParams.get("productIds");

		if (!productIdsParam) {
			return NextResponse.json({ products: [] });
		}

		const productIds = productIdsParam.split(",").map(Number).filter(Boolean);

		if (productIds.length === 0) {
			return NextResponse.json({ products: [] });
		}

		// Get cart products to find their scent notes
		const cartProducts = await db
			.select({
				id: products.id,
				scentNotes: products.scentNotes,
				brand: products.brand,
				gender: products.gender,
			})
			.from(products)
			.where(inArray(products.id, productIds));

		// Extract all scent notes from cart products
		const allNotes: string[] = [];
		const brands = new Set<string>();
		const genders = new Set<string>();

		for (const p of cartProducts) {
			if (p.scentNotes) {
				const notes = p.scentNotes as { top?: string[]; middle?: string[]; base?: string[] };
				if (notes.top) allNotes.push(...notes.top);
				if (notes.middle) allNotes.push(...notes.middle);
				if (notes.base) allNotes.push(...notes.base);
			}
			if (p.brand) brands.add(p.brand);
			if (p.gender) genders.add(p.gender);
		}

		// Complementary scent map for "pairs well"
		const complementaryMap: Record<string, string[]> = {
			bergamot: ["vanilla", "sandalwood", "amber"],
			citrus: ["vanilla", "musk", "cedar"],
			vanilla: ["bergamot", "rose", "sandalwood"],
			rose: ["oud", "musk", "vanilla"],
			oud: ["rose", "saffron", "amber"],
			musk: ["citrus", "rose", "cedar"],
			sandalwood: ["vanilla", "jasmine", "bergamot"],
			jasmine: ["sandalwood", "musk", "amber"],
			amber: ["oud", "jasmine", "bergamot"],
			cedar: ["citrus", "musk", "leather"],
			leather: ["cedar", "tobacco", "oud"],
			tobacco: ["leather", "vanilla", "amber"],
			saffron: ["oud", "rose", "vanilla"],
			lavender: ["vanilla", "musk", "amber"],
			patchouli: ["vanilla", "rose", "bergamot"],
			vetiver: ["citrus", "amber", "sandalwood"],
		};

		// Find complementary notes
		const complementaryNotes = new Set<string>();
		for (const note of allNotes) {
			const lowerNote = note.toLowerCase();
			for (const [key, complements] of Object.entries(complementaryMap)) {
				if (lowerNote.includes(key)) {
					for (const c of complements) {
						complementaryNotes.add(c);
					}
				}
			}
		}

		// Build search conditions for complementary products
		let recommendations: { id: number; name: string; brand: string | null; slug: string; price: string; imageUrl: string | null }[] = [];

		if (complementaryNotes.size > 0) {
			const noteConditions = Array.from(complementaryNotes)
				.slice(0, 5)
				.map((note) => sql`${products.scentNotes}::text ILIKE ${`%${note}%`}`);

			// Exclude cart products
			if (productIds.length > 0) {
				recommendations = await db
					.select({
						id: products.id,
						name: products.name,
						brand: products.brand,
						slug: products.slug,
						price: products.price,
						imageUrl: products.imageUrl,
					})
					.from(products)
					.where(
						and(
							sql`(${sql.join(noteConditions, sql` OR `)})`,
							sql`${products.id} NOT IN (${sql.join(
								productIds.map((id) => sql`${id}`),
								sql`, `
							)})`
						)
					)
					.limit(8);
			}
		}

		// If we don't have enough recommendations, add random products
		if (recommendations.length < 4) {
			const excludeIds = [...productIds, ...recommendations.map((r) => r.id)];
			const additionalRecs = await db
				.select({
					id: products.id,
					name: products.name,
					brand: products.brand,
					slug: products.slug,
					price: products.price,
					imageUrl: products.imageUrl,
				})
				.from(products)
				.where(
					sql`${products.id} NOT IN (${sql.join(
						excludeIds.map((id) => sql`${id}`),
						sql`, `
					)})`
				)
				.orderBy(sql`RANDOM()`)
				.limit(8 - recommendations.length);

			recommendations = [...recommendations, ...additionalRecs];
		}

		return NextResponse.json({
			products: recommendations.map((p) => ({
				id: p.id,
				name: p.name,
				brand: p.brand,
				slug: p.slug,
				price: p.price,
				imageUrl: p.imageUrl,
			})),
		});
	} catch (error) {
		console.error("Cart recommendations error:", error);
		return NextResponse.json({ products: [] }, { status: 500 });
	}
}
