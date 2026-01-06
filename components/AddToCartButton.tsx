"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Check, Loader2 } from "lucide-react";

interface Product {
	id: number;
	slug: string;
	name: string;
	brand: string;
	price: string | number;
	imageUrl?: string | null;
	size?: string | null;
	scentNotes?: {
		top?: string[];
		middle?: string[];
		base?: string[];
	} | null;
}

interface AddToCartButtonProps {
	product: Product;
	quantity?: number;
	variant?: "default" | "compact" | "icon";
	className?: string;
}

export default function AddToCartButton({ product, quantity = 1, variant = "default", className = "" }: AddToCartButtonProps) {
	const { addItem } = useCart();
	const [isAdding, setIsAdding] = useState(false);
	const [justAdded, setJustAdded] = useState(false);

	const handleAddToCart = async () => {
		if (isAdding || justAdded) return;

		setIsAdding(true);

		try {
			await addItem({
				productId: product.id,
				slug: product.slug,
				name: product.name,
				brand: product.brand,
				price: typeof product.price === "string" ? parseFloat(product.price) : product.price,
				quantity,
				imageUrl: product.imageUrl || undefined,
				size: product.size || undefined,
				scentNotes: product.scentNotes
					? {
							top: product.scentNotes.top || [],
							middle: product.scentNotes.middle || [],
							base: product.scentNotes.base || [],
					  }
					: undefined,
			});

			setJustAdded(true);
			setTimeout(() => setJustAdded(false), 2000);
		} catch (error) {
			console.error("Failed to add to cart:", error);
		} finally {
			setIsAdding(false);
		}
	};

	if (variant === "icon") {
		return (
			<button
				onClick={handleAddToCart}
				disabled={isAdding}
				className={`rounded-full p-2 transition-all ${
					justAdded ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-600"
				} ${className}`}
				title="Add to cart"
			>
				{isAdding ? (
					<Loader2 className="h-5 w-5 animate-spin" />
				) : justAdded ? (
					<Check className="h-5 w-5" />
				) : (
					<ShoppingBag className="h-5 w-5" />
				)}
			</button>
		);
	}

	if (variant === "compact") {
		return (
			<button
				onClick={handleAddToCart}
				disabled={isAdding}
				className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
					justAdded ? "bg-green-500 text-white" : "bg-gray-900 text-white hover:bg-gray-800"
				} ${className}`}
			>
				{isAdding ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Adding...
					</>
				) : justAdded ? (
					<>
						<Check className="h-4 w-4" />
						Added!
					</>
				) : (
					<>
						<ShoppingBag className="h-4 w-4" />
						Add
					</>
				)}
			</button>
		);
	}

	// Default variant
	return (
		<button
			onClick={handleAddToCart}
			disabled={isAdding}
			className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all ${
				justAdded
					? "bg-green-500 text-white"
					: "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25"
			} ${className}`}
		>
			{isAdding ? (
				<>
					<Loader2 className="h-5 w-5 animate-spin" />
					Adding to Cart...
				</>
			) : justAdded ? (
				<>
					<Check className="h-5 w-5" />
					Added to Cart!
				</>
			) : (
				<>
					<ShoppingBag className="h-5 w-5" />
					Add to Cart
				</>
			)}
		</button>
	);
}

// Legacy support for simple productId prop
export function SimpleAddToCartButton({ productId }: { productId: number }) {
	const { addItem } = useCart();
	const [isAdding, setIsAdding] = useState(false);

	const handleAddToCart = async () => {
		setIsAdding(true);
		try {
			// Fetch product details
			const response = await fetch(`/api/products/${productId}`);
			if (response.ok) {
				const product = await response.json();
				await addItem({
					productId: product.id,
					slug: product.slug,
					name: product.name,
					brand: product.brand,
					price: parseFloat(product.price),
					quantity: 1,
					imageUrl: product.imageUrl,
					size: product.size,
				});
			}
		} catch (error) {
			console.error("Failed to add to cart:", error);
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<button
			onClick={handleAddToCart}
			disabled={isAdding}
			className={`w-full mt-4 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
				isAdding ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800 active:scale-95"
			}`}
		>
			{isAdding ? (
				<span className="flex items-center justify-center gap-2">
					<span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
					Adding...
				</span>
			) : (
				"Add to Cart"
			)}
		</button>
	);
}
