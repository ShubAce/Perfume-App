import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { orders } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";

export const metadata = {
	title: "Order Details | Essence & Allure",
	description: "View your order details",
};

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/login?callbackUrl=/profile");
	}

	const { id } = await params;
	const orderId = parseInt(id);

	if (isNaN(orderId)) {
		notFound();
	}

	const userId = parseInt(session.user.id);

	// Fetch the order with items and products
	const order = await db.query.orders.findFirst({
		where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
		with: {
			items: {
				with: {
					product: true,
				},
			},
		},
	});

	if (!order) {
		notFound();
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "delivered":
				return <CheckCircle className="h-5 w-5 text-green-600" />;
			case "shipped":
				return <Truck className="h-5 w-5 text-blue-600" />;
			case "processing":
				return <Package className="h-5 w-5 text-yellow-600" />;
			default:
				return <Clock className="h-5 w-5 text-gray-600" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "delivered":
				return "bg-green-100 text-green-700";
			case "shipped":
				return "bg-blue-100 text-blue-700";
			case "processing":
				return "bg-yellow-100 text-yellow-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				{/* Back Button */}
				<Link
					href="/profile"
					className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Profile
				</Link>

				{/* Order Header */}
				<div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
							<p className="text-gray-500 mt-1">
								Placed on{" "}
								{order.createdAt
									? new Date(order.createdAt).toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
									  })
									: "Unknown date"}
							</p>
						</div>
						<div className="flex items-center gap-3">
							{getStatusIcon(order.status || "pending")}
							<span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status || "pending")}`}>
								{(order.status || "pending").charAt(0).toUpperCase() + (order.status || "pending").slice(1)}
							</span>
						</div>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					{/* Order Items */}
					<div className="lg:col-span-2">
						<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
							<div className="px-6 py-4 border-b border-gray-100">
								<h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
							</div>
							<div className="divide-y divide-gray-100">
								{order.items?.map((item: any) => (
									<Link
										key={item.id}
										href={`/product/${item.product?.slug}`}
										className="flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors"
									>
										<div className="h-20 w-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
											{item.product?.imageUrl ? (
												<Image
													src={item.product.imageUrl}
													alt={item.product.name}
													width={80}
													height={80}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-purple-600 font-medium">{item.product?.brand}</p>
											<p className="font-semibold text-gray-900 truncate">{item.product?.name}</p>
											<p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
										</div>
										<div className="text-right">
											<p className="font-bold text-gray-900">₹{item.priceAtPurchase}</p>
											{item.quantity > 1 && (
												<p className="text-sm text-gray-500">
													₹{(parseFloat(item.priceAtPurchase) / item.quantity).toFixed(2)} each
												</p>
											)}
										</div>
									</Link>
								))}
							</div>
						</div>
					</div>

					{/* Order Summary */}
					<div className="space-y-6">
						{/* Payment Summary */}
						<div className="bg-white rounded-2xl shadow-sm p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
							<div className="space-y-3">
								<div className="flex justify-between text-gray-600">
									<span>Subtotal</span>
									<span>₹{(parseFloat(order.totalAmount) - 10).toFixed(2)}</span>
								</div>
								<div className="flex justify-between text-gray-600">
									<span>Shipping</span>
									<span>₹10.00</span>
								</div>
								<div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
									<span>Total</span>
									<span className="text-purple-600">₹{order.totalAmount}</span>
								</div>
							</div>
						</div>

						{/* Actions */}
						<div className="bg-white rounded-2xl shadow-sm p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
							<div className="space-y-3">
								<button className="w-full py-2 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
									Track Order
								</button>
								<button className="w-full py-2 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
									Contact Support
								</button>
								<Link
									href="/shop/all"
									className="block w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm text-center font-medium"
								>
									Continue Shopping
								</Link>
							</div>
						</div>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
