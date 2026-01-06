"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export interface CartItem {
	id: number;
	productId: number;
	slug: string;
	name: string;
	brand: string;
	price: number;
	quantity: number;
	imageUrl?: string;
	size?: string;
	scentNotes?: {
		top: string[];
		middle: string[];
		base: string[];
	};
}

interface CartContextType {
	items: CartItem[];
	itemCount: number;
	subtotal: number;
	isLoading: boolean;
	addItem: (item: Omit<CartItem, "id">) => Promise<void>;
	removeItem: (productId: number) => Promise<void>;
	updateQuantity: (productId: number, quantity: number) => Promise<void>;
	clearCart: () => void;
	refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "perfume_cart";

export function CartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<CartItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { data: session, status } = useSession();
	const isInitialized = useRef(false);
	const previousAuthState = useRef<string | null>(null);

	// Calculate derived values
	const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
	const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

	// Load cart from localStorage
	const loadFromLocalStorage = useCallback((): CartItem[] => {
		try {
			const stored = localStorage.getItem(CART_STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (error) {
			console.error("Failed to load cart from localStorage:", error);
		}
		return [];
	}, []);

	// Save cart to localStorage
	const saveToLocalStorage = useCallback((cartItems: CartItem[]) => {
		try {
			localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
		} catch (error) {
			console.error("Failed to save cart to localStorage:", error);
		}
	}, []);

	// Fetch cart from server for logged-in users
	const fetchServerCart = useCallback(async (): Promise<CartItem[]> => {
		try {
			const response = await fetch("/api/cart/sync", { cache: "no-store" });
			if (response.ok) {
				const data = await response.json();
				return data.items || [];
			}
		} catch (error) {
			console.error("Failed to fetch server cart:", error);
		}
		return [];
	}, []);

	// Sync cart to server
	const syncToServer = useCallback(async (cartItems: CartItem[]) => {
		try {
			await fetch("/api/cart/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items: cartItems }),
			});
		} catch (error) {
			console.error("Failed to sync to server:", error);
		}
	}, []);

	// Merge guest cart with server cart on login
	const mergeCartsOnLogin = useCallback(async () => {
		const guestItems = loadFromLocalStorage();

		if (guestItems.length === 0) {
			// No guest items, just fetch server cart
			const serverItems = await fetchServerCart();
			setItems(serverItems);
			return;
		}

		try {
			const response = await fetch("/api/cart/merge", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ guestItems }),
			});

			if (response.ok) {
				const { mergedItems } = await response.json();
				setItems(mergedItems);
				localStorage.removeItem(CART_STORAGE_KEY);
				toast.success("Your cart has been synced!");
			} else {
				// Fallback: just use server cart
				const serverItems = await fetchServerCart();
				setItems(serverItems);
			}
		} catch (error) {
			console.error("Failed to merge carts:", error);
			// Fallback: just use local cart
			setItems(guestItems);
		}
	}, [loadFromLocalStorage, fetchServerCart]);

	// Initialize cart on mount and handle auth state changes
	useEffect(() => {
		const initCart = async () => {
			if (status === "loading") return;

			const currentAuthState = status === "authenticated" ? "authenticated" : "unauthenticated";

			// First-time initialization
			if (!isInitialized.current) {
				isInitialized.current = true;
				previousAuthState.current = currentAuthState;

				if (status === "authenticated") {
					await mergeCartsOnLogin();
				} else {
					const localItems = loadFromLocalStorage();
					setItems(localItems);
				}
				setIsLoading(false);
				return;
			}

			// Handle auth state change (login/logout)
			if (previousAuthState.current !== currentAuthState) {
				previousAuthState.current = currentAuthState;

				if (currentAuthState === "authenticated") {
					// User just logged in - merge carts
					await mergeCartsOnLogin();
				} else {
					// User just logged out - load from localStorage
					const localItems = loadFromLocalStorage();
					setItems(localItems);
				}
			}
		};

		initCart();
	}, [status, loadFromLocalStorage, mergeCartsOnLogin]);

	// Save to localStorage whenever items change (for guests)
	useEffect(() => {
		if (isLoading) return;
		if (status !== "authenticated") {
			saveToLocalStorage(items);
		}
	}, [items, isLoading, status, saveToLocalStorage]);

	// Refresh cart from server/localStorage
	const refreshCart = useCallback(async () => {
		if (status === "authenticated") {
			const serverItems = await fetchServerCart();
			setItems(serverItems);
		} else {
			const localItems = loadFromLocalStorage();
			setItems(localItems);
		}
	}, [status, fetchServerCart, loadFromLocalStorage]);

	// Add item to cart
	const addItem = useCallback(
		async (newItem: Omit<CartItem, "id">) => {
			const existingItem = items.find((item) => item.productId === newItem.productId);

			let updatedItems: CartItem[];

			if (existingItem) {
				// Update quantity if item exists
				updatedItems = items.map((item) =>
					item.productId === newItem.productId ? { ...item, quantity: item.quantity + newItem.quantity } : item
				);
				toast.success(`Updated quantity for ${newItem.name}`);
			} else {
				// Add new item
				const newCartItem: CartItem = { ...newItem, id: Date.now() };
				updatedItems = [...items, newCartItem];
				toast.success(`${newItem.name} added to cart`);
			}

			setItems(updatedItems);

			// Sync to server if logged in
			if (status === "authenticated") {
				await syncToServer(updatedItems);
			}
		},
		[items, status, syncToServer]
	);

	// Remove item from cart
	const removeItem = useCallback(
		async (productId: number) => {
			const item = items.find((i) => i.productId === productId);
			const updatedItems = items.filter((item) => item.productId !== productId);

			if (item) {
				toast.success(`${item.name} removed from cart`);
			}

			setItems(updatedItems);

			// Sync to server if logged in
			if (status === "authenticated") {
				await syncToServer(updatedItems);
			}
		},
		[items, status, syncToServer]
	);

	// Update item quantity
	const updateQuantity = useCallback(
		async (productId: number, quantity: number) => {
			if (quantity < 1) {
				await removeItem(productId);
				return;
			}

			const updatedItems = items.map((item) => (item.productId === productId ? { ...item, quantity } : item));

			setItems(updatedItems);

			// Sync to server if logged in
			if (status === "authenticated") {
				await syncToServer(updatedItems);
			}
		},
		[items, status, syncToServer, removeItem]
	);

	// Clear cart
	const clearCart = useCallback(() => {
		setItems([]);
		localStorage.removeItem(CART_STORAGE_KEY);
		if (status === "authenticated") {
			syncToServer([]);
		}
	}, [status, syncToServer]);

	return (
		<CartContext.Provider
			value={{
				items,
				itemCount,
				subtotal,
				isLoading,
				addItem,
				removeItem,
				updateQuantity,
				clearCart,
				refreshCart,
			}}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
}
