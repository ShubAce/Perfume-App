"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ShippingAddress {
	fullName: string;
	address: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
	phone: string;
}

export default function CheckoutPage() {
	const { items, subtotal, clearCart } = useCart();
	const router = useRouter();
	const [step, setStep] = useState<"cart" | "shipping" | "confirmation">("cart");
	const [isProcessing, setIsProcessing] = useState(false);
	const [address, setAddress] = useState<ShippingAddress>({
		fullName: "",
		address: "",
		city: "",
		state: "",
		zipCode: "",
		country: "",
		phone: "",
	});

	const shipping = 10;
	const tax = subtotal * 0.08;
	const total = subtotal + shipping + tax;

	const handleAddressSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setStep("confirmation");
	};

	const handlePlaceOrder = async () => {
		setIsProcessing(true);

		try {
			const response = await fetch("/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						priceAtPurchase: item.price,
					})),
					shippingAddress: address,
					totalAmount: total,
				}),
			});

			if (response.ok) {
				const { orderId } = await response.json();
				clearCart();
				toast.success("Order placed successfully!");
				router.push(`/orders/${orderId}/success`);
			} else {
				throw new Error("Failed to place order");
			}
		} catch (error) {
			toast.error("Failed to place order. Please try again.");
		} finally {
			setIsProcessing(false);
		}
	};

	if (items.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Navbar />
				<div className="max-w-4xl mx-auto py-16 px-4">
					<div className="text-center py-16 bg-white rounded-2xl shadow-sm">
						<div className="text-6xl mb-4">🛒</div>
						<h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
						<p className="text-gray-500 mb-6">Add some fragrances to continue shopping</p>
						<Link
							href="/shop/all"
							className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all"
						>
							Browse Products
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				{/* Progress Steps */}
				<div className="mb-8">
					<div className="flex items-center justify-center">
						{["Cart", "Shipping", "Confirmation"].map((label, index) => {
							const stepIndex = ["cart", "shipping", "confirmation"].indexOf(step);
							const isActive = index <= stepIndex;
							const isCurrent = index === stepIndex;

							return (
								<div
									key={label}
									className="flex items-center"
								>
									<div
										className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
											isCurrent
												? "border-black bg-black text-white"
												: isActive
												? "border-green-500 bg-green-500 text-white"
												: "border-gray-300 text-gray-400"
										}`}
									>
										{isActive && index < stepIndex ? (
											<svg
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										) : (
											index + 1
										)}
									</div>
									<span className={`ml-2 text-sm font-medium ${isCurrent ? "text-black" : "text-gray-500"}`}>{label}</span>
									{index < 2 && <div className="w-16 h-0.5 mx-4 bg-gray-300" />}
								</div>
							);
						})}
					</div>
				</div>

				<div className="lg:grid lg:grid-cols-12 lg:gap-8">
					{/* Main Content */}
					<div className="lg:col-span-7">
						{step === "cart" && (
							<div className="bg-white rounded-2xl shadow-sm p-6">
								<h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Cart</h2>
								<ul className="divide-y divide-gray-200">
									{items.map((item) => (
										<li
											key={item.productId}
											className="py-6 flex"
										>
											<div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
												{item.imageUrl ? (
													<Image
														src={item.imageUrl}
														alt={item.name}
														width={96}
														height={96}
														className="h-full w-full object-cover"
													/>
												) : (
													<div className="h-full w-full flex items-center justify-center text-4xl">🧴</div>
												)}
											</div>
											<div className="ml-4 flex flex-1 flex-col">
												<div className="flex justify-between">
													<div>
														<h3 className="font-medium text-gray-900">{item.name}</h3>
														<p className="text-sm text-gray-500">{item.brand}</p>
														{item.size && <p className="text-sm text-gray-400">{item.size}</p>}
													</div>
													<p className="font-medium text-gray-900">${item.price}</p>
												</div>
												<div className="mt-2 flex items-center">
													<span className="text-sm text-gray-500">Qty: {item.quantity}</span>
												</div>
												{item.scentNotes && (
													<div className="mt-2 flex gap-2 flex-wrap">
														{item.scentNotes.top?.slice(0, 2).map((note, i) => (
															<span
																key={i}
																className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full"
															>
																{note}
															</span>
														))}
													</div>
												)}
											</div>
										</li>
									))}
								</ul>
								<button
									onClick={() => setStep("shipping")}
									className="w-full mt-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
								>
									Continue to Shipping
								</button>
							</div>
						)}

						{step === "shipping" && (
							<div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
								<h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>
								<form
									onSubmit={handleAddressSubmit}
									className="space-y-4"
								>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
										<input
											type="text"
											required
											value={address.fullName}
											onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
											placeholder="John Doe"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
										<input
											type="text"
											required
											value={address.address}
											onChange={(e) => setAddress({ ...address, address: e.target.value })}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
											placeholder="123 Main St"
										/>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">City</label>
											<input
												type="text"
												required
												value={address.city}
												onChange={(e) => setAddress({ ...address, city: e.target.value })}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
												placeholder="New York"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">State</label>
											<input
												type="text"
												required
												value={address.state}
												onChange={(e) => setAddress({ ...address, state: e.target.value })}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
												placeholder="NY"
											/>
										</div>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
											<input
												type="text"
												required
												value={address.zipCode}
												onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
												placeholder="10001"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
											<input
												type="text"
												required
												value={address.country}
												onChange={(e) => setAddress({ ...address, country: e.target.value })}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
												placeholder="United States"
											/>
										</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
										<input
											type="tel"
											required
											value={address.phone}
											onChange={(e) => setAddress({ ...address, phone: e.target.value })}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
											placeholder="+1 (555) 123-4567"
										/>
									</div>
									<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
										<button
											type="button"
											onClick={() => setStep("cart")}
											className="w-full sm:flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all order-2 sm:order-1"
										>
											Back
										</button>
										<button
											type="submit"
											className="w-full sm:flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all order-1 sm:order-2"
										>
											Continue to Review
										</button>
									</div>
								</form>
							</div>
						)}

						{step === "confirmation" && (
							<div className="bg-white rounded-2xl shadow-sm p-6">
								<h2 className="text-xl font-bold text-gray-900 mb-6">Confirm Your Order</h2>

								{/* Shipping Address Summary */}
								<div className="mb-6 p-4 bg-gray-50 rounded-lg">
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-medium text-gray-900 mb-2">Shipping to:</h3>
											<p className="text-gray-600">{address.fullName}</p>
											<p className="text-gray-600">{address.address}</p>
											<p className="text-gray-600">
												{address.city}, {address.state} {address.zipCode}
											</p>
											<p className="text-gray-600">{address.country}</p>
											<p className="text-gray-600">{address.phone}</p>
										</div>
										<button
											onClick={() => setStep("shipping")}
											className="text-sm text-black hover:underline"
										>
											Edit
										</button>
									</div>
								</div>

								{/* Order Items */}
								<div className="border-t pt-4">
									<h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
									{items.map((item) => (
										<div
											key={item.productId}
											className="flex justify-between py-2"
										>
											<span className="text-gray-600">
												{item.name} × {item.quantity}
											</span>
											<span className="text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
										</div>
									))}
								</div>

								<div className="flex gap-4 mt-6">
									<button
										onClick={() => setStep("shipping")}
										className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all"
									>
										Back
									</button>
									<button
										onClick={handlePlaceOrder}
										disabled={isProcessing}
										className="flex-1 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
									>
										{isProcessing ? (
											<span className="flex items-center justify-center gap-2">
												<span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
												Processing...
											</span>
										) : (
											`Place Order • ₹${total.toFixed(2)}`
										)}
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Order Summary Sidebar */}
					<div className="lg:col-span-5 mt-8 lg:mt-0">
						<div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
							<h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

							<div className="space-y-3">
								<div className="flex justify-between text-gray-600">
									<span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
									<span>₹{subtotal.toFixed(2)}</span>
								</div>
								<div className="flex justify-between text-gray-600">
									<span>Shipping</span>
									<span>₹{shipping.toFixed(2)}</span>
								</div>
								<div className="flex justify-between text-gray-600">
									<span>Tax</span>
									<span>₹{tax.toFixed(2)}</span>
								</div>
								<div className="border-t pt-3">
									<div className="flex justify-between text-lg font-bold text-gray-900">
										<span>Total</span>
										<span>₹{total.toFixed(2)}</span>
									</div>
								</div>
							</div>

							{/* Estimated Delivery */}
							<div className="mt-6 p-4 bg-amber-50 rounded-lg">
								<div className="flex items-center gap-2 text-amber-800">
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<span className="font-medium">Estimated Delivery</span>
								</div>
								<p className="mt-1 text-sm text-amber-700">3-5 business days</p>
							</div>

							{/* Security Badge */}
							<div className="mt-4 flex items-center gap-2 text-gray-500 text-sm">
								<svg
									className="w-4 h-4"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
								<span>Secure checkout with SSL encryption</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
