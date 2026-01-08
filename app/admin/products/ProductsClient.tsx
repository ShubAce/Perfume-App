"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Search,
	ChevronLeft,
	ChevronRight,
	Package,
	AlertTriangle,
	RefreshCw,
	Download,
	Plus,
	Edit2,
	Eye,
	MoreHorizontal,
	Trash2,
	TrendingUp,
	Archive,
	CheckCircle,
	XCircle,
	Filter,
	Power,
	Loader2,
} from "lucide-react";
import Link from "next/link";

interface Product {
	id: number;
	name: string;
	slug: string;
	brand: string | null;
	gender: string | null;
	concentration: string | null;
	price: number;
	stock: number;
	imageUrl: string | null;
	isTrending: boolean | null;
	isActive: boolean;
	createdAt: string | undefined;
	totalSold: number;
	revenue: number;
}

interface Props {
	products: Product[];
	totalCount: number;
	currentPage: number;
	pageSize: number;
	genders: string[];
	currentGender?: string;
	currentSearch?: string;
	currentStockFilter?: string;
	stockStats: {
		total: number;
		lowStock: number;
		outOfStock: number;
	};
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(amount);
}

function getStockStatus(stock: number): { label: string; color: string; bg: string } {
	if (stock === 0) return { label: "Out of Stock", color: "text-red-700", bg: "bg-red-100" };
	if (stock < 10) return { label: "Low Stock", color: "text-yellow-700", bg: "bg-yellow-100" };
	return { label: "In Stock", color: "text-green-700", bg: "bg-green-100" };
}

