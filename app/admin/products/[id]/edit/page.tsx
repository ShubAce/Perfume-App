import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { validateAdminAccess } from "@/lib/admin-auth";
import ProductFormClient from "../../ProductFormClient";
import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
	title: "Edit Product | Admin",
	description: "Edit an existing product",
};

interface Props {
	params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
	const resolvedParams = await params;
	const productId = parseInt(resolvedParams.id);

	if (isNaN(productId)) {
		notFound();
	}

	const { authorized } = await validateAdminAccess("products", "edit");
	if (!authorized) {
		redirect("/admin/login");
	}

	// Fetch the product
	const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);

	if (!product || product.length === 0) {
		notFound();
	}

	const p = product[0];

	// Transform for the form
	const productAny = p as Record<string, unknown>;
	const initialData = {
		id: p.id,
		name: p.name || "",
		slug: p.slug,
		description: p.description || "",
		price: p.price?.toString() || "",
		originalPrice: productAny.originalPrice?.toString() || "",
		stock: p.stock,
		brand: p.brand || "",
		concentration: p.concentration || "",
		size: p.size || "",
		scentNotes: (p.scentNotes as { top: string[]; middle: string[]; base: string[] }) || { top: [], middle: [], base: [] },
		imageUrl: p.imageUrl || "",
		gender: p.gender || "unisex",
		isTrending: p.isTrending || false,
		isActive: productAny.isActive !== false,
		occasion: (productAny.occasion as string[]) || [],
		longevity: (productAny.longevity as string) || "",
		projection: (productAny.projection as string) || "",
	};

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
				<p className="text-gray-500 mt-1">Update product information for {p.name}</p>
			</div>

			<ProductFormClient
				mode="edit"
				initialData={initialData}
			/>
		</div>
	);
}
