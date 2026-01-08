"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, ImageIcon, AlertCircle, ArrowLeft, Loader2, Eye, Tag, Package, Droplets, Users, Clock, Volume2, Sparkles } from "lucide-react";
import Link from "next/link";

interface ScentNotes {
	top: string[];
	middle: string[];
	base: string[];
}

interface ProductData {
	id?: number;
	name: string;
	slug: string;
	description: string;
	price: string;
	originalPrice: string;
	stock: number;
	brand: string;
	concentration: string;
	size: string;
	scentNotes: ScentNotes;
	imageUrl: string;
	gender: string;
	isTrending: boolean;
	isActive: boolean;
	occasion: string[];
	longevity: string;
	projection: string;
}

interface Props {
	mode: "create" | "edit";
	initialData?: ProductData;
}

const concentrationOptions = ["Eau de Parfum", "Eau de Toilette", "Parfum", "Eau de Cologne", "Eau Fraiche"];
const genderOptions = ["men", "women", "unisex"];
const sizeOptions = ["30ml", "50ml", "75ml", "100ml", "125ml", "150ml", "200ml"];
const occasionOptions = ["casual", "formal", "evening", "office", "date", "sport", "summer", "winter"];
const longevityOptions = ["1-2 hours", "2-4 hours", "4-6 hours", "6-8 hours", "8-12 hours", "12+ hours"];
const projectionOptions = ["intimate", "light", "moderate", "heavy", "enormous"];

const defaultFormData: ProductData = {
	name: "",
	slug: "",
	description: "",
	price: "",
	originalPrice: "",
	stock: 0,
	brand: "",
	concentration: "",
	size: "",
	scentNotes: { top: [], middle: [], base: [] },
	imageUrl: "",
	gender: "unisex",
	isTrending: false,
	isActive: true,
	occasion: [],
	longevity: "",
	projection: "",
};

