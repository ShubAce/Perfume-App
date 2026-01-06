import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { orders, addresses, wishlistItems, userPreferences as userPreferencesTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import ProfilePageClient from "@/components/ProfilePageClient";

export const metadata = {
	title: "My Profile | Essence & Allure",
	description: "Manage your account, orders, addresses, and preferences",
};

export default async function ProfilePage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/login?callbackUrl=/profile");
	}

	const userId = parseInt(session.user.id);

	// Fetch user data in parallel
	const [userOrders, userAddresses, userWishlist, userPreferences] = await Promise.all([
		// Orders with items and products
		db.query.orders
			.findMany({
				where: eq(orders.userId, userId),
				with: {
					items: {
						with: {
							product: true,
						},
					},
				},
				orderBy: (orders, { desc }) => [desc(orders.createdAt)],
			})
			.catch(() => []),

		// Addresses - will be empty until tables created
		db.query.addresses
			?.findMany({
				where: eq(addresses.userId, userId),
				orderBy: (addresses, { desc }) => [desc(addresses.isDefault)],
			})
			.catch(() => []) ?? [],

		// Wishlist with products - will be empty until tables created
		db.query.wishlistItems
			?.findMany({
				where: eq(wishlistItems.userId, userId),
				with: {
					product: true,
				},
				orderBy: (wishlistItems, { desc }) => [desc(wishlistItems.createdAt)],
			})
			.catch(() => []) ?? [],

		// Preferences - will be null until tables created
		db.query.userPreferences
			?.findFirst({
				where: eq(userPreferencesTable.userId, userId),
			})
			.catch(() => null) ?? null,
	]);

	return (
		<ProfilePageClient
			initialOrders={userOrders || []}
			initialAddresses={userAddresses || []}
			initialWishlist={userWishlist || []}
			initialPreferences={userPreferences || null}
		/>
	);
}
