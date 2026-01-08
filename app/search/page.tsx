"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePersonalization } from "@/context/PersonalizationContext";
import { Filter, SlidersHorizontal, X, ChevronDown, Sparkles } from "lucide-react";

interface Product {
	id: number;
	name: string;
	brand: string;
	slug: string;
	price: string;
	imageUrl: string | null;
	gender: string;
	concentration: string | null;
	description: string | null;
	scentNotes: { top: string[]; middle: string[]; base: string[] } | null;
	isTrending: boolean;
}

interface Filters {
	brands: string[];
	concentrations: string[];
	genders: string[];
}

const PRICE_RANGES = [
	{ label: "Under ₹5000", min: 0, max: 5000 },
	{ label: "₹5000 - ₹10000", min: 5000, max: 10000 },
	{ label: "₹10000 - ₹20000", min: 10000, max: 20000 },
	{ label: "₹20000 - ₹30000", min: 20000, max: 30000 },
	{ label: "₹30000+", min: 30000, max: null },
];

const SORT_OPTIONS = [
	{ value: "relevance", label: "Most Relevant" },
	{ value: "popular", label: "Popularity" },
	{ value: "newest", label: "New Arrivals" },
	{ value: "price-low", label: "Price: Low to High" },
	{ value: "price-high", label: "Price: High to Low" },
];

function SearchResultsContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { trackSearch, getRecentlyViewed, getTopPreferences } = usePersonalization();

	const query = searchParams.get("q") || "";
	const [products, setProducts] = useState<Product[]>([]);
	const [filters, setFilters] = useState<Filters>({ brands: [], concentrations: [], genders: [] });
	const [isLoading, setIsLoading] = useState(true);
	const [totalResults, setTotalResults] = useState(0);
	const [showFilters, setShowFilters] = useState(false);

	// Active filters state
	const [selectedGender, setSelectedGender] = useState<string>(searchParams.get("gender") || "");
	const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get("brand") || "");
	const [selectedPrice, setSelectedPrice] = useState<{ min: number; max: number | null } | null>(null);
	const [selectedConcentration, setSelectedConcentration] = useState<string>(searchParams.get("concentration") || "");
	const [sortBy, setSortBy] = useState<string>(searchParams.get("sortBy") || "relevance");

	// Get personalization data
	const recentlyViewed = getRecentlyViewed(4);
	const topBrands = getTopPreferences("brand", 3);
	const topScents = getTopPreferences("scent", 3);

	// Fetch results
	useEffect(() => {
		const fetchResults = async () => {
			setIsLoading(true);

			const params = new URLSearchParams();
			if (query) params.set("q", query);
			if (selectedGender) params.set("gender", selectedGender);
			if (selectedBrand) params.set("brand", selectedBrand);
			if (selectedConcentration) params.set("concentration", selectedConcentration);
			if (selectedPrice) {
				params.set("minPrice", selectedPrice.min.toString());
				if (selectedPrice.max) params.set("maxPrice", selectedPrice.max.toString());
			}
			params.set("sortBy", sortBy);

			try {
				const response = await fetch(`/api/search?${params.toString()}`);
				if (response.ok) {
					const data = await response.json();
					setProducts(data.products || []);
					setFilters(data.filters || { brands: [], concentrations: [], genders: [] });
					setTotalResults(data.pagination?.total || 0);
				}
			} catch (error) {
				console.error("Failed to fetch search results:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchResults();

		if (query) {
			trackSearch(query);
		}
	}, [query, selectedGender, selectedBrand, selectedPrice, selectedConcentration, sortBy, trackSearch]);

	const clearFilters = () => {
		setSelectedGender("");
		setSelectedBrand("");
		setSelectedPrice(null);
		setSelectedConcentration("");
		setSortBy("relevance");
	};

	const hasActiveFilters = selectedGender || selectedBrand || selectedPrice || selectedConcentration;

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Search Header */}
				<div className="mb-8">
					{query ? (
						<>
							<h1 className="text-3xl font-bold text-gray-900">Search results for "{query}"</h1>
							<p className="mt-2 text-gray-600">
								{totalResults} {totalResults === 1 ? "product" : "products"} found
							</p>
						</>
					) : (
						<h1 className="text-3xl font-bold text-gray-900">Browse All Perfumes</h1>
					)}
				</div>

				{/* AI Recommendations Banner */}
				{query && products.length > 0 && (
					<div className="mb-8 rounded-2xl bg-linear-to-r from-purple-100 via-pink-100 to-amber-100 p-6">
						<div className="flex items-start gap-4">
							<div className="rounded-full bg-white p-2 shadow-sm">
								<Sparkles className="h-5 w-5 text-purple-600" />
							</div>
							<div>
								<h3 className="font-semibold text-gray-900">People who searched for "{query}" also liked</h3>
								<div className="mt-3 flex flex-wrap gap-2">
									{topScents.length > 0 ? (
										topScents.map((scent) => (
											<Link
												key={scent}
												href={`/search?q=${encodeURIComponent(scent)}`}
												className="rounded-full bg-white px-3 py-1 text-sm font-medium text-purple-700 shadow-sm hover:shadow-md transition-shadow"
											>
												{scent} fragrances
											</Link>
										))
									) : (
										<>
											<Link
												href="/search?mood=fresh"
												className="rounded-full bg-white px-3 py-1 text-sm font-medium text-purple-700 shadow-sm hover:shadow-md transition-shadow"
											>
												Similar fresh scents
											</Link>
											<Link
												href="/search?mood=woody"
												className="rounded-full bg-white px-3 py-1 text-sm font-medium text-purple-700 shadow-sm hover:shadow-md transition-shadow"
											>
												Woody alternatives
											</Link>
											<Link
												href={`/search?q=${encodeURIComponent(query)}&sortBy=price-low`}
												className="rounded-full bg-white px-3 py-1 text-sm font-medium text-purple-700 shadow-sm hover:shadow-md transition-shadow"
											>
												More affordable options
											</Link>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				<div className="flex gap-8">
					{/* Filters Sidebar - Desktop */}
					<aside className="hidden w-64 shrink-0 lg:block">
						<div className="sticky top-24 space-y-6">
							{/* Clear Filters */}
							{hasActiveFilters && (
								<button
									onClick={clearFilters}
									className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
								>
									<X className="h-4 w-4" />
									Clear all filters
								</button>
							)}

							{/* Gender Filter */}
							<div className="rounded-xl bg-white p-4 shadow-sm">
								<h3 className="mb-3 font-semibold text-gray-900">Gender</h3>
								<div className="space-y-2">
									{["all", "men", "women", "unisex"].map((gender) => (
										<label
											key={gender}
											className="flex cursor-pointer items-center gap-2"
										>
											<input
												type="radio"
												name="gender"
												checked={selectedGender === (gender === "all" ? "" : gender)}
												onChange={() => setSelectedGender(gender === "all" ? "" : gender)}
												className="h-4 w-4 text-purple-600 focus:ring-purple-500"
											/>
											<span className="text-sm text-gray-700 capitalize">{gender === "all" ? "All" : gender}</span>
										</label>
									))}
								</div>
							</div>

							{/* Price Filter */}
							<div className="rounded-xl bg-white p-4 shadow-sm">
								<h3 className="mb-3 font-semibold text-gray-900">Price Range</h3>
								<div className="space-y-2">
									{PRICE_RANGES.map((range) => (
										<label
											key={range.label}
											className="flex cursor-pointer items-center gap-2"
										>
											<input
												type="radio"
												name="price"
												checked={selectedPrice?.min === range.min && selectedPrice?.max === range.max}
												onChange={() => setSelectedPrice({ min: range.min, max: range.max })}
												className="h-4 w-4 text-purple-600 focus:ring-purple-500"
											/>
											<span className="text-sm text-gray-700">{range.label}</span>
										</label>
									))}
									{selectedPrice && (
										<button
											onClick={() => setSelectedPrice(null)}
											className="mt-2 text-xs text-purple-600 hover:underline"
										>
											Clear price filter
										</button>
									)}
								</div>
							</div>

							{/* Brand Filter */}
							{filters.brands.length > 0 && (
								<div className="rounded-xl bg-white p-4 shadow-sm">
									<h3 className="mb-3 font-semibold text-gray-900">Brand</h3>
									<div className="max-h-48 space-y-2 overflow-y-auto">
										{filters.brands.map((brand) => (
											<label
												key={brand}
												className="flex cursor-pointer items-center gap-2"
											>
												<input
													type="radio"
													name="brand"
													checked={selectedBrand === brand}
													onChange={() => setSelectedBrand(selectedBrand === brand ? "" : brand)}
													className="h-4 w-4 text-purple-600 focus:ring-purple-500"
												/>
												<span className="text-sm text-gray-700">{brand}</span>
											</label>
										))}
									</div>
								</div>
							)}

							{/* Concentration Filter */}
							{filters.concentrations.length > 0 && (
								<div className="rounded-xl bg-white p-4 shadow-sm">
									<h3 className="mb-3 font-semibold text-gray-900">Concentration</h3>
									<div className="space-y-2">
										{filters.concentrations.map((conc) => (
											<label
												key={conc}
												className="flex cursor-pointer items-center gap-2"
											>
												<input
													type="radio"
													name="concentration"
													checked={selectedConcentration === conc}
													onChange={() => setSelectedConcentration(selectedConcentration === conc ? "" : conc!)}
													className="h-4 w-4 text-purple-600 focus:ring-purple-500"
												/>
												<span className="text-sm text-gray-700">{conc}</span>
											</label>
										))}
									</div>
								</div>
							)}
						</div>
					</aside>

					{/* Main Content */}
					<div className="flex-1">
						{/* Sort & Filter Bar */}
						<div className="mb-6 flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
							<button
								onClick={() => setShowFilters(!showFilters)}
								className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 lg:hidden"
							>
								<SlidersHorizontal className="h-4 w-4" />
								Filters
								{hasActiveFilters && <span className="ml-1 rounded-full bg-purple-600 px-2 py-0.5 text-xs text-white">!</span>}
							</button>

							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-500">Sort by:</span>
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
								>
									{SORT_OPTIONS.map((option) => (
										<option
											key={option.value}
											value={option.value}
										>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Mobile Filters Panel */}
						{showFilters && (
							<div className="mb-6 rounded-xl bg-white p-4 shadow-sm lg:hidden">
								{/* Add mobile filter controls here - similar to sidebar */}
								<div className="flex items-center justify-between mb-4">
									<h3 className="font-semibold">Filters</h3>
									<button onClick={() => setShowFilters(false)}>
										<X className="h-5 w-5" />
									</button>
								</div>
								{/* Gender chips */}
								<div className="flex flex-wrap gap-2 mb-4">
									{["all", "men", "women", "unisex"].map((gender) => (
										<button
											key={gender}
											onClick={() => setSelectedGender(gender === "all" ? "" : gender)}
											className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
												selectedGender === (gender === "all" ? "" : gender)
													? "bg-purple-600 text-white"
													: "bg-gray-100 text-gray-700 hover:bg-gray-200"
											}`}
										>
											{gender === "all" ? "All" : gender}
										</button>
									))}
								</div>
								{hasActiveFilters && (
									<button
										onClick={clearFilters}
										className="text-sm font-medium text-purple-600"
									>
										Clear all filters
									</button>
								)}
							</div>
						)}

						{/* Loading State */}
						{isLoading && (
							<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{[...Array(6)].map((_, i) => (
									<div
										key={i}
										className="animate-pulse rounded-xl bg-white p-4 shadow-sm"
									>
										<div className="aspect-square rounded-lg bg-gray-200" />
										<div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
										<div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
										<div className="mt-3 h-5 w-1/4 rounded bg-gray-200" />
									</div>
								))}
							</div>
						)}

						{/* Results Grid */}
						{!isLoading && products.length > 0 && (
							<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{products.map((product) => (
									<Link
										key={product.id}
										href={`/product/${product.slug}`}
										className="group rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-lg"
									>
										<div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
											{product.imageUrl ? (
												<Image
													src={product.imageUrl}
													alt={product.name}
													fill
													className="object-cover transition-transform duration-300 group-hover:scale-105"
												/>
											) : (
												<div className="flex h-full items-center justify-center text-gray-400">No Image</div>
											)}
											{product.isTrending && (
												<span className="absolute left-2 top-2 rounded-full bg-purple-600 px-2 py-1 text-xs font-bold text-white">
													Trending
												</span>
											)}
										</div>
										<div className="mt-4">
											<p className="text-xs font-medium uppercase tracking-wide text-purple-600">{product.brand}</p>
											<h3 className="mt-1 font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
												{product.name}
											</h3>
											<div className="mt-1 flex items-center gap-2">
												{product.concentration && <span className="text-xs text-gray-500">{product.concentration}</span>}
												<span className="text-xs capitalize text-gray-400">• {product.gender}</span>
											</div>
											<p className="mt-3 text-lg font-bold text-gray-900">₹{product.price}</p>
										</div>
									</Link>
								))}
							</div>
						)}

						{/* Empty State */}
						{!isLoading && products.length === 0 && (
							<div className="rounded-xl bg-white p-12 text-center shadow-sm">
								<div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
									<Filter className="h-8 w-8 text-gray-400" />
								</div>
								<h3 className="text-lg font-semibold text-gray-900">No products found</h3>
								<p className="mt-2 text-gray-500">Try adjusting your filters or search for something else</p>
								<Link
									href="/shop/all"
									className="mt-6 inline-block rounded-full bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-700"
								>
									Browse All Products
								</Link>
							</div>
						)}
					</div>
				</div>

				{/* Recently Viewed Section */}
				{recentlyViewed.length > 0 && (
					<section className="mt-16 border-t border-gray-200 pt-12">
						<h2 className="mb-6 text-2xl font-bold text-gray-900">Recently Viewed</h2>
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
							{recentlyViewed.map((item) => (
								<Link
									key={item.productId}
									href={`/product/${item.slug}`}
									className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
								>
									<div className="aspect-square rounded-lg bg-gray-100 mb-3" />
									<p className="text-xs font-medium text-purple-600">{item.brand}</p>
									<p className="font-medium text-gray-900">{item.name}</p>
								</Link>
							))}
						</div>
					</section>
				)}
			</main>

			<Footer />
		</div>
	);
}

export default function SearchPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50 flex items-center justify-center">
					<div className="animate-pulse text-purple-600">Loading...</div>
				</div>
			}
		>
			<SearchResultsContent />
		</Suspense>
	);
}
