"use client";

import { useTransition } from "react";
import { removeFromCart } from "@/actions/actions";

export default function RemoveButton({ itemId }: { itemId: number }) {
	// ...existing code...

	const [isPending, startTransition] = useTransition();
	const handleRemove = async () => {
		startTransition(async () => {
			try {
				await removeFromCart(itemId);
			} catch (error) {
				// Optionally, show an error message to the user
				console.error("Failed to remove item from cart:", error);
			}
		});
	};

	return (
		<button
			disabled={isPending}
			onClick={handleRemove}
			className="text-red-500 text-sm hover:text-red-700 hover:underline disabled:text-gray-400"
		>
			{isPending ? "Removing..." : "Remove"}
		</button>
	);
}
