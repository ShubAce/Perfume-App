"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { User, Package, Heart, MapPin, Settings, LogOut, ChevronRight, Loader2, Edit2, Shield } from "lucide-react";

// Tab types
type TabType = "overview" | "orders" | "wishlist" | "addresses" | "preferences" | "security";

interface TabProps {
	icon: React.ReactNode;
	label: string;
	value: TabType;
	active: boolean;
	onClick: () => void;
}

function Tab({ icon, label, value, active, onClick }: TabProps) {
	return (
		<button
			onClick={onClick}
			className={`flex items-center gap-2 lg:gap-3 w-auto lg:w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
				active ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
			}`}
		>
			{icon}
			<span className="font-medium text-sm lg:text-base">{label}</span>
			<ChevronRight className={`hidden lg:block ml-auto h-4 w-4 transition-transform ${active ? "rotate-90" : ""}`} />
		</button>
	);
}

export default function ProfilePageClient({
	initialOrders,
	initialAddresses,
	initialWishlist,
	initialPreferences,
}: {
	initialOrders: any[];
	initialAddresses: any[];
	initialWishlist: any[];
	initialPreferences: any;
}) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<TabType>("overview");
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	// Local state for data
	const [orders] = useState(initialOrders);
	const [addresses, setAddresses] = useState(initialAddresses);
	const [wishlist, setWishlist] = useState(initialWishlist);
	const [preferences, setPreferences] = useState(initialPreferences);

	// Handle redirect in useEffect - MUST be before any conditional returns
	useEffect(() => {
		if (status !== "loading" && !session?.user) {
			router.push("/login");
		}
	}, [status, session, router]);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await signOut({ redirect: false });
			toast.success("Logged out successfully");
			router.push("/");
		} catch (error) {
			toast.error("Failed to logout");
		} finally {
			setIsLoggingOut(false);
		}
	};

	const removeFromWishlist = async (productId: number) => {
		try {
			const response = await fetch(`/api/wishlist/${productId}`, { method: "DELETE" });
			if (response.ok) {
				setWishlist((prev: any[]) => prev.filter((item) => item.productId !== productId));
				toast.success("Removed from wishlist");
			}
		} catch (error) {
			toast.error("Failed to remove from wishlist");
		}
	};

	const setDefaultAddress = async (addressId: number) => {
		try {
			const response = await fetch(`/api/addresses/${addressId}/default`, { method: "PUT" });
			if (response.ok) {
				setAddresses((prev: any[]) =>
					prev.map((addr) => ({
						...addr,
						isDefault: addr.id === addressId,
					}))
				);
				toast.success("Default address updated");
			}
		} catch (error) {
			toast.error("Failed to update default address");
		}
	};

	const deleteAddress = async (addressId: number) => {
		try {
			const response = await fetch(`/api/addresses/${addressId}`, { method: "DELETE" });
			if (response.ok) {
				setAddresses((prev: any[]) => prev.filter((addr) => addr.id !== addressId));
				toast.success("Address deleted");
			}
		} catch (error) {
			toast.error("Failed to delete address");
		}
	};

	// Loading state
	if (status === "loading") {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
			</div>
		);
	}

	// Not authenticated - show loading while redirect happens
	if (!session?.user) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3 sm:gap-4">
						{session.user.image ? (
							<Image
								src={session.user.image}
								alt={session.user.name || "Profile"}
								width={64}
								height={64}
								className="rounded-full ring-4 ring-purple-100 w-12 h-12 sm:w-16 sm:h-16"
							/>
						) : (
							<div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-purple-100 flex items-center justify-center">
								<User className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
							</div>
						)}
						<div>
							<h1 className="text-xl sm:text-2xl font-bold text-gray-900">{session.user.name}</h1>
							<p className="text-sm sm:text-base text-gray-500 truncate max-w-[200px] sm:max-w-none">{session.user.email}</p>
						</div>
					</div>
					<button
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm sm:text-base"
					>
						{isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
						<span className="hidden sm:inline">Logout</span>
						<span className="sm:hidden">Log out</span>
					</button>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
					{/* Sidebar - Horizontal scrollable on mobile */}
					<div className="lg:col-span-1">
						<div className="bg-white rounded-2xl shadow-sm p-2 sm:p-4 overflow-x-auto lg:overflow-visible">
							<div className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
								<Tab
									icon={<User className="h-5 w-5" />}
									label="Overview"
									value="overview"
									active={activeTab === "overview"}
									onClick={() => setActiveTab("overview")}
								/>
								<Tab
									icon={<Package className="h-5 w-5" />}
									label="Orders"
									value="orders"
									active={activeTab === "orders"}
									onClick={() => setActiveTab("orders")}
								/>
								<Tab
									icon={<Heart className="h-5 w-5" />}
									label="Wishlist"
									value="wishlist"
									active={activeTab === "wishlist"}
									onClick={() => setActiveTab("wishlist")}
								/>
								<Tab
									icon={<MapPin className="h-5 w-5" />}
									label="Addresses"
									value="addresses"
									active={activeTab === "addresses"}
									onClick={() => setActiveTab("addresses")}
								/>
								<Tab
									icon={<Settings className="h-5 w-5" />}
									label="Preferences"
									value="preferences"
									active={activeTab === "preferences"}
									onClick={() => setActiveTab("preferences")}
								/>
								<Tab
									icon={<Shield className="h-5 w-5" />}
									label="Security"
									value="security"
									active={activeTab === "security"}
									onClick={() => setActiveTab("security")}
								/>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3">
						{/* Overview Tab */}
						{activeTab === "overview" && (
							<div className="space-y-6">
								{/* Quick Stats */}
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
									<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm text-center flex sm:block items-center justify-between">
										<p className="text-sm text-gray-500 sm:hidden">Total Orders</p>
										<p className="text-2xl sm:text-3xl font-bold text-purple-600">{orders.length}</p>
										<p className="text-sm text-gray-500 mt-1 hidden sm:block">Total Orders</p>
									</div>
									<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm text-center flex sm:block items-center justify-between">
										<p className="text-sm text-gray-500 sm:hidden">Wishlist Items</p>
										<p className="text-2xl sm:text-3xl font-bold text-pink-600">{wishlist.length}</p>
										<p className="text-sm text-gray-500 mt-1 hidden sm:block">Wishlist Items</p>
									</div>
									<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm text-center flex sm:block items-center justify-between">
										<p className="text-sm text-gray-500 sm:hidden">Saved Addresses</p>
										<p className="text-2xl sm:text-3xl font-bold text-amber-600">{addresses.length}</p>
										<p className="text-sm text-gray-500 mt-1 hidden sm:block">Saved Addresses</p>
									</div>
								</div>

								{/* Recent Orders */}
								<div className="bg-white rounded-2xl shadow-sm p-6">
									<div className="flex items-center justify-between mb-4">
										<h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
										<button
											onClick={() => setActiveTab("orders")}
											className="text-sm text-purple-600 hover:underline"
										>
											View all
										</button>
									</div>
									{orders.length === 0 ? (
										<p className="text-gray-500 text-center py-8">No orders yet</p>
									) : (
										<div className="space-y-3">
											{orders.slice(0, 3).map((order: any) => (
												<div
													key={order.id}
													className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
												>
													<div>
														<p className="font-medium text-gray-900">Order #{order.id}</p>
														<p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
													</div>
													<div className="text-right">
														<p className="font-bold">₹{order.totalAmount}</p>
														<span
															className={`text-xs px-2 py-1 rounded-full ${
																order.status === "delivered"
																	? "bg-green-100 text-green-700"
																	: order.status === "shipped"
																	? "bg-blue-100 text-blue-700"
																	: "bg-yellow-100 text-yellow-700"
															}`}
														>
															{order.status}
														</span>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Wishlist Preview */}
								<div className="bg-white rounded-2xl shadow-sm p-6">
									<div className="flex items-center justify-between mb-4">
										<h2 className="text-lg font-semibold text-gray-900">Wishlist</h2>
										<button
											onClick={() => setActiveTab("wishlist")}
											className="text-sm text-purple-600 hover:underline"
										>
											View all
										</button>
									</div>
									{wishlist.length === 0 ? (
										<p className="text-gray-500 text-center py-8">Your wishlist is empty</p>
									) : (
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
											{wishlist.slice(0, 4).map((item: any) => (
												<Link
													key={item.id}
													href={`/product/${item.product.slug}`}
													className="group rounded-lg bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
												>
													<div className="aspect-square rounded-lg bg-gray-200 overflow-hidden mb-2">
														{item.product.imageUrl && (
															<Image
																src={item.product.imageUrl}
																alt={item.product.name}
																width={150}
																height={150}
																className="w-full h-full object-cover"
															/>
														)}
													</div>
													<p className="text-xs text-purple-600">{item.product.brand}</p>
													<p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
												</Link>
											))}
										</div>
									)}
								</div>
							</div>
						)}

						{/* Orders Tab */}
						{activeTab === "orders" && (
							<div className="bg-white rounded-2xl shadow-sm p-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
								{orders.length === 0 ? (
									<div className="text-center py-12">
										<Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
										<p className="text-gray-500">No orders yet</p>
										<Link
											href="/shop/all"
											className="mt-4 inline-block text-purple-600 hover:underline"
										>
											Start shopping
										</Link>
									</div>
								) : (
									<div className="space-y-6">
										{orders.map((order: any) => (
											<div
												key={order.id}
												className="border border-gray-200 rounded-xl overflow-hidden"
											>
												<div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
													<div>
														<p className="font-medium">Order #{order.id}</p>
														<p className="text-sm text-gray-500">
															{new Date(order.createdAt).toLocaleDateString("en-US", {
																year: "numeric",
																month: "long",
																day: "numeric",
															})}
														</p>
													</div>
													<div className="text-right">
														<p className="font-bold text-lg">₹{order.totalAmount}</p>
														<span
															className={`text-xs px-3 py-1 rounded-full ${
																order.status === "delivered"
																	? "bg-green-100 text-green-700"
																	: order.status === "shipped"
																	? "bg-blue-100 text-blue-700"
																	: "bg-yellow-100 text-yellow-700"
															}`}
														>
															{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
														</span>
													</div>
												</div>
												<div className="p-6 space-y-4">
													{order.items?.map((item: any) => (
														<Link
															key={item.id}
															href={`/product/${item.product?.slug}`}
															className="flex items-center gap-4 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
														>
															<div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
																{item.product?.imageUrl && (
																	<Image
																		src={item.product.imageUrl}
																		alt={item.product.name}
																		width={64}
																		height={64}
																		className="w-full h-full object-cover"
																	/>
																)}
															</div>
															<div className="flex-1">
																<p className="font-medium">{item.product?.name}</p>
																<p className="text-sm text-gray-500">
																	{item.product?.brand} · Qty: {item.quantity}
																</p>
															</div>
															<p className="font-medium">₹{item.priceAtPurchase}</p>
														</Link>
													))}
												</div>
												<div className="border-t border-gray-100 px-6 py-4 flex gap-4">
													<Link
														href={`/orders/${order.id}`}
														className="text-sm text-purple-600 hover:underline"
													>
														View Details
													</Link>
													<button className="text-sm text-gray-600 hover:text-gray-900">Re-order</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* Wishlist Tab */}
						{activeTab === "wishlist" && (
							<div className="bg-white rounded-2xl shadow-sm p-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-6">My Wishlist</h2>
								{wishlist.length === 0 ? (
									<div className="text-center py-12">
										<Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
										<p className="text-gray-500">Your wishlist is empty</p>
										<Link
											href="/shop/all"
											className="mt-4 inline-block text-purple-600 hover:underline"
										>
											Discover fragrances
										</Link>
									</div>
								) : (
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
										{wishlist.map((item: any) => (
											<div
												key={item.id}
												className="group relative"
											>
												<Link href={`/product/${item.product.slug}`}>
													<div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-3">
														{item.product.imageUrl && (
															<Image
																src={item.product.imageUrl}
																alt={item.product.name}
																width={200}
																height={200}
																className="w-full h-full object-cover group-hover:scale-105 transition-transform"
															/>
														)}
													</div>
													<p className="text-xs text-purple-600 font-medium">{item.product.brand}</p>
													<p className="font-medium line-clamp-1">{item.product.name}</p>
													<p className="font-bold mt-1">₹{item.product.price}</p>
												</Link>
												<button
													onClick={() => removeFromWishlist(item.productId)}
													className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
												>
													<Heart className="h-4 w-4 text-red-500 fill-red-500" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* Addresses Tab */}
						{activeTab === "addresses" && (
							<div className="bg-white rounded-2xl shadow-sm p-6">
								<div className="flex items-center justify-between mb-6">
									<h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
									<Link
										href="/profile/addresses/new"
										className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
									>
										Add Address
									</Link>
								</div>
								{addresses.length === 0 ? (
									<div className="text-center py-12">
										<MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
										<p className="text-gray-500">No addresses saved</p>
									</div>
								) : (
									<div className="grid gap-4">
										{addresses.map((address: any) => (
											<div
												key={address.id}
												className={`relative p-6 rounded-xl border-2 ${
													address.isDefault ? "border-purple-500 bg-purple-50" : "border-gray-200"
												}`}
											>
												{address.isDefault && (
													<span className="absolute top-4 right-4 text-xs px-2 py-1 bg-purple-600 text-white rounded-full">
														Default
													</span>
												)}
												<p className="font-semibold text-gray-900">{address.label}</p>
												<p className="text-gray-700 mt-1">{address.fullName}</p>
												<p className="text-gray-600 text-sm mt-1">
													{address.addressLine1}
													{address.addressLine2 && `, ${address.addressLine2}`}
												</p>
												<p className="text-gray-600 text-sm">
													{address.city}, {address.state} {address.postalCode}
												</p>
												{address.phone && <p className="text-gray-500 text-sm mt-1">{address.phone}</p>}
												<div className="flex gap-4 mt-4">
													<Link
														href={`/profile/addresses/${address.id}/edit`}
														className="text-sm text-purple-600 hover:underline"
													>
														Edit
													</Link>
													{!address.isDefault && (
														<button
															onClick={() => setDefaultAddress(address.id)}
															className="text-sm text-gray-600 hover:text-gray-900"
														>
															Set as Default
														</button>
													)}
													<button
														onClick={() => deleteAddress(address.id)}
														className="text-sm text-red-600 hover:underline"
													>
														Delete
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* Preferences Tab */}
						{activeTab === "preferences" && (
							<div className="bg-white rounded-2xl shadow-sm p-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-6">Scent Preferences</h2>
								<p className="text-gray-500 mb-6">Help us recommend the perfect fragrances for you by setting your preferences.</p>

								<div className="space-y-8">
									{/* Scent Families */}
									<div>
										<h3 className="font-medium text-gray-900 mb-3">Favorite Scent Families</h3>
										<div className="flex flex-wrap gap-2">
											{["Citrus", "Floral", "Woody", "Oriental", "Fresh", "Spicy", "Gourmand"].map((family) => (
												<button
													key={family}
													className={`px-4 py-2 rounded-full text-sm transition-colors ${
														preferences?.preferredScentFamilies?.includes(family.toLowerCase())
															? "bg-purple-600 text-white"
															: "bg-gray-100 text-gray-700 hover:bg-gray-200"
													}`}
												>
													{family}
												</button>
											))}
										</div>
									</div>

									{/* Occasions */}
									<div>
										<h3 className="font-medium text-gray-900 mb-3">Preferred Occasions</h3>
										<div className="flex flex-wrap gap-2">
											{["Daily Wear", "Office", "Evening", "Date Night", "Special Events", "Summer", "Winter"].map(
												(occasion) => (
													<button
														key={occasion}
														className={`px-4 py-2 rounded-full text-sm transition-colors ${
															preferences?.preferredOccasions?.includes(occasion.toLowerCase().replace(" ", "-"))
																? "bg-pink-600 text-white"
																: "bg-gray-100 text-gray-700 hover:bg-gray-200"
														}`}
													>
														{occasion}
													</button>
												)
											)}
										</div>
									</div>

									{/* Moods */}
									<div>
										<h3 className="font-medium text-gray-900 mb-3">Preferred Moods</h3>
										<div className="flex flex-wrap gap-2">
											{["Fresh", "Romantic", "Mysterious", "Bold", "Elegant", "Playful"].map((mood) => (
												<button
													key={mood}
													className={`px-4 py-2 rounded-full text-sm transition-colors ${
														preferences?.preferredMoods?.includes(mood.toLowerCase())
															? "bg-amber-600 text-white"
															: "bg-gray-100 text-gray-700 hover:bg-gray-200"
													}`}
												>
													{mood}
												</button>
											))}
										</div>
									</div>

									<Link
										href="/quiz"
										className="inline-block mt-4 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
									>
										Take the Scent Quiz
									</Link>
								</div>
							</div>
						)}

						{/* Security Tab */}
						{activeTab === "security" && (
							<div className="space-y-6">
								<div className="bg-white rounded-2xl shadow-sm p-6">
									<h2 className="text-xl font-semibold text-gray-900 mb-6">Account Security</h2>

									{/* Change Password */}
									<div className="mb-8">
										<h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
										<form className="space-y-4 max-w-md">
											<div>
												<label className="block text-sm text-gray-600 mb-1">Current Password</label>
												<input
													type="password"
													className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												/>
											</div>
											<div>
												<label className="block text-sm text-gray-600 mb-1">New Password</label>
												<input
													type="password"
													className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												/>
											</div>
											<div>
												<label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
												<input
													type="password"
													className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												/>
											</div>
											<button
												type="submit"
												className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
											>
												Update Password
											</button>
										</form>
									</div>

									{/* Danger Zone */}
									<div className="border-t border-gray-200 pt-8">
										<h3 className="font-medium text-red-600 mb-4">Danger Zone</h3>
										<div className="space-y-4">
											<button
												onClick={handleLogout}
												className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
											>
												<LogOut className="h-4 w-4" />
												Logout from all devices
											</button>
											<button className="flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
												Delete Account
											</button>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