export default function ProductsClient({
	products,
	totalCount,
	currentPage,
	pageSize,
	genders,
	currentGender,
	currentSearch,
	currentStockFilter,
	stockStats,
}: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [search, setSearch] = useState(currentSearch || "");
	const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
	const [showFilters, setShowFilters] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	const totalPages = Math.ceil(totalCount / pageSize);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setActionMenuOpen(null);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const updateURL = (params: Record<string, string | undefined>) => {
		const url = new URLSearchParams();
		if (params.search || search) url.set("search", params.search || search);
		if (params.gender !== undefined) {
			if (params.gender && params.gender !== "all") url.set("gender", params.gender);
		} else if (currentGender && currentGender !== "all") {
			url.set("gender", currentGender);
		}
		if (params.stock !== undefined) {
			if (params.stock && params.stock !== "all") url.set("stock", params.stock);
		} else if (currentStockFilter && currentStockFilter !== "all") {
			url.set("stock", currentStockFilter);
		}
		url.set("page", params.page || "1");
		startTransition(() => {
			router.push(`/admin/products?${url.toString()}`);
		});
	};

	const handleSearch = () => {
		updateURL({ search, page: "1" });
	};

	const handleGenderFilter = (gender: string) => {
		updateURL({ gender, page: "1" });
	};

	const handleStockFilter = (stock: string) => {
		updateURL({ stock, page: "1" });
	};

	const handlePageChange = (newPage: number) => {
		updateURL({ page: newPage.toString() });
	};

	const handleSelectAll = () => {
		if (selectedProducts.length === products.length) {
			setSelectedProducts([]);
		} else {
			setSelectedProducts(products.map((p) => p.id));
		}
	};

	const handleSelectProduct = (productId: number) => {
		setSelectedProducts((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
	};

	const handleExport = async () => {
		setExporting(true);
		try {
			const params = new URLSearchParams();
			if (currentGender && currentGender !== "all") params.set("gender", currentGender);
			if (currentSearch) params.set("search", currentSearch);
			params.set("includeDisabled", "true");

			const res = await fetch(`/api/admin/export/products?${params.toString()}`);
			if (!res.ok) throw new Error("Export failed");

			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			a.remove();
		} catch (error) {
			console.error("Export error:", error);
			alert("Failed to export products. Please try again.");
		} finally {
			setExporting(false);
		}
	};

	const handleToggleActive = async (product: Product) => {
		setActionLoading(product.id);
		setActionMenuOpen(null);
		try {
			const res = await fetch(`/api/admin/products/${product.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: !product.isActive }),
			});
			if (!res.ok) throw new Error("Failed to update product");
			router.refresh();
		} catch (error) {
			console.error("Toggle error:", error);
			alert("Failed to update product status. Please try again.");
		} finally {
			setActionLoading(null);
		}
	};

	const handleDelete = async (productId: number, hardDelete = false) => {
		setActionLoading(productId);
		setDeleteConfirm(null);
		try {
			const res = await fetch(`/api/admin/products/${productId}?hard=${hardDelete}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete product");
			router.refresh();
		} catch (error) {
			console.error("Delete error:", error);
			alert("Failed to delete product. Please try again.");
		} finally {
			setActionLoading(null);
		}
	};

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Products & Inventory</h1>
					<p className="text-gray-500 mt-1">{totalCount} total products</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => router.refresh()}
						className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
					>
						<RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
						Refresh
					</button>
					<button
						onClick={handleExport}
						disabled={exporting}
						className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
					>
						{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
						Export
					</button>
					<Link
						href="/admin/products/new"
						className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
					>
						<Plus className="w-4 h-4" />
						Add Product
					</Link>
				</div>
			</div>

			{/* Stock Status Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
				<div
					onClick={() => handleStockFilter("all")}
					className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
						!currentStockFilter || currentStockFilter === "all" ? "ring-2 ring-black" : ""
					}`}
				>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
							<Package className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<p className="text-sm text-gray-500">Total Products</p>
							<p className="text-xl font-bold text-gray-900">{stockStats.total}</p>
						</div>
					</div>
				</div>

				<div
					onClick={() => handleStockFilter("low")}
					className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
						currentStockFilter === "low" ? "ring-2 ring-yellow-500" : ""
					}`}
				>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
							<AlertTriangle className="w-5 h-5 text-yellow-600" />
						</div>
						<div>
							<p className="text-sm text-gray-500">Low Stock</p>
							<p className="text-xl font-bold text-yellow-600">{stockStats.lowStock}</p>
						</div>
					</div>
				</div>

				<div
					onClick={() => handleStockFilter("out")}
					className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
						currentStockFilter === "out" ? "ring-2 ring-red-500" : ""
					}`}
				>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
							<XCircle className="w-5 h-5 text-red-600" />
						</div>
						<div>
							<p className="text-sm text-gray-500">Out of Stock</p>
							<p className="text-xl font-bold text-red-600">{stockStats.outOfStock}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-4 mb-6">
				<div className="flex-1 flex gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder="Search products by name or brand..."
							className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
						/>
					</div>
					<button
						onClick={handleSearch}
						className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
					>
						Search
					</button>
				</div>

				<button
					onClick={() => setShowFilters(!showFilters)}
					className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
						showFilters ? "bg-gray-100" : "hover:bg-gray-50"
					}`}
				>
					<Filter className="w-4 h-4" />
					Filters
				</button>
			</div>

			{/* Filter Panel */}
			{showFilters && (
				<div className="bg-gray-50 rounded-xl p-4 mb-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
							<select
								value={currentGender || "all"}
								onChange={(e) => handleGenderFilter(e.target.value)}
								className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-black"
							>
								<option value="all">All Genders</option>
								{genders.map((g) => (
									<option
										key={g}
										value={g}
									>
										{g.charAt(0).toUpperCase() + g.slice(1)}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
							<select
								value={currentStockFilter || "all"}
								onChange={(e) => handleStockFilter(e.target.value)}
								className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-black"
							>
								<option value="all">All Stock Levels</option>
								<option value="low">Low Stock (&lt; 10)</option>
								<option value="out">Out of Stock (0)</option>
							</select>
						</div>
					</div>
				</div>
			)}

			{/* Bulk Actions */}
			{selectedProducts.length > 0 && (
				<div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-4">
					<span className="text-sm text-blue-800 font-medium">{selectedProducts.length} selected</span>
					<button className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">Update Stock</button>
					<button className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">
						<Archive className="w-4 h-4 inline mr-1" /> Archive
					</button>
					<button className="px-3 py-1.5 text-sm text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50">
						<Trash2 className="w-4 h-4 inline mr-1" /> Delete
					</button>
				</div>
			)}

			{/* Products Table */}
			<div className="bg-white rounded-xl border shadow-sm overflow-hidden">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							<th className="px-4 py-3">
								<input
									type="checkbox"
									checked={selectedProducts.length === products.length && products.length > 0}
									onChange={handleSelectAll}
									className="rounded border-gray-300"
								/>
							</th>
							<th className="px-4 py-3">Product</th>
							<th className="px-4 py-3">Gender</th>
							<th className="px-4 py-3">Price</th>
							<th className="px-4 py-3">Stock</th>
							<th className="px-4 py-3">Sold</th>
							<th className="px-4 py-3">Revenue</th>
							<th className="px-4 py-3">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{products.length === 0 ? (
							<tr>
								<td
									colSpan={8}
									className="px-4 py-12 text-center"
								>
									<div className="flex flex-col items-center">
										<Package className="w-12 h-12 text-gray-300 mb-3" />
										<p className="text-gray-500 font-medium">No products found</p>
										<p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
									</div>
								</td>
							</tr>
						) : (
							products.map((product) => {
								const stockStatus = getStockStatus(product.stock);

								return (
									<tr
										key={product.id}
										className={`hover:bg-gray-50 ${!product.isActive ? "opacity-60 bg-gray-50" : ""}`}
									>
										<td className="px-4 py-3">
											<input
												type="checkbox"
												checked={selectedProducts.includes(product.id)}
												onChange={() => handleSelectProduct(product.id)}
												className="rounded border-gray-300"
											/>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-3">
												<div
													className={`w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 ${
														!product.isActive ? "grayscale" : ""
													}`}
												>
													{product.imageUrl ? (
														<img
															src={product.imageUrl}
															alt={product.name}
															className="w-full h-full object-cover"
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center">
															<Package className="w-6 h-6 text-gray-400" />
														</div>
													)}
												</div>
												<div className="min-w-0">
													<div className="flex items-center gap-2">
														<p className="font-medium text-gray-900 truncate max-w-48">{product.name}</p>
														{!product.isActive && (
															<span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">Disabled</span>
														)}
														{product.isTrending && product.isActive && (
															<span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
																Trending
															</span>
														)}
													</div>
													<p className="text-xs text-gray-500">
														{product.brand} {product.concentration && `• ${product.concentration}`}
													</p>
												</div>
											</div>
										</td>
										<td className="px-4 py-3">
											<span className="text-sm text-gray-600 capitalize">{product.gender || "Unisex"}</span>
										</td>
										<td className="px-4 py-3">
											<span className="font-semibold text-gray-900">{formatCurrency(product.price)}</span>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												<span className="font-medium">{product.stock}</span>
												<span
													className={`px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
												>
													{stockStatus.label}
												</span>
											</div>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-1">
												<TrendingUp className="w-4 h-4 text-gray-400" />
												<span className="font-medium">{product.totalSold}</span>
											</div>
										</td>
										<td className="px-4 py-3">
											<span className="font-semibold text-green-600">{formatCurrency(product.revenue)}</span>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-1 relative">
												{actionLoading === product.id ? (
													<Loader2 className="w-4 h-4 animate-spin text-gray-500" />
												) : (
													<>
														<Link
															href={`/product/${product.slug}`}
															className="p-2 hover:bg-gray-100 rounded-lg"
															title="View on site"
															target="_blank"
														>
															<Eye className="w-4 h-4 text-gray-500" />
														</Link>
														<Link
															href={`/admin/products/${product.id}/edit`}
															className="p-2 hover:bg-gray-100 rounded-lg"
															title="Edit"
														>
															<Edit2 className="w-4 h-4 text-gray-500" />
														</Link>
														<div
															className="relative"
															ref={actionMenuOpen === product.id ? menuRef : null}
														>
															<button
																onClick={() => setActionMenuOpen(actionMenuOpen === product.id ? null : product.id)}
																className="p-2 hover:bg-gray-100 rounded-lg"
																title="More actions"
															>
																<MoreHorizontal className="w-4 h-4 text-gray-500" />
															</button>
															{actionMenuOpen === product.id && (
																<div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
																	<button
																		onClick={() => handleToggleActive(product)}
																		className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
																	>
																		<Power className="w-4 h-4" />
																		{product.isActive ? "Disable Product" : "Enable Product"}
																	</button>
																	<button
																		onClick={() => {
																			setDeleteConfirm({ id: product.id, name: product.name });
																			setActionMenuOpen(null);
																		}}
																		className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
																	>
																		<Trash2 className="w-4 h-4" />
																		Delete Product
																	</button>
																</div>
															)}
														</div>
													</>
												)}
											</div>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
						<p className="text-sm text-gray-500">
							Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} products
						</p>
						<div className="flex items-center gap-2">
							<button
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
								className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								let pageNum;
								if (totalPages <= 5) {
									pageNum = i + 1;
								} else if (currentPage <= 3) {
									pageNum = i + 1;
								} else if (currentPage >= totalPages - 2) {
									pageNum = totalPages - 4 + i;
								} else {
									pageNum = currentPage - 2 + i;
								}
								return (
									<button
										key={pageNum}
										onClick={() => handlePageChange(pageNum)}
										className={`w-10 h-10 rounded-lg text-sm font-medium ${
											currentPage === pageNum ? "bg-black text-white" : "hover:bg-gray-100"
										}`}
									>
										{pageNum}
									</button>
								);
							})}
							<button
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages}
								className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Delete Confirmation Modal */}
			{deleteConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
						<p className="text-gray-600 mb-4">
							Are you sure you want to delete <span className="font-medium">{deleteConfirm.name}</span>? This action cannot be undone.
						</p>
						<div className="flex justify-end gap-3">
							<button
								onClick={() => setDeleteConfirm(null)}
								className="px-4 py-2 border rounded-lg hover:bg-gray-50"
							>
								Cancel
							</button>
							<button
								onClick={() => handleDelete(deleteConfirm.id, true)}
								className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
