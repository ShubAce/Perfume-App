import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Footer from "@/components/Footer";
import { ChevronRight } from "lucide-react";
import ShopFilters from "@/components/ShopFilters";

// Revalidate shop pages every 5 minutes
export const revalidate = 300;

// Pre-generate pages for main categories
export async function generateStaticParams() {
	return [{ category: "all" }, { category: "men" }, { category: "women" }, { category: "unisex" }, { category: "new" }];
}

// This function tells Next.js what the params are
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
	const { category } = await params; // unwrap the promised params

	// Validate category param - "all" shows everything, others filter by gender
	const allowed = ["men", "women", "unisex", "all", "new"];
	if (!category || !allowed.includes(category)) {
		return notFound();
	}

	// Fetch products matching the category (guard against DB errors)
	let categoryProducts = [] as any[];
	try {
		if (category === "all") {
			// Fetch all products
			categoryProducts = await db.query.products.findMany();
		} else if (category === "new") {
			// Fetch newest products (most recent by id or createdAt)
			categoryProducts = await db.query.products.findMany({
				orderBy: (products, { desc }) => [desc(products.id)],
				limit: 20,
			});
		} else {
			// Filter by gender
			categoryProducts = await db.query.products.findMany({
				where: eq(products.gender, category),
			});
		}
	} catch (err) {
		console.error("Failed to fetch category products:", err);
		// fallback to empty list so the page still renders
		categoryProducts = [];
	}

	// Generate page title and description
	const pageContent = {
		all: { title: "All Fragrances", description: "Explore our complete collection of premium perfumes" },
		new: { title: "New Arrivals", description: "Be the first to discover our latest fragrances" },
		men: { title: "Men's Fragrances", description: "Bold and sophisticated scents for the modern man" },
		women: { title: "Women's Fragrances", description: "Elegant and captivating perfumes for her" },
		unisex: { title: "Unisex Fragrances", description: "Universal scents that transcend boundaries" },
	};

	const { title: pageTitle, description: pageDescription } = pageContent[category as keyof typeof pageContent];

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Breadcrumb */}
				<nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
					<Link
						href="/"
						className="hover:text-purple-600 transition-colors"
					>
						Home
					</Link>
					<ChevronRight className="h-4 w-4" />
					<span className="text-gray-900 font-medium">{pageTitle}</span>
				</nav>

				{/* Page Header */}
				<div className="mb-8">
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
					<p className="text-gray-600">{pageDescription}</p>
				</div>

				{/* Filters and Product Grid */}
				<ShopFilters products={categoryProducts} />
			</main>

			<Footer />
		</div>
	);
}
