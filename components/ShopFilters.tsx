"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";

interface Product {
	id: number;
	name: string;
	brand: string;
	slug: string;
	price: string;
	imageUrl: string | null;
	concentration: string | null;
	isTrending: boolean;
	size: string | null;
	scentNotes: any;
}

interface ShopFiltersProps {
	products: Product[];
}

type SortOption = "featured" | "price-low" | "price-high" | "newest" | "name-asc";

const PRICE_RANGES = [
	{ label: "All Prices", min: 0, max: Infinity },
	{ label: "Under $50", min: 0, max: 50 },
	{ label: "$50 - $100", min: 50, max: 100 },
	{ label: "$100 - $200", min: 100, max: 200 },
	{ label: "$200+", min: 200, max: Infinity },
];

export default function ShopFilters({ products }: ShopFiltersProps) {
	const [sortBy, setSortBy] = useState<SortOption>("featured");
	const [selectedBrand, setSelectedBrand] = useState<string>("");
	const [selectedConcentration, setSelectedConcentration] = useState<string>("");
	const [selectedPriceRange, setSelectedPriceRange] = useState<number>(0);
	const [showFilters, setShowFilters] = useState(false);

	// Extract unique brands and concentrations
	const brands = useMemo(() => {
		const uniqueBrands = [...new Set(products.map((p) => p.brand))].sort();
		return uniqueBrands;
	}, [products]);

	const concentrations = useMemo(() => {
		const uniqueConcentrations = [...new Set(products.map((p) => p.concentration).filter(Boolean))].sort();
		return uniqueConcentrations as string[];
	}, [products]);

	// Filter and sort products
	const filteredProducts = useMemo(() => {
		let result = [...products];

		// Filter by brand
		if (selectedBrand) {
			result = result.filter((p) => p.brand === selectedBrand);
		}

		// Filter by concentration
		if (selectedConcentration) {
			result = result.filter((p) => p.concentration === selectedConcentration);
		}

		// Filter by price range
		if (selectedPriceRange > 0) {
			const range = PRICE_RANGES[selectedPriceRange];
			result = result.filter((p) => {
				const price = parseFloat(p.price);
				return price >= range.min && price < range.max;
			});
		}

		// Sort products
		switch (sortBy) {
			case "price-low":
				result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
				break;
			case "price-high":
				result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
				break;
			case "newest":
				result.sort((a, b) => b.id - a.id);
				break;
			case "name-asc":
				result.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case "featured":
			default:
				// Trending first, then by id
				result.sort((a, b) => {
					if (a.isTrending && !b.isTrending) return -1;
					if (!a.isTrending && b.isTrending) return 1;
					return b.id - a.id;
				});
		}

		return result;
	}, [products, selectedBrand, selectedConcentration, selectedPriceRange, sortBy]);

	const hasActiveFilters = selectedBrand || selectedConcentration || selectedPriceRange > 0;

	const clearFilters = () => {
		setSelectedBrand("");
		setSelectedConcentration("");
		setSelectedPriceRange(0);
	};

	return (
		<>
			{/* Results Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
				<p className="text-sm text-gray-600">
					Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> of{" "}
					<span className="font-semibold text-gray-900">{products.length}</span> products
				</p>
				<div className="flex items-center gap-3">
					<button
						onClick={() => setShowFilters(!showFilters)}
						className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
							hasActiveFilters
								? "bg-purple-50 text-purple-700 border-purple-300"
								: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
						}`}
					>
						<SlidersHorizontal className="h-4 w-4" />
						Filter
						{hasActiveFilters && (
							<span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-600 text-white rounded-full">
								{(selectedBrand ? 1 : 0) + (selectedConcentration ? 1 : 0) + (selectedPriceRange > 0 ? 1 : 0)}
							</span>
						)}
					</button>
					<div className="relative">
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as SortOption)}
							className="appearance-none px-4 py-2 pr-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						>
							<option value="featured">Sort by: Featured</option>
							<option value="price-low">Price: Low to High</option>
							<option value="price-high">Price: High to Low</option>
							<option value="newest">Newest First</option>
							<option value="name-asc">Name: A-Z</option>
						</select>
						<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
					</div>
				</div>
			</div>

			{/* Filter Panel */}
			{showFilters && (
				<div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold text-gray-900">Filters</h3>
						{hasActiveFilters && (
							<button
								onClick={clearFilters}
								className="text-sm text-purple-600 hover:text-purple-700 font-medium"
							>
								Clear all
							</button>
						)}
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{/* Brand Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
							<select
								value={selectedBrand}
								onChange={(e) => setSelectedBrand(e.target.value)}
								className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							>
								<option value="">All Brands</option>
								{brands.map((brand) => (
									<option
										key={brand}
										value={brand}
									>
										{brand}
									</option>
								))}
							</select>
						</div>

						{/* Concentration Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Concentration</label>
							<select
								value={selectedConcentration}
								onChange={(e) => setSelectedConcentration(e.target.value)}
								className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							>
								<option value="">All Concentrations</option>
								{concentrations.map((conc) => (
									<option
										key={conc}
										value={conc}
									>
										{conc}
									</option>
								))}
							</select>
						</div>

						{/* Price Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
							<select
								value={selectedPriceRange}
								onChange={(e) => setSelectedPriceRange(parseInt(e.target.value))}
								className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							>
								{PRICE_RANGES.map((range, idx) => (
									<option
										key={idx}
										value={idx}
									>
										{range.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Active Filter Tags */}
					{hasActiveFilters && (
						<div className="mt-4 flex flex-wrap gap-2">
							{selectedBrand && (
								<span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
									{selectedBrand}
									<button
										onClick={() => setSelectedBrand("")}
										className="hover:text-purple-900"
									>
										<X className="h-3.5 w-3.5" />
									</button>
								</span>
							)}
							{selectedConcentration && (
								<span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
									{selectedConcentration}
									<button
										onClick={() => setSelectedConcentration("")}
										className="hover:text-purple-900"
									>
										<X className="h-3.5 w-3.5" />
									</button>
								</span>
							)}
							{selectedPriceRange > 0 && (
								<span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
									{PRICE_RANGES[selectedPriceRange].label}
									<button
										onClick={() => setSelectedPriceRange(0)}
										className="hover:text-purple-900"
									>
										<X className="h-3.5 w-3.5" />
									</button>
								</span>
							)}
						</div>
					)}
				</div>
			)}

			{/* Product Grid */}
			{filteredProducts.length === 0 ? (
				<div className="text-center py-16 bg-white rounded-2xl shadow-sm">
					<div className="text-5xl mb-4">🔍</div>
					<h2 className="text-xl font-semibold text-gray-900 mb-2">No products found</h2>
					<p className="text-gray-500 mb-6">Try adjusting your filters to find what you're looking for.</p>
					<button
						onClick={clearFilters}
						className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
					>
						Clear Filters
					</button>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
					{filteredProducts.map((product) => (
						<div
							key={product.id}
							className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
						>
							{/* Product Image */}
							<Link
								href={`/product/${product.slug}`}
								className="block relative aspect-square overflow-hidden bg-gray-100"
							>
								{product.imageUrl ? (
									<Image
										src={product.imageUrl}
										alt={product.name}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-500"
										sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
									/>
								) : (
									<div className="absolute inset-0 flex items-center justify-center text-gray-400">
										<span className="text-4xl">🧴</span>
									</div>
								)}
								{product.isTrending && (
									<span className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full">
										Trending
									</span>
								)}
							</Link>

							{/* Product Info */}
							<div className="p-4">
								<p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">{product.brand}</p>
								<Link href={`/product/${product.slug}`}>
									<h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors mb-2 min-h-[2.5rem]">
										{product.name}
									</h3>
								</Link>
								<div className="flex items-center justify-between">
									<p className="text-lg font-bold text-gray-900">₹{product.price}</p>
									{product.concentration && <span className="text-xs text-gray-500">{product.concentration}</span>}
								</div>
								{/* Add to Cart Button */}
								<div className="mt-4">
									<AddToCartButton
										product={{
											id: product.id,
											slug: product.slug,
											name: product.name,
											brand: product.brand,
											price: product.price,
											imageUrl: product.imageUrl,
											size: product.size,
											scentNotes: product.scentNotes,
										}}
										variant="compact"
										className="w-full"
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</>
	);
}
