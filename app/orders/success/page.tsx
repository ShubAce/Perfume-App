"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function OrderSuccessContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const orderId = searchParams.get("orderId");
	const [countdown, setCountdown] = useState(5);

	useEffect(() => {
		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					router.push("/");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [router]);

	return (
		<div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-amber-50 flex items-center justify-center py-12 px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-3xl shadow-xl p-8 text-center">
					{/* Success Icon */}
					<div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
						<svg
							className="w-10 h-10 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>

					{/* Title */}
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
					<p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been placed successfully.</p>

					{/* Countdown Timer */}
					<div className="mb-6">
						<p className="text-sm text-gray-500">
							Redirecting to home page in <span className="font-bold text-purple-600">{countdown}</span> seconds...
						</p>
					</div>

					{/* Order ID */}
					{orderId && (
						<div className="bg-gray-50 rounded-xl p-4 mb-6">
							<p className="text-sm text-gray-500 mb-1">Order Number</p>
							<p className="text-lg font-mono font-semibold text-purple-600">#{orderId}</p>
						</div>
					)}

					{/* Order Details */}
					<div className="space-y-4 text-left mb-8">
						<div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
							<div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
								<svg
									className="w-5 h-5 text-purple-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<div>
								<p className="text-sm font-medium text-gray-900">Confirmation Email Sent</p>
								<p className="text-xs text-gray-500">Check your inbox for order details</p>
							</div>
						</div>

						<div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
							<div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
								<svg
									className="w-5 h-5 text-amber-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
									/>
								</svg>
							</div>
							<div>
								<p className="text-sm font-medium text-gray-900">Processing Your Order</p>
								<p className="text-xs text-gray-500">Usually ships within 1-2 business days</p>
							</div>
						</div>

						<div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
							<div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
								<svg
									className="w-5 h-5 text-pink-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
									/>
								</svg>
							</div>
							<div>
								<p className="text-sm font-medium text-gray-900">Premium Packaging</p>
								<p className="text-xs text-gray-500">Your fragrance will arrive beautifully wrapped</p>
							</div>
						</div>
					</div>

					{/* Fragrance Care Tips */}
					<div className="bg-linear-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-8">
						<h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
							<span>✨</span> Fragrance Care Tips
						</h3>
						<ul className="text-sm text-gray-600 space-y-1 text-left">
							<li>• Store away from direct sunlight</li>
							<li>• Keep in a cool, dry place</li>
							<li>• Apply to pulse points for best results</li>
						</ul>
					</div>

					{/* Action Buttons */}
					<div className="space-y-3">
						<Link
							href="/"
							className="block w-full py-3 px-4 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
						>
							Go to Home Now
						</Link>
						<Link
							href="/orders"
							className="block w-full py-3 px-4 bg-white border-2 border-purple-200 text-purple-600 font-medium rounded-xl hover:bg-purple-50 transition-all"
						>
							View Order History
						</Link>
						<Link
							href="/shop/all"
							className="block w-full py-3 px-4 bg-white border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
						>
							Continue Shopping
						</Link>
					</div>
				</div>

				{/* Trust Badges */}
				<div className="mt-6 flex justify-center gap-6 text-sm text-gray-500">
					<div className="flex items-center gap-1">
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/>
						</svg>
						Secure Payment
					</div>
					<div className="flex items-center gap-1">
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
							/>
						</svg>
						30-Day Returns
					</div>
				</div>
			</div>
		</div>
	);
}

export default function OrderSuccessPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-amber-50 flex items-center justify-center">
					<div className="animate-pulse text-purple-600">Loading...</div>
				</div>
			}
		>
			<OrderSuccessContent />
		</Suspense>
	);
}
