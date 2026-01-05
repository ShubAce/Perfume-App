import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import Footer from "@/components/Footer";

// This function tells Next.js what the params are
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
	const { category } = await params; // unwrap the promised params

	// Validate category param
	const allowed = ["men", "women", "unisex"];
	if (!category || !allowed.includes(category)) {
		return notFound();
	}

	// Fetch products matching the category (guard against DB errors)
	let categoryProducts = [] as any[];
	try {
		categoryProducts = await db.query.products.findMany({
			where: eq(products.gender, category),
		});
	} catch (err) {
		console.error("Failed to fetch category products:", err);
		// fallback to empty list so the page still renders
		categoryProducts = [];
	}

	return (
		<>
			<div className="min-h-screen bg-white">
				<Navbar />

				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<h1 className="text-4xl font-bold capitalize mb-8">{category} Fragrances</h1>

					<div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
						{categoryProducts.map((product) => (
							<div
								key={product.id}
								className="group relative"
							>
								<div className="aspect-square w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none lg:h-80">
									{/* Product Image */}
									<div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-100">Image</div>
								</div>
								<div className="mt-4 flex justify-between">
									<div>
										<h3 className="text-sm text-gray-700">
											<Link href={`/product/${product.slug}`}>
												<span
													aria-hidden="true"
													className="absolute inset-0"
												/>
												{product.name}
											</Link>
										</h3>
										<p className="mt-1 text-sm text-gray-500">{product.brand}</p>
									</div>
									<p className="text-sm font-medium text-gray-900">${product.price}</p>
								</div>

								{/* Add to Cart Button (z-index needs to be higher) */}
								<div className="mt-4 relative z-10">
									<AddToCartButton productId={product.id} />
								</div>
							</div>
						))}
					</div>

					{categoryProducts.length === 0 && <p className="text-gray-500">No products found in this category.</p>}
				</div>
			</div>
			<footer>
				<Footer />
			</footer>
		</>
	);
}
