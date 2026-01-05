import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import AddToCartButton from "@/components/AddToCartButton";
import { carts, cartItems } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Image from "next/image";
import RemoveButton from "@/components/RemoveButton";
import Link from "next/link";

export default async function CartPage() {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get("cart_session")?.value;

	// 1. Fetch Cart Data
	let cart = null;
	if (sessionToken) {
		cart = await db.query.carts.findFirst({
			where: eq(carts.sessionToken, sessionToken),
			with: {
				items: {
					with: { product: true }, // Join with Products table
				},
			},
		});
	}

	// 2. Calculate Totals
	const items = cart?.items || [];
	const subtotal = items.reduce((acc, item) => {
		return acc + Number(item.product.price) * item.quantity;
	}, 0);

	// 3. Render
	return (
		<main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>

				{items.length === 0 ? (
					<div className="text-center py-12 bg-white rounded-lg shadow">
						<p className="text-gray-500 text-lg mb-4">Your cart is empty.</p>
						<Link
							href="/"
							className="text-blue-600 hover:underline"
						>
							Continue Shopping
						</Link>
					</div>
				) : (
					<div className="bg-white shadow overflow-hidden sm:rounded-lg">
						<ul className="divide-y divide-gray-200">
							{items.map((item) => (
								<li
									key={item.id}
									className="flex py-6 px-4 sm:px-6"
								>
									{/* Image Placeholder */}
									<div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400">
										Img
									</div>

									<div className="ml-4 flex flex-1 flex-col">
										<div>
											<div className="flex justify-between text-base font-medium text-gray-900">
												<h3>{item.product.name}</h3>
												<p className="ml-4">${item.product.price}</p>
											</div>
											<p className="mt-1 text-sm text-gray-500">{item.product.brand}</p>
										</div>
										<div className="flex flex-1 items-end justify-between text-sm">
											<p className="text-gray-500">Qty {item.quantity}</p>
											<RemoveButton itemId={item.id} />
										</div>
									</div>
								</li>
							))}
						</ul>

						{/* Summary Section */}
						<div className="border-t border-gray-200 px-4 py-6 sm:px-6 bg-gray-50">
							<div className="flex justify-between text-base font-medium text-gray-900">
								<p>Subtotal</p>
								<p>${subtotal.toFixed(2)}</p>
							</div>
							<p className="mt-0.5 text-sm text-gray-500">Shipping calculated at checkout.</p>
							<div className="mt-6">
								<button className="w-full flex items-center justify-center rounded-md border border-transparent bg-black px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-gray-800">
									Checkout
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
