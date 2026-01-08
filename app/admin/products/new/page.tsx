import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import ProductFormClient from "../ProductFormClient";

export default async function AddProductPage() {
	const { authorized } = await validateAdminAccess("products", "edit");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/products/new");
	}

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
				<p className="text-gray-500 mt-1">Create a new perfume product</p>
			</div>
			<ProductFormClient mode="create" />
		</div>
	);
}
