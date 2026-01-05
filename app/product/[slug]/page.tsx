import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import Navbar from "@/components/Navbar";
import AddToCartButton from "@/components/AddToCartButton";
import ProductActions from "@/components/ProductActions";
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

	return (
		<div className="min-h-screen bg-white">
			<Navbar />

			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				{/* --- PRODUCT DETAILS SECTION --- */}
				<div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-start">
					{/* Image Gallery */}
					<div className="relative aspect-square w-full rounded-xl bg-gray-100 overflow-hidden shadow-sm">
						{product.imageUrl ? (
							<Image
								src={product.imageUrl}
								alt={product.name}
								fill
								className="object-cover"
								priority
							/>
						) : (
							<div className="flex h-full items-center justify-center text-gray-400">No Image</div>
						)}
					</div>

					{/* Product Info */}
					<div className="mt-10 px-2 sm:mt-16 sm:px-0 lg:mt-0">
						<h2 className="text-sm font-bold tracking-wide text-gray-500 uppercase">{product.brand}</h2>
						<h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>

						<div className="mt-4 flex items-end gap-4">
							<p className="text-3xl font-medium text-gray-900">${product.price}</p>
							<span className={`mb-1 text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
								{product.stock > 0 ? "In Stock" : "Out of Stock"}
							</span>
						</div>

						<p className="mt-6 text-base text-gray-600">{product.description}</p>

						{/* Olfactory Notes */}
						{notes && (
							<div className="mt-8 border-t border-b border-gray-100 py-6">
								<h3 className="text-sm font-medium text-gray-900 mb-4">Olfactory Notes</h3>
								<div className="grid grid-cols-3 gap-4 text-center">
									<div className="space-y-2">
										<div className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Top</div>
										<div className="flex flex-col gap-1">
											{notes.top?.map((note, i) => (
												<span
													key={i}
													className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded-md"
												>
													{note}
												</span>
											))}
										</div>
									</div>
									<div className="space-y-2">
										<div className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Heart</div>
										<div className="flex flex-col gap-1">
											{notes.middle?.map((note, i) => (
												<span
													key={i}
													className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded-md"
												>
													{note}
												</span>
											))}
										</div>
									</div>
									<div className="space-y-2">
										<div className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Base</div>
										<div className="flex flex-col gap-1">
											{notes.base?.map((note, i) => (
												<span
													key={i}
													className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded-md"
												>
													{note}
												</span>
											))}
										</div>
									</div>
								</div>
							</div>
						)}

						<div className="mt-6">
							<ProductActions productId={product.id} />
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
        <Footer/>
      </footer>
		</div>
	);
}
