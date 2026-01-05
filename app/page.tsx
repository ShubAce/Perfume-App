// All imports must be at the top (before any comments or code)
import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Helper for the Category Cards
function CategoryCard({ title, image, link }: { title: string; image: string; link: string }) {
	return (
		<Link
			href={link}
			className="group relative block h-96 overflow-hidden rounded-xl bg-gray-100"
		>
			<Image
				src={image}
				alt={title}
				fill
				className="object-cover transition-transform duration-500 group-hover:scale-105"
			/>
			<div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
			<div className="absolute bottom-6 left-6 text-white">
				<h3 className="text-3xl font-bold">{title}</h3>
				<p className="mt-2 text-sm font-medium underline underline-offset-4">Shop Collection</p>
			</div>
		</Link>
	);
}

export default async function Home() {
	// Fetch Trending Products
	const trendingProducts = await db.query.products.findMany({
		where: eq(products.isTrending, true),
		limit: 6,
	});

	return (
		<>
			<main className="min-h-screen bg-white">
				<Navbar />

				{/* 1. HERO SECTION */}
				<section className="relative h-[80vh] w-full overflow-hidden bg-gray-900">
					<div className="absolute inset-0 opacity-60">
						{/* You can replace this src with a real banner URL later */}
						<Image
							src="https://images.unsplash.com/photo-1557170334-a9632e77c6e4?q=80&w=3000&auto=format&fit=crop"
							alt="Hero Banner"
							fill
							className="object-cover"
							priority
						/>
					</div>
					<div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
						<h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">Find Your Signature Scent</h1>
						<p className="mt-6 max-w-lg text-lg text-gray-200">
							Exclusive collection of long-lasting, premium fragrances for every occasion.
						</p>
						<div className="mt-10 flex gap-4">
							<Link
								href="#shop"
								className="rounded-full bg-white px-8 py-3 text-lg font-bold text-black transition-transform hover:scale-105"
							>
								Shop Now
							</Link>
						</div>
					</div>
				</section>

				{/* 2. CATEGORY SECTION */}
				<section
					id="shop"
					className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
				>
					<h2 className="mb-12 text-center text-3xl font-bold tracking-tight">Shop by Category</h2>
					<div className="grid gap-8 sm:grid-cols-3">
						<CategoryCard
							title="For Him"
							link="/shop/men"
							image="https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80"
						/>
						<CategoryCard
							title="For Her"
							link="/shop/women"
							image="https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80"
						/>
						<CategoryCard
							title="Unisex"
							link="/shop/unisex"
							image="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80"
						/>
					</div>
				</section>

				{/* 3. TRENDING CAROUSEL */}
				<section className="bg-gray-50 py-24">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-3xl font-bold tracking-tight text-gray-800">Trending Now</h2>
							<Link
								href="/shop/all"
								className="text-sm font-semibold text-gray-600 hover:text-black"
							>
								View all &rarr;
							</Link>
						</div>

						{/* Simple CSS Scroll Snap Carousel */}
						<div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
							{trendingProducts.map((product) => (
								<Link
									key={product.id}
									href={`/product/${product.slug}`}
									className="min-w-70 snap-start rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
								>
									<div className="relative aspect-square mb-4 bg-gray-100 rounded-md overflow-hidden">
										{/* Placeholder for product image */}
										<div className="absolute inset-0 flex items-center justify-center text-gray-400">Product Img</div>
									</div>
									<h3 className="font-bold text-gray-900">{product.name}</h3>
									<p className="text-sm text-gray-500">{product.brand}</p>
									<div className="mt-2 font-medium text-black">${product.price}</div>
								</Link>
							))}

							{/* Show this if empty */}
							{trendingProducts.length === 0 && (
								<div className="w-full py-12 text-center text-gray-400">No trending products yet. Mark some in DB!</div>
							)}
						</div>
					</div>
				</section>
			</main>
			<footer>
				<Footer />
			</footer>
		</>
	);
}
