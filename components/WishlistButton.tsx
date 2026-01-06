"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WishlistButtonProps {
	productId: number;
	initialInWishlist?: boolean;
	variant?: "default" | "icon";
	className?: string;
}

export default function WishlistButton({ productId, initialInWishlist = false, variant = "default", className = "" }: WishlistButtonProps) {
	const { data: session } = useSession();
	const router = useRouter();
	const [inWishlist, setInWishlist] = useState(initialInWishlist);
	const [isLoading, setIsLoading] = useState(false);

	const handleToggle = async () => {
		if (!session) {
			toast.error("Please login to add to wishlist");
			router.push("/login?callbackUrl=" + window.location.pathname);
			return;
		}

		setIsLoading(true);
		try {
			if (inWishlist) {
				// Remove from wishlist
				const response = await fetch(`/api/wishlist/${productId}`, {
					method: "DELETE",
				});
				if (response.ok) {
					setInWishlist(false);
					toast.success("Removed from wishlist");
				} else {
					toast.error("Failed to remove from wishlist");
				}
			} else {
				// Add to wishlist
				const response = await fetch("/api/wishlist", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ productId }),
				});
				if (response.ok) {
					setInWishlist(true);
					toast.success("Added to wishlist!");
				} else if (response.status === 409) {
					setInWishlist(true);
					toast.info("Already in wishlist");
				} else {
					toast.error("Failed to add to wishlist");
				}
			}
		} catch (error) {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	};

	if (variant === "icon") {
		return (
			<button
				onClick={handleToggle}
				disabled={isLoading}
				className={`p-2 rounded-full transition-all ${
					inWishlist ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-white text-gray-400 hover:text-red-500 hover:bg-red-50"
				} shadow-md ${className}`}
				title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
			>
				{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={`h-5 w-5 ${inWishlist ? "fill-current" : ""}`} />}
			</button>
		);
	}

	return (
		<button
			onClick={handleToggle}
			disabled={isLoading}
			className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
				inWishlist
					? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
					: "border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-500"
			} ${className}`}
		>
			{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />}
			<span className="text-sm font-medium">{inWishlist ? "In Wishlist" : "Add to Wishlist"}</span>
		</button>
	);
}
