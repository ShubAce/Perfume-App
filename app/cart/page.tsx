"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Minus, Plus, Trash2, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface RecommendedProduct {
	id: number;
	name: string;
	brand: string;
	slug: string;
	price: string;
	imageUrl: string | null;
}

export default function CartPage() {
	const { items, itemCount, subtotal, removeItem, updateQuantity, isLoading } = useCart();
	const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
	const [loadingRecs, setLoadingRecs] = useState(false);

	// Fetch recommendations based on cart items
	useEffect(() => {
		const fetchRecommendations = async () => {
			if (items.length === 0) {
				setRecommendations([]);
				return;
			}

			setLoadingRecs(true);
			try {
				const productIds = items.map((i) => i.productId).join(",");
				const response = await fetch(`/api/recommendations/cart?productIds=₹{productIds}`);
				if (response.ok) {
					const data = await response.json();
					setRecommendations(data.products || []);
				}
			} catch (error) {
				console.error("Failed to fetch recommendations:", error);
			} finally {
				setLoadingRecs(false);
			}
		};

		fetchRecommendations();
	}, [items]);

	const shipping = subtotal >= 50 ? 0 : 5.99;
	const total = subtotal + shipping;

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Navbar />
				<main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
					<div className="animate-pulse space-y-4">
						<div className="h-8 w-48 rounded bg-gray-200" />
						<div className="h-64 rounded-xl bg-gray-200" />
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

				{items.length === 0 ? (
					<div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-sm">
						<div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
							<ShoppingBag className="h-10 w-10 text-gray-400" />
						</div>
						<h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
						<p className="text-gray-500 mb-8 px-4">Discover our amazing fragrances and add your favorites</p>
						<Link
							href="/shop/all"
							className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 sm:px-8 py-3 font-medium text-white shadow-lg hover:shadow-xl transition-shadow"
						>
							Start Shopping
							<ArrowRight className="h-5 w-5" />
						</Link>
					</div>
				) : (
					<div className="lg:grid lg:grid-cols-12 lg:gap-8">
						{/* Cart Items */}
						<div className="lg:col-span-8">
							<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
								<ul className="divide-y divide-gray-100">
									{items.map((item) => (
										<li
											key={item.productId}
											className="p-4 sm:p-6"
										>
											<div className="flex gap-4 sm:gap-6">
												{/* Image */}
												<Link
													href={`/product/₹{item.slug}`}
													className="relative h-20 w-20 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100"
												>
													{item.imageUrl ? (
														<OptimizedImage
															src={item.imageUrl}
															alt={item.name}
															fill
															className="object-cover"
															timeout={500}
														/>
													) : (
														<div className="flex h-full items-center justify-center text-4xl">🧴</div>
													)}
												</Link>

												{/* Details */}
												<div className="flex flex-1 flex-col min-w-0">
													<div className="flex flex-col sm:flex-row sm:justify-between gap-1">
														<div className="min-w-0">
															<p className="text-xs font-medium uppercase tracking-wide text-purple-600">
																{item.brand}
															</p>
															<Link
																href={`/product/₹{item.slug}`}
																className="block font-semibold text-gray-900 hover:text-purple-600 transition-colors truncate"
															>
																{item.name}
															</Link>
															{item.size && <p className="text-sm text-gray-500">{item.size}</p>}
														</div>
														<p className="font-bold text-gray-900 sm:text-right">
															₹{(item.price * item.quantity).toFixed(2)}
														</p>
													</div>

													{/* Quantity & Remove */}
													<div className="mt-auto flex items-center justify-between pt-3 sm:pt-4">
														<div className="flex items-center gap-2 sm:gap-3">
															<button
																onClick={() => updateQuantity(item.productId, item.quantity - 1)}
																className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
																aria-label="Decrease quantity"
															>
																<Minus className="h-4 w-4" />
															</button>
															<span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
															<button
																onClick={() => updateQuantity(item.productId, item.quantity + 1)}
																className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
																aria-label="Increase quantity"
															>
																<Plus className="h-4 w-4" />
															</button>
														</div>
														<button
															onClick={() => removeItem(item.productId)}
															className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors"
														>
															<Trash2 className="h-4 w-4" />
															<span className="hidden sm:inline">Remove</span>
														</button>
													</div>
												</div>
											</div>
										</li>
									))}
								</ul>
							</div>

							{/* Cart Recommendations */}
							{recommendations.length > 0 && (
								<div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
									<h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
										<Sparkles className="h-5 w-5 text-purple-600" />
										Pairs Well With Your Selection
									</h3>
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
										{recommendations.map((product) => (
											<Link
												key={product.id}
												href={`/product/₹{product.slug}`}
												className="group rounded-xl bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
											>
												<div className="relative aspect-square rounded-lg bg-gray-200 overflow-hidden mb-2">
													{product.imageUrl ? (
														<Image
															src={product.imageUrl}
															alt={product.name}
															fill
															className="object-cover group-hover:scale-105 transition-transform"
														/>
													) : (
														<div className="flex h-full items-center justify-center text-gray-400 text-xs">No Image</div>
													)}
												</div>
												<p className="text-xs text-purple-600 font-medium">{product.brand}</p>
												<p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
												<p className="text-sm font-bold text-gray-900 mt-1">₹{product.price}</p>
											</Link>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Order Summary */}
						<div className="mt-8 lg:mt-0 lg:col-span-4">
							<div className="sticky top-24 bg-white rounded-2xl shadow-sm p-6">
								<h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

								<div className="space-y-3 border-b border-gray-100 pb-4">
									<div className="flex justify-between text-sm">
										<span className="text-gray-600">Subtotal ({itemCount} items)</span>
										<span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-600">Shipping</span>
										{shipping === 0 ? (
											<span className="font-medium text-green-600">FREE</span>
										) : (
											<span className="font-medium text-gray-900">₹{shipping.toFixed(2)}</span>
										)}
									</div>
									{shipping > 0 && (
										<p className="text-xs text-gray-500">Add ₹{(50 - subtotal).toFixed(2)} more for free shipping</p>
									)}
								</div>

								<div className="flex justify-between py-4 border-b border-gray-100">
									<span className="font-semibold text-gray-900">Total</span>
									<span className="font-bold text-xl text-gray-900">₹{total.toFixed(2)}</span>
								</div>

								<Link
									href="/checkout"
									className="mt-6 block w-full rounded-xl bg-linear-to-r from-purple-600 to-pink-600 py-4 text-center font-semibold text-white shadow-lg hover:shadow-xl transition-shadow"
								>
									Proceed to Checkout
								</Link>

								<Link
									href="/shop/all"
									className="mt-3 block w-full rounded-xl border border-gray-200 py-3 text-center font-medium text-gray-700 hover:bg-gray-50 transition-colors"
								>
									Continue Shopping
								</Link>

								{/* Trust Badges */}
								<div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
									<div className="flex items-center gap-1">
										<svg
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											/>
										</svg>
										Secure Checkout
									</div>
									<div className="flex items-center gap-1">
										<svg
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										100% Authentic
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</main>

			<Footer />
		</div>
	);
}