function generateSlug(name: string, brand: string): string {
	return `${brand}-${name}`
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export default function ProductFormClient({ mode, initialData }: Props) {
	const router = useRouter();
	const [formData, setFormData] = useState<ProductData>(initialData || defaultFormData);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [noteInputs, setNoteInputs] = useState({ top: "", middle: "", base: "" });
	const [imageError, setImageError] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;
		const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

		setFormData((prev) => ({
			...prev,
			[name]: newValue,
		}));

		// Auto-generate slug when name or brand changes
		if ((name === "name" || name === "brand") && mode === "create") {
			const newName = name === "name" ? value : formData.name;
			const newBrand = name === "brand" ? value : formData.brand;
			if (newName && newBrand) {
				setFormData((prev) => ({
					...prev,
					[name]: newValue,
					slug: generateSlug(newName, newBrand),
				}));
			}
		}

		// Clear error when field is edited
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const handleNoteAdd = (type: "top" | "middle" | "base") => {
		const note = noteInputs[type].trim();
		if (note && !formData.scentNotes[type].includes(note)) {
			setFormData((prev) => ({
				...prev,
				scentNotes: {
					...prev.scentNotes,
					[type]: [...prev.scentNotes[type], note],
				},
			}));
			setNoteInputs((prev) => ({ ...prev, [type]: "" }));
		}
	};

	const handleNoteRemove = (type: "top" | "middle" | "base", note: string) => {
		setFormData((prev) => ({
			...prev,
			scentNotes: {
				...prev.scentNotes,
				[type]: prev.scentNotes[type].filter((n) => n !== note),
			},
		}));
	};

	const handleOccasionToggle = (occasion: string) => {
		setFormData((prev) => ({
			...prev,
			occasion: prev.occasion.includes(occasion) ? prev.occasion.filter((o) => o !== occasion) : [...prev.occasion, occasion],
		}));
	};

	const validate = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) newErrors.name = "Product name is required";
		if (!formData.brand.trim()) newErrors.brand = "Brand is required";
		if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Price must be greater than 0";
		if (formData.stock < 0) newErrors.stock = "Stock cannot be negative";
		if (!formData.slug.trim()) newErrors.slug = "Slug is required";
		if (formData.originalPrice && parseFloat(formData.originalPrice) <= parseFloat(formData.price)) {
			newErrors.originalPrice = "Original price must be greater than sale price";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validate()) return;

		setIsSubmitting(true);

		try {
			const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${initialData?.id}`;
			const method = mode === "create" ? "POST" : "PATCH";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					price: parseFloat(formData.price),
					originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
				}),
			});

			const data = await res.json();

			if (res.ok) {
				router.push("/admin/products");
				router.refresh();
			} else {
				setErrors({ submit: data.error || "Failed to save product" });
			}
		} catch (error) {
			setErrors({ submit: "An error occurred. Please try again." });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="max-w-5xl"
		>
			{/* Header Actions */}
			<div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 py-4 z-10 -mx-6 px-6">
				<Link
					href="/admin/products"
					className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Products
				</Link>
				<div className="flex items-center gap-3">
					<Link
						href="/admin/products"
						className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
					>
						<X className="w-4 h-4" />
						Cancel
					</Link>
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
					>
						{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
						{mode === "create" ? "Create Product" : "Save Changes"}
					</button>
				</div>
			</div>

			{/* Error Banner */}
			{errors.submit && (
				<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
					<AlertCircle className="w-5 h-5 text-red-500" />
					<p className="text-red-700">{errors.submit}</p>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Form */}
				<div className="lg:col-span-2 space-y-6">
					{/* Basic Information */}
					<div className="bg-white rounded-xl border p-6">
						<h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Package className="w-5 h-5" />
							Basic Information
						</h2>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Product Name <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleChange}
										className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${
											errors.name ? "border-red-500" : "border-gray-300"
										}`}
										placeholder="e.g., Sauvage"
									/>
									{errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Brand <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										name="brand"
										value={formData.brand}
										onChange={handleChange}
										className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${
											errors.brand ? "border-red-500" : "border-gray-300"
										}`}
										placeholder="e.g., Dior"
									/>
									{errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									URL Slug <span className="text-red-500">*</span>
								</label>
								<div className="flex items-center">
									<span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-lg text-gray-500 text-sm">/product/</span>
									<input
										type="text"
										name="slug"
										value={formData.slug}
										onChange={handleChange}
										className={`flex-1 px-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-black focus:border-black ${
											errors.slug ? "border-red-500" : "border-gray-300"
										}`}
										placeholder="brand-product-name"
									/>
								</div>
								{errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
								<textarea
									name="description"
									value={formData.description}
									onChange={handleChange}
									rows={4}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
									placeholder="Describe the fragrance, its character, and appeal..."
								/>
							</div>
						</div>
					</div>

					{/* Pricing & Inventory */}
					<div className="bg-white rounded-xl border p-6">
						<h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Tag className="w-5 h-5" />
							Pricing & Inventory
						</h2>
						<div className="grid grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Price (₹) <span className="text-red-500">*</span>
								</label>
								<input
									type="number"
									name="price"
									value={formData.price}
									onChange={handleChange}
									min="0"
									step="0.01"
									className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${
										errors.price ? "border-red-500" : "border-gray-300"
									}`}
									placeholder="0.00"
								/>
								{errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
								<input
									type="number"
									name="originalPrice"
									value={formData.originalPrice}
									onChange={handleChange}
									min="0"
									step="0.01"
									className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${
										errors.originalPrice ? "border-red-500" : "border-gray-300"
									}`}
									placeholder="For discount display"
								/>
								{errors.originalPrice && <p className="text-red-500 text-xs mt-1">{errors.originalPrice}</p>}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Stock <span className="text-red-500">*</span>
								</label>
								<input
									type="number"
									name="stock"
									value={formData.stock}
									onChange={handleChange}
									min="0"
									className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${
										errors.stock ? "border-red-500" : "border-gray-300"
									}`}
								/>
								{errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
							</div>
						</div>
					</div>

					{/* Fragrance Details */}
					<div className="bg-white rounded-xl border p-6">
						<h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Droplets className="w-5 h-5" />
							Fragrance Details
						</h2>
						<div className="space-y-4">
							<div className="grid grid-cols-3 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Concentration</label>
									<select
										name="concentration"
										value={formData.concentration}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
									>
										<option value="">Select...</option>
										{concentrationOptions.map((opt) => (
											<option
												key={opt}
												value={opt}
											>
												{opt}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
									<select
										name="size"
										value={formData.size}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
									>
										<option value="">Select...</option>
										{sizeOptions.map((opt) => (
											<option
												key={opt}
												value={opt}
											>
												{opt}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
									<select
										name="gender"
										value={formData.gender}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
									>
										{genderOptions.map((opt) => (
											<option
												key={opt}
												value={opt}
											>
												{opt.charAt(0).toUpperCase() + opt.slice(1)}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Scent Notes */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Scent Notes</label>
								<div className="grid grid-cols-3 gap-4">
									{(["top", "middle", "base"] as const).map((type) => (
										<div
											key={type}
											className="space-y-2"
										>
											<span className="text-xs font-medium text-gray-500 uppercase">{type} Notes</span>
											<div className="flex gap-1">
												<input
													type="text"
													value={noteInputs[type]}
													onChange={(e) => setNoteInputs((prev) => ({ ...prev, [type]: e.target.value }))}
													onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleNoteAdd(type))}
													className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
													placeholder="Add note"
												/>
												<button
													type="button"
													onClick={() => handleNoteAdd(type)}
													className="px-2 py-1 bg-gray-100 border rounded hover:bg-gray-200"
												>
													+
												</button>
											</div>
											<div className="flex flex-wrap gap-1">
												{formData.scentNotes[type].map((note) => (
													<span
														key={note}
														className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1"
													>
														{note}
														<button
															type="button"
															onClick={() => handleNoteRemove(type, note)}
															className="hover:text-red-500"
														>
															×
														</button>
													</span>
												))}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Performance */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
										<Clock className="w-4 h-4" />
										Longevity
									</label>
									<select
										name="longevity"
										value={formData.longevity}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
									>
										<option value="">Select...</option>
										{longevityOptions.map((opt) => (
											<option
												key={opt}
												value={opt}
											>
												{opt}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
										<Volume2 className="w-4 h-4" />
										Projection
									</label>
									<select
										name="projection"
										value={formData.projection}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
									>
										<option value="">Select...</option>
										{projectionOptions.map((opt) => (
											<option
												key={opt}
												value={opt}
											>
												{opt.charAt(0).toUpperCase() + opt.slice(1)}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Occasions */}
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
									<Users className="w-4 h-4" />
									Occasions
								</label>
								<div className="flex flex-wrap gap-2">
									{occasionOptions.map((occasion) => (
										<button
											key={occasion}
											type="button"
											onClick={() => handleOccasionToggle(occasion)}
											className={`px-3 py-1 rounded-full text-sm border transition-colors ${
												formData.occasion.includes(occasion)
													? "bg-black text-white border-black"
													: "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
											}`}
										>
											{occasion}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Image Preview */}
					<div className="bg-white rounded-xl border p-6">
						<h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<ImageIcon className="w-5 h-5" />
							Product Image
						</h2>
						<div className="space-y-4">
							<div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
								{formData.imageUrl && !imageError ? (
									<img
										src={formData.imageUrl}
										alt="Product preview"
										className="w-full h-full object-cover"
										onError={() => setImageError(true)}
									/>
								) : (
									<div className="text-center text-gray-400">
										<ImageIcon className="w-16 h-16 mx-auto mb-2" />
										<p className="text-sm">No image</p>
									</div>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
								<input
									type="url"
									name="imageUrl"
									value={formData.imageUrl}
									onChange={(e) => {
										handleChange(e);
										setImageError(false);
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm"
									placeholder="https://example.com/image.jpg"
								/>
								<p className="text-xs text-gray-500 mt-1">Enter a direct link to the product image</p>
							</div>
						</div>
					</div>

					{/* Status & Visibility */}
					<div className="bg-white rounded-xl border p-6">
						<h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Eye className="w-5 h-5" />
							Status & Visibility
						</h2>
						<div className="space-y-4">
							<label className="flex items-center justify-between cursor-pointer">
								<span className="text-sm text-gray-700">Active (Visible to customers)</span>
								<input
									type="checkbox"
									name="isActive"
									checked={formData.isActive}
									onChange={handleChange}
									className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
								/>
							</label>
							<label className="flex items-center justify-between cursor-pointer">
								<span className="text-sm text-gray-700 flex items-center gap-1">
									<Sparkles className="w-4 h-4" />
									Mark as Trending
								</span>
								<input
									type="checkbox"
									name="isTrending"
									checked={formData.isTrending}
									onChange={handleChange}
									className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
								/>
							</label>
						</div>
					</div>

					{/* Quick Preview */}
					<div className="bg-white rounded-xl border p-6">
						<h2 className="font-semibold text-gray-900 mb-4">Quick Preview</h2>
						<div className="border rounded-lg p-4">
							<div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
								{formData.imageUrl && !imageError ? (
									<img
										src={formData.imageUrl}
										alt="Preview"
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<Package className="w-8 h-8 text-gray-400" />
									</div>
								)}
							</div>
							<p className="text-xs text-gray-500">{formData.brand || "Brand"}</p>
							<p className="font-medium text-gray-900">{formData.name || "Product Name"}</p>
							<div className="flex items-center gap-2 mt-1">
								<span className="font-bold text-gray-900">₹{formData.price || "0"}</span>
								{formData.originalPrice && <span className="text-sm text-gray-500 line-through">₹{formData.originalPrice}</span>}
							</div>
							<p className="text-xs text-gray-500 mt-1">
								{formData.concentration} • {formData.size} • {formData.gender}
							</p>
						</div>
					</div>
				</div>
			</div>
		</form>
	);
}
