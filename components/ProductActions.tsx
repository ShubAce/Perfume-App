"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/actions/actions";
import { useRouter } from "next/navigation";

export default function ProductActions({ productId }: { productId: number }) {
	const [qty, setQty] = useState(1);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const dec = () => setQty((q) => Math.max(1, q - 1));
	const inc = () => setQty((q) => q + 1);

	const handleAdd = () => {
		startTransition(async () => {
			await addToCart(productId, qty);
		});
	};

	const handleBuyNow = () => {
		startTransition(async () => {
			await addToCart(productId, qty);
			router.push("/checkout");
		});
	};

	return (
		<div className="mt-6">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-3">
					<button
						onClick={dec}
						className="h-10 w-10 rounded-full border border-gray-200 bg-white text-lg text-gray-700 flex items-center justify-center"
						aria-label="Decrease quantity"
					>
						−
					</button>
					<div className="text-sm font-bold text-gray-800">{qty}</div>
					<button
						onClick={inc}
						className="h-10 w-10 rounded-full border border-gray-200 bg-white text-lg text-gray-700 flex items-center justify-center"
						aria-label="Increase quantity"
					>
						+
					</button>
				</div>

				<button
					onClick={handleAdd}
					disabled={isPending}
					className="flex-1 rounded-md border-2 border-black bg-white py-3 px-6 text-sm font-semibold text-black hover:bg-gray-50 disabled:opacity-60"
				>
					{isPending ? "Adding..." : "Add to Cart"}
				</button>
			</div>

			<button
				onClick={handleBuyNow}
				disabled={isPending}
				className="mt-4 w-full rounded-md bg-yellow-200 py-4 text-center text-sm font-semibold uppercase tracking-wide text-black hover:bg-yellow-300 disabled:opacity-60"
			>
				{isPending ? "Please wait..." : "Buy It Now"}
			</button>
		</div>
	);
}
