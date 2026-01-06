"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface ViewedProduct {
	productId: number;
	slug: string;
	name: string;
	brand: string;
	scentFamily: string[];
	timestamp: number;
}

interface PersonalizationData {
	viewedProducts: ViewedProduct[];
	searchHistory: string[];
	preferredScentFamilies: Record<string, number>;
	preferredBrands: Record<string, number>;
	preferredOccasions: Record<string, number>;
	preferredMoods: Record<string, number>;
}

interface PersonalizationContextType {
	data: PersonalizationData;
	trackProductView: (product: ViewedProduct) => void;
	trackSearch: (query: string) => void;
	trackPreference: (type: "scent" | "brand" | "occasion" | "mood", value: string) => void;
	getTopPreferences: (type: "scent" | "brand" | "occasion" | "mood", limit?: number) => string[];
	getRecentSearches: (limit?: number) => string[];
	getRecentlyViewed: (limit?: number) => ViewedProduct[];
	clearHistory: () => void;
	syncToServer: (userId: string) => Promise<void>;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

const STORAGE_KEY = "perfume_personalization";

const DEFAULT_DATA: PersonalizationData = {
	viewedProducts: [],
	searchHistory: [],
	preferredScentFamilies: {},
	preferredBrands: {},
	preferredOccasions: {},
	preferredMoods: {},
};

export function PersonalizationProvider({ children }: { children: ReactNode }) {
	const [data, setData] = useState<PersonalizationData>(DEFAULT_DATA);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				setData(JSON.parse(stored));
			}
		} catch (error) {
			console.error("Failed to load personalization data:", error);
		}
		setIsLoaded(true);
	}, []);

	// Save to localStorage on changes
	useEffect(() => {
		if (isLoaded) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}
	}, [data, isLoaded]);

	const trackProductView = useCallback((product: ViewedProduct) => {
		setData((prev) => {
			// Remove duplicate if exists
			const filtered = prev.viewedProducts.filter((p) => p.productId !== product.productId);
			// Add to front, keep last 50
			const updated = [{ ...product, timestamp: Date.now() }, ...filtered].slice(0, 50);

			// Update scent family preferences
			const scentFamilies = { ...prev.preferredScentFamilies };
			product.scentFamily.forEach((scent) => {
				scentFamilies[scent] = (scentFamilies[scent] || 0) + 1;
			});

			// Update brand preferences
			const brands = { ...prev.preferredBrands };
			brands[product.brand] = (brands[product.brand] || 0) + 1;

			return {
				...prev,
				viewedProducts: updated,
				preferredScentFamilies: scentFamilies,
				preferredBrands: brands,
			};
		});
	}, []);

	const trackSearch = useCallback((query: string) => {
		if (!query.trim()) return;
		setData((prev) => {
			const filtered = prev.searchHistory.filter((q) => q.toLowerCase() !== query.toLowerCase());
			const updated = [query, ...filtered].slice(0, 20);
			return { ...prev, searchHistory: updated };
		});
	}, []);

	const trackPreference = useCallback((type: "scent" | "brand" | "occasion" | "mood", value: string) => {
		setData((prev) => {
			const key =
				type === "scent"
					? "preferredScentFamilies"
					: type === "brand"
					? "preferredBrands"
					: type === "occasion"
					? "preferredOccasions"
					: "preferredMoods";

			return {
				...prev,
				[key]: {
					...prev[key],
					[value]: (prev[key][value] || 0) + 1,
				},
			};
		});
	}, []);

	const getTopPreferences = useCallback(
		(type: "scent" | "brand" | "occasion" | "mood", limit = 5) => {
			const key =
				type === "scent"
					? "preferredScentFamilies"
					: type === "brand"
					? "preferredBrands"
					: type === "occasion"
					? "preferredOccasions"
					: "preferredMoods";

			return Object.entries(data[key])
				.sort(([, a], [, b]) => b - a)
				.slice(0, limit)
				.map(([name]) => name);
		},
		[data]
	);

	const getRecentSearches = useCallback(
		(limit = 5) => {
			return data.searchHistory.slice(0, limit);
		},
		[data.searchHistory]
	);

	const getRecentlyViewed = useCallback(
		(limit = 10) => {
			return data.viewedProducts.slice(0, limit);
		},
		[data.viewedProducts]
	);

	const clearHistory = useCallback(() => {
		setData(DEFAULT_DATA);
		localStorage.removeItem(STORAGE_KEY);
	}, []);

	const syncToServer = useCallback(
		async (userId: string) => {
			try {
				await fetch("/api/personalization/sync", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId, data }),
				});
			} catch (error) {
				console.error("Failed to sync personalization data:", error);
			}
		},
		[data]
	);

	return (
		<PersonalizationContext.Provider
			value={{
				data,
				trackProductView,
				trackSearch,
				trackPreference,
				getTopPreferences,
				getRecentSearches,
				getRecentlyViewed,
				clearHistory,
				syncToServer,
			}}
		>
			{children}
		</PersonalizationContext.Provider>
	);
}

export function usePersonalization() {
	const context = useContext(PersonalizationContext);
	if (context === undefined) {
		throw new Error("usePersonalization must be used within a PersonalizationProvider");
	}
	return context;
}
