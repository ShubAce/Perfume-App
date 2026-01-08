import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import Navbar from "@/components/Navbar";
import AddToCartButton from "@/components/AddToCartButton";
import ProductActions from "@/components/ProductActions";
import WishlistButton from "@/components/WishlistButton";
import { notFound } from "next/navigation";
import Image from "next/image";
import { eq, and, ne, desc } from "drizzle-orm";

import Link from "next/link";
import RelatedCarousel from "@/components/RelatedCarousel";
import Footer from "@/components/Footer";

interface ScentNotes {
	top: string[];
	middle: string[];
	base: string[];
}

// Helper to determine longevity and projection based on concentration
function getFragranceMetrics(concentration: string | null) {
	const metrics = {
		Parfum: { longevity: 5, projection: 5, longevityText: "12+ hours", projectionText: "Strong" },
		"Eau de Parfum": { longevity: 4, projection: 4, longevityText: "8-12 hours", projectionText: "Moderate-Strong" },
		"Eau de Toilette": { longevity: 3, projection: 3, longevityText: "4-6 hours", projectionText: "Moderate" },
		"Eau de Cologne": { longevity: 2, projection: 2, longevityText: "2-4 hours", projectionText: "Light" },
		"Eau Fraiche": { longevity: 1, projection: 1, longevityText: "1-2 hours", projectionText: "Very Light" },
	};
	return metrics[concentration as keyof typeof metrics] || { longevity: 3, projection: 3, longevityText: "4-6 hours", projectionText: "Moderate" };
}

// Helper to get occasion tags based on scent profile
function getOccasionTags(notes: ScentNotes | null, concentration: string | null) {
	const tags: string[] = [];

	if (!notes) return ["Everyday", "Versatile"];

	const allNotes = [...(notes.top || []), ...(notes.middle || []), ...(notes.base || [])].map((n) => n.toLowerCase());

	// Check for freshness
	if (allNotes.some((n) => ["citrus", "bergamot", "lemon", "grapefruit", "lime", "aquatic", "marine"].includes(n))) {
		tags.push("Summer", "Daytime");
	}

	// Check for warmth
	if (allNotes.some((n) => ["vanilla", "amber", "oud", "musk", "sandalwood", "tonka"].includes(n))) {
		tags.push("Evening", "Winter");
	}

	// Check for florals
	if (allNotes.some((n) => ["rose", "jasmine", "ylang", "tuberose", "peony", "lily"].includes(n))) {
		tags.push("Romantic", "Date Night");
	}

	// Check for woods
	if (allNotes.some((n) => ["cedar", "vetiver", "patchouli", "oakmoss", "birch"].includes(n))) {
		tags.push("Office", "Professional");
	}

	// Check for intensity
	if (concentration === "Parfum" || concentration === "Eau de Parfum") {
		tags.push("Special Occasion");
	} else {
		tags.push("Casual");
	}

	// Return unique tags, max 4
	return [...new Set(tags)].slice(0, 4);
}

