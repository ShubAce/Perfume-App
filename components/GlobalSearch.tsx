"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, TrendingUp, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePersonalization } from "@/context/PersonalizationContext";

interface SearchResult {
	id: number;
	name: string;
	brand: string;
	slug: string;
	price: string;
	imageUrl: string | null;
	gender: string;
	concentration: string | null;
}

interface SearchSuggestion {
	type: "product" | "brand" | "note" | "occasion" | "mood";
	text: string;
	slug?: string;
}

// Popular search terms
const TRENDING_SEARCHES = ["Dior Sauvage", "Chanel No. 5", "Tom Ford", "Fresh scents", "Date night", "Summer fragrances"];

// Quick filter chips
const QUICK_CHIPS = [
	{ label: "Fresh", type: "mood" },
	{ label: "Woody", type: "mood" },
	{ label: "Floral", type: "mood" },
	{ label: "Oriental", type: "mood" },
	{ label: "Office", type: "occasion" },
	{ label: "Date Night", type: "occasion" },
	{ label: "Summer", type: "season" },
	{ label: "Winter", type: "season" },
];

export default function GlobalSearch() {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);

	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const { trackSearch, getRecentSearches } = usePersonalization();

	const recentSearches = getRecentSearches(5);

	// Debounced search
	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			setSuggestions([]);
			return;
		}

		const timer = setTimeout(async () => {
			setIsLoading(true);
			try {
				const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
				if (response.ok) {
					const data = await response.json();
					setResults(data.products || []);
					setSuggestions(data.suggestions || []);
				}
			} catch (error) {
				console.error("Search failed:", error);
			} finally {
				setIsLoading(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [query]);

	// Handle keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const totalItems = results.length + suggestions.length;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (activeIndex >= 0 && activeIndex < results.length) {
					const product = results[activeIndex];
					trackSearch(query);
					router.push(`/product/${product.slug}`);
					setIsOpen(false);
				} else if (query.trim()) {
					trackSearch(query);
					router.push(`/search?q=${encodeURIComponent(query)}`);
					setIsOpen(false);
				}
			} else if (e.key === "Escape") {
				setIsOpen(false);
			}
		},
		[results, suggestions, activeIndex, query, router, trackSearch]
	);

	// Close on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Focus input when opened
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			trackSearch(query);
			router.push(`/search?q=${encodeURIComponent(query)}`);
			setIsOpen(false);
		}
	};

	const handleChipClick = (chip: (typeof QUICK_CHIPS)[0]) => {
		trackSearch(chip.label);
		router.push(`/search?${chip.type}=${encodeURIComponent(chip.label)}`);
		setIsOpen(false);
	};

	return (
		<div
			ref={containerRef}
			className="relative"
		>
			{/* Search Trigger Button */}
			<button
				onClick={() => setIsOpen(true)}
				className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-700"
			>
				<Search className="h-4 w-4" />
				<span className="hidden sm:inline">Search perfumes...</span>
				<kbd className="ml-2 hidden rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-500 sm:inline">⌘K</kbd>
			</button>

			{/* Search Modal */}
			{isOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
						onClick={() => setIsOpen(false)}
					/>

					{/* Search Panel */}
					<div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:inset-x-auto">
						{/* Search Input */}
						<form
							onSubmit={handleSubmit}
							className="relative"
						>
							<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
							<input
								ref={inputRef}
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Search by name, brand, notes, mood..."
								className="w-full border-b border-gray-100 py-4 pl-12 pr-12 text-lg outline-none placeholder:text-gray-400"
							/>
							{query && (
								<button
									type="button"
									onClick={() => setQuery("")}
									className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100"
								>
									<X className="h-4 w-4 text-gray-400" />
								</button>
							)}
						</form>

						<div className="max-h-[60vh] overflow-y-auto">
							{/* Loading State */}
							{isLoading && (
								<div className="flex items-center justify-center py-8">
									<div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
								</div>
							)}

							{/* Results */}
							{!isLoading && query && results.length > 0 && (
								<div className="p-4">
									<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Products</h3>
									<div className="space-y-2">
										{results.map((product, index) => (
											<Link
												key={product.id}
												href={`/product/${product.slug}`}
												onClick={() => {
													trackSearch(query);
													setIsOpen(false);
												}}
												className={`flex items-center gap-4 rounded-xl p-3 transition-colors ${
													activeIndex === index ? "bg-purple-50" : "hover:bg-gray-50"
												}`}
											>
												<div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
													{product.imageUrl ? (
														<Image
															src={product.imageUrl}
															alt={product.name}
															fill
															className="object-cover"
														/>
													) : (
														<div className="flex h-full items-center justify-center text-xs text-gray-400">IMG</div>
													)}
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate font-medium text-gray-900">{product.name}</p>
													<p className="truncate text-sm text-gray-500">
														{product.brand} • {product.concentration || "Perfume"}
													</p>
												</div>
												<p className="shrink-0 font-semibold text-gray-900">${product.price}</p>
											</Link>
										))}
									</div>
									<Link
										href={`/search?q=${encodeURIComponent(query)}`}
										onClick={() => {
											trackSearch(query);
											setIsOpen(false);
										}}
										className="mt-3 block rounded-lg bg-gray-100 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-200"
									>
										View all results for "{query}"
									</Link>
								</div>
							)}

							{/* No Results */}
							{!isLoading && query && results.length === 0 && (
								<div className="p-8 text-center">
									<p className="text-gray-500">No products found for "{query}"</p>
									<p className="mt-2 text-sm text-gray-400">Try different keywords or browse categories</p>
								</div>
							)}

							{/* Default State - No Query */}
							{!query && (
								<div className="p-4">
									{/* Recent Searches */}
									{recentSearches.length > 0 && (
										<div className="mb-6">
											<h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
												<Clock className="h-3.5 w-3.5" />
												Recent Searches
											</h3>
											<div className="flex flex-wrap gap-2">
												{recentSearches.map((search, i) => (
													<button
														key={i}
														onClick={() => {
															setQuery(search);
															router.push(`/search?q=${encodeURIComponent(search)}`);
															setIsOpen(false);
														}}
														className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:border-purple-300 hover:bg-purple-50"
													>
														{search}
													</button>
												))}
											</div>
										</div>
									)}

									{/* Trending */}
									<div className="mb-6">
										<h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
											<TrendingUp className="h-3.5 w-3.5" />
											Trending Searches
										</h3>
										<div className="flex flex-wrap gap-2">
											{TRENDING_SEARCHES.map((search, i) => (
												<button
													key={i}
													onClick={() => {
														setQuery(search);
														trackSearch(search);
														router.push(`/search?q=${encodeURIComponent(search)}`);
														setIsOpen(false);
													}}
													className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:border-purple-300 hover:bg-purple-50"
												>
													{search}
												</button>
											))}
										</div>
									</div>

									{/* Quick Chips */}
									<div>
										<h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
											<Sparkles className="h-3.5 w-3.5" />
											Discover by
										</h3>
										<div className="flex flex-wrap gap-2">
											{QUICK_CHIPS.map((chip, i) => (
												<button
													key={i}
													onClick={() => handleChipClick(chip)}
													className="rounded-full bg-linear-to-r from-purple-100 to-pink-100 px-3 py-1.5 text-sm font-medium text-purple-700 hover:from-purple-200 hover:to-pink-200"
												>
													{chip.label}
												</button>
											))}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
