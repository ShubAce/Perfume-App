"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface ProductActionsProps {
	product?: Product;
	productId?: number; // Legacy support
}

export default function ProductActions({ product, productId }: ProductActionsProps) {
	const [qty, setQty] = useState(1);
	const [isAdding, setIsAdding] = useState(false);
	const [justAdded, setJustAdded] = useState(false);
	const [productData, setProductData] = useState<Product | null>(product || null);
	const { addItem } = useCart();
	const router = useRouter();

	// If only productId is provided (legacy support), fetch product data
	useEffect(() => {
		if (!product && productId) {
			fetch(`/api/products/${productId}`)
				.then((res) => res.json())
				.then((data) => setProductData(data))
				.catch((err) => console.error("Failed to fetch product:", err));
		}
	}, [product, productId]);

	const dec = () => setQty((q) => Math.max(1, q - 1));
	const inc = () => setQty((q) => q + 1);

	const handleAdd = async () => {
		const p = productData || product;
		if (!p || isAdding) return;

		setIsAdding(true);

		try {
			await addItem({
				productId: p.id,
				slug: p.slug,
				name: p.name,
				brand: p.brand,
				price: typeof p.price === "string" ? parseFloat(p.price) : p.price,
				quantity: qty,
				imageUrl: p.imageUrl || undefined,
				size: p.size || undefined,
				scentNotes: p.scentNotes
					? {
							top: p.scentNotes.top || [],
							middle: p.scentNotes.middle || [],
							base: p.scentNotes.base || [],
					  }
					: undefined,
			});

			setJustAdded(true);
			setQty(1);
			setTimeout(() => setJustAdded(false), 2000);
		} catch (error) {
			console.error("Failed to add to cart:", error);
		} finally {
			setIsAdding(false);
		}
	};

	const handleBuyNow = async () => {
		await handleAdd();
		router.push("/cart");
	};

	return (
		<div className="mt-6 space-y-4">
			{/* Quantity Selector & Add to Cart */}
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-3">
					<button
						onClick={dec}
						disabled={isAdding}
						className="h-10 w-10 rounded-full border border-gray-200 bg-white text-lg text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
						aria-label="Decrease quantity"
					>
						−
					</button>
					<span className="w-8 text-center text-sm font-bold text-gray-800">{qty}</span>
					<button
						onClick={inc}
						disabled={isAdding}
						className="h-10 w-10 rounded-full border border-gray-200 bg-white text-lg text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
						aria-label="Increase quantity"
					>
						+
					</button>
				</div>

				<button
					onClick={handleAdd}
					disabled={isAdding || !productData}
					className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-semibold transition-all ${
						justAdded
							? "bg-green-500 text-white"
							: "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25"
					} disabled:opacity-60`}
				>
					{isAdding ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Adding...
						</>
					) : justAdded ? (
						<>
							<Check className="h-4 w-4" />
							Added to Cart!
						</>
					) : (
						<>
							<ShoppingBag className="h-4 w-4" />
							Add to Cart
						</>
					)}
				</button>
			</div>

			{/* Buy Now Button */}
			<button
				onClick={handleBuyNow}
				disabled={isAdding || !productData}
				className="w-full rounded-xl border-2 border-gray-900 bg-white py-4 text-center text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-60"
			>
				{isAdding ? "Please wait..." : "Buy It Now"}
			</button>
		</div>
	);
}