// Helper to get season recommendations
function getSeasonRecommendation(notes: ScentNotes | null) {
	if (!notes) return { seasons: ["All Year"], icon: "🌍" };

	const allNotes = [...(notes.top || []), ...(notes.middle || []), ...(notes.base || [])].map((n) => n.toLowerCase());

	const freshNotes = ["citrus", "bergamot", "lemon", "grapefruit", "aquatic", "green", "mint"];
	const warmNotes = ["vanilla", "amber", "oud", "musk", "tonka", "cinnamon", "spice"];

	const freshCount = allNotes.filter((n) => freshNotes.some((fn) => n.includes(fn))).length;
	const warmCount = allNotes.filter((n) => warmNotes.some((wn) => n.includes(wn))).length;

	if (freshCount > warmCount) {
		return { seasons: ["Spring", "Summer"], icon: "☀️" };
	} else if (warmCount > freshCount) {
		return { seasons: ["Fall", "Winter"], icon: "❄️" };
	}
	return { seasons: ["All Year"], icon: "🌍" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug?: string }> }) {
	// Unwrap promised params (Next.js dynamic routes provide params as a Promise)
	const { slug } = await params;
	if (!slug || typeof slug !== "string" || !slug.trim()) {
		return notFound();
	}

	// 1. Fetch Current Product
	let product = null;
	try {
		product = await db.query.products.findFirst({
			where: eq(products.slug, slug),
		});
	} catch (err) {
		console.error("Failed to fetch product:", err);
		return notFound();
	}

	if (!product) {
		return notFound();
	}

	// 2. Fetch Related Products (Same Gender, Excluding Current)
	const relatedProducts = await db.query.products.findMany({
		where: and(
			eq(products.gender, product.gender), // Match category
			ne(products.id, product.id) // Exclude current product
		),
		limit: 4, // Show 4 recommendations
		orderBy: desc(products.isTrending), // Prioritize trending ones
	});

	const notes = product.scentNotes as unknown as ScentNotes;
	const metrics = getFragranceMetrics(product.concentration);
	const occasionTags = getOccasionTags(notes, product.concentration);
	const seasonInfo = getSeasonRecommendation(notes);

	return (
		<div className="min-h-screen bg-linear-to-br from-purple-50/30 via-white to-pink-50/30">
			<Navbar />

			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				{/* Breadcrumb */}
				<nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
					<Link
						href="/"
						className="hover:text-purple-600 transition-colors"
					>
						Home
					</Link>
					<span>/</span>
					<Link
						href={`/shop/${product.gender}`}
						className="hover:text-purple-600 transition-colors capitalize"
					>
						{product.gender}
					</Link>
					<span>/</span>
					<span className="text-gray-900">{product.name}</span>
				</nav>

				{/* --- PRODUCT DETAILS SECTION --- */}
				<div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:items-start">
					{/* Image Gallery */}
					<div className="relative aspect-square w-full rounded-3xl bg-linear-to-br from-purple-100 to-pink-100 overflow-hidden shadow-xl">
						{product.imageUrl ? (
							<Image
								src={product.imageUrl}
								alt={product.name}
								fill
								className="object-cover hover:scale-105 transition-transform duration-500"
								priority
							/>
						) : (
							<div className="flex h-full items-center justify-center text-gray-400">No Image</div>
						)}
						{product.isTrending && (
							<div className="absolute top-4 left-4 bg-linear-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
								✨ Trending
							</div>
						)}
						{/* Wishlist Button */}
						<div className="absolute top-4 right-4">
							<WishlistButton
								productId={product.id}
								variant="icon"
							/>
						</div>
					</div>

					{/* Product Info */}
					<div className="mt-10 px-2 sm:mt-16 sm:px-0 lg:mt-0">
						{/* Brand & Name */}
						<Link
							href={`/shop/brand/${product.brand.toLowerCase().replace(/\s+/g, "-")}`}
							className="inline-block"
						>
							<h2 className="text-sm font-bold tracking-wide text-purple-600 uppercase hover:text-purple-700 transition-colors">
								{product.brand}
							</h2>
						</Link>
						<h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>

						{/* Concentration Badge */}
						{product.concentration && (
							<span className="inline-block mt-3 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
								{product.concentration}
							</span>
						)}

						{/* Price & Stock */}
						<div className="mt-6 flex items-end gap-4">
							<p className="text-4xl font-bold text-gray-900">₹{product.price}</p>
							{product.size && <span className="mb-1 text-sm text-gray-500">/ {product.size}</span>}
							<span
								className={`mb-1 ml-auto text-sm font-semibold px-3 py-1 rounded-full ${
									product.stock > 0 ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
								}`}
							>
								{product.stock > 0 ? `✓ In Stock (${product.stock})` : "✗ Out of Stock"}
							</span>
						</div>

						<p className="mt-6 text-base text-gray-600 leading-relaxed">{product.description}</p>

						{/* Occasion Tags */}
						<div className="mt-6 flex flex-wrap gap-2">
							{occasionTags.map((tag, i) => (
								<span
									key={i}
									className="text-xs font-medium px-3 py-1.5 rounded-full bg-linear-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
								>
									{tag}
								</span>
							))}
						</div>

						{/* Season Recommendation */}
						<div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
							<span>{seasonInfo.icon}</span>
							<span>
								Best for: <strong className="text-gray-900">{seasonInfo.seasons.join(" & ")}</strong>
							</span>
						</div>

						{/* Longevity & Projection Indicators */}
						<div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
							<h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<span className="text-lg">⏱️</span> Performance Metrics
							</h3>
							<div className="space-y-4">
								{/* Longevity */}
								<div>
									<div className="flex justify-between text-sm mb-1.5">
										<span className="text-gray-600">Longevity</span>
										<span className="font-medium text-gray-900">{metrics.longevityText}</span>
									</div>
									<div className="h-2 bg-gray-100 rounded-full overflow-hidden">
										<div
											className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
											style={{ width: `${metrics.longevity * 20}%` }}
										/>
									</div>
								</div>
								{/* Projection */}
								<div>
									<div className="flex justify-between text-sm mb-1.5">
										<span className="text-gray-600">Projection (Sillage)</span>
										<span className="font-medium text-gray-900">{metrics.projectionText}</span>
									</div>
									<div className="h-2 bg-gray-100 rounded-full overflow-hidden">
										<div
											className="h-full bg-linear-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
											style={{ width: `${metrics.projection * 20}%` }}
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Enhanced Olfactory Notes - Scent Pyramid */}
						{notes && (
							<div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
								<h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
									<span className="text-lg">🌸</span> Scent Pyramid
								</h3>
								<div className="space-y-6">
									{/* Top Notes */}
									<div className="relative">
										<div className="flex items-center gap-3 mb-3">
											<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">☀️</div>
											<div>
												<div className="text-xs uppercase text-amber-600 font-bold tracking-wider">Top Notes</div>
												<div className="text-xs text-gray-500">First impression • 15-30 min</div>
											</div>
										</div>
										<div className="flex flex-wrap gap-2 ml-11">
											{notes.top?.map((note, i) => (
												<span
													key={i}
													className="text-sm font-medium text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200"
												>
													{note}
												</span>
											))}
										</div>
									</div>

									{/* Heart Notes */}
									<div className="relative">
										<div className="flex items-center gap-3 mb-3">
											<div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-sm">💗</div>
											<div>
												<div className="text-xs uppercase text-pink-600 font-bold tracking-wider">Heart Notes</div>
												<div className="text-xs text-gray-500">The character • 30 min - 4 hr</div>
											</div>
										</div>
										<div className="flex flex-wrap gap-2 ml-11">
											{notes.middle?.map((note, i) => (
												<span
													key={i}
													className="text-sm font-medium text-pink-800 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-200"
												>
													{note}
												</span>
											))}
										</div>
									</div>

									{/* Base Notes */}
									<div className="relative">
										<div className="flex items-center gap-3 mb-3">
											<div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm">🌙</div>
											<div>
												<div className="text-xs uppercase text-purple-600 font-bold tracking-wider">Base Notes</div>
												<div className="text-xs text-gray-500">The foundation • 4+ hours</div>
											</div>
										</div>
										<div className="flex flex-wrap gap-2 ml-11">
											{notes.base?.map((note, i) => (
												<span
													key={i}
													className="text-sm font-medium text-purple-800 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200"
												>
													{note}
												</span>
											))}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Add to Cart Section */}
						<div className="mt-8">
							<ProductActions
								product={{
									id: product.id,
									name: product.name,
									brand: product.brand,
									price: product.price,
									imageUrl: product.imageUrl,
									size: product.size,
									scentNotes: notes,
								}}
							/>
						</div>

						{/* Trust Badges */}
						<div className="mt-8 grid grid-cols-3 gap-4 text-center">
							<div className="p-3 rounded-xl bg-gray-50">
								<div className="text-xl mb-1">🚚</div>
								<div className="text-xs font-medium text-gray-900">Free Shipping</div>
								<div className="text-xs text-gray-500">Over $50</div>
							</div>
							<div className="p-3 rounded-xl bg-gray-50">
								<div className="text-xl mb-1">✨</div>
								<div className="text-xs font-medium text-gray-900">100% Authentic</div>
								<div className="text-xs text-gray-500">Guaranteed</div>
							</div>
							<div className="p-3 rounded-xl bg-gray-50">
								<div className="text-xl mb-1">↩️</div>
								<div className="text-xs font-medium text-gray-900">Easy Returns</div>
								<div className="text-xs text-gray-500">30 Days</div>
							</div>
						</div>
					</div>
				</div>

				{/* --- "YOU MAY ALSO LIKE" SECTION --- */}
				{relatedProducts.length > 0 && (
					<div className="mt-24 border-t border-gray-200 pt-16">
						<h2 className="text-2xl font-bold flex justify-center items-center tracking-tight text-gray-900 mb-8">You may also like</h2>
						<RelatedCarousel products={relatedProducts} />
					</div>
				)}
			</main>
			<footer>
				<Footer />
			</footer>
		</div>
	);
}
