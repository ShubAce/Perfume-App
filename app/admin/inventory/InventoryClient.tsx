"use client";

import { useState } from "react";
import { Package, AlertTriangle, XCircle, CheckCircle, Search, Filter, Edit2, Save, Download } from "lucide-react";
import { toast } from "sonner";

interface Product {
	id: number;
	name: string;
	brand: string;
	stock: number;
	price: string;
	imageUrl: string | null;
	isActive: boolean | null;
}

interface InventoryStats {
	totalProducts: number;
	totalStock: number;
	lowStock: number;
	outOfStock: number;
}

interface Props {
	products: Product[];
	stats: InventoryStats;
}

export default function InventoryClient({ products: initialProducts, stats }: Props) {
	const [products, setProducts] = useState(initialProducts);
	const [searchTerm, setSearchTerm] = useState("");
	const [filter, setFilter] = useState<"all" | "low" | "out">("all");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editStock, setEditStock] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const [exporting, setExporting] = useState(false);

	const handleExport = async () => {
		setExporting(true);
		try {
			const response = await fetch(`/api/admin/export/inventory?filter=${filter}`);
			if (!response.ok) throw new Error("Export failed");

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `inventory-export-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success("Inventory exported successfully");
		} catch (error) {
			toast.error("Failed to export inventory");
		} finally {
			setExporting(false);
		}
	};

	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.brand.toLowerCase().includes(searchTerm.toLowerCase());

		if (filter === "low") return matchesSearch && product.stock > 0 && product.stock < 10;
		if (filter === "out") return matchesSearch && product.stock === 0;
		return matchesSearch;
	});

	const handleStartEdit = (product: Product) => {
		setEditingId(product.id);
		setEditStock(product.stock);
	};

	const handleSaveStock = async (productId: number) => {
		setLoading(true);
		try {
			const response = await fetch(`/api/admin/products/${productId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ stock: editStock }),
			});

			<button
				onClick={handleExport}
				disabled={exporting}
				className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
			>
				<Download className="h-5 w-5" />
				{exporting ? "Exporting..." : "Export"}
			</button>;
			if (response.ok) {
				setProducts(products.map((p) => (p.id === productId ? { ...p, stock: editStock } : p)));
				toast.success("Stock updated successfully");
			} else {
				toast.error("Failed to update stock");
			}
		} catch (error) {
			toast.error("Error updating stock");
		} finally {
			setLoading(false);
			setEditingId(null);
		}
	};

	const getStockStatus = (stock: number) => {
		if (stock === 0) return { color: "text-red-600 bg-red-100", label: "Out of Stock", icon: XCircle };
		if (stock < 10) return { color: "text-yellow-600 bg-yellow-100", label: "Low Stock", icon: AlertTriangle };
		return { color: "text-green-600 bg-green-100", label: "In Stock", icon: CheckCircle };
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-blue-100 text-blue-600">
							<Package className="h-6 w-6" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Total Products</p>
							<p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-green-100 text-green-600">
							<CheckCircle className="h-6 w-6" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Total Stock</p>
							<p className="text-2xl font-semibold text-gray-900">{stats.totalStock}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
							<AlertTriangle className="h-6 w-6" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Low Stock</p>
							<p className="text-2xl font-semibold text-gray-900">{stats.lowStock}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-red-100 text-red-600">
							<XCircle className="h-6 w-6" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Out of Stock</p>
							<p className="text-2xl font-semibold text-gray-900">{stats.outOfStock}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-white rounded-lg shadow p-4">
				<div className="flex flex-col md:flex-row gap-4">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
						<input
							type="text"
							placeholder="Search products..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						/>
					</div>
					<div className="flex gap-2">
						<button
							onClick={() => setFilter("all")}
							className={`px-4 py-2 rounded-lg font-medium transition-colors ${
								filter === "all" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							All
						</button>
						<button
							onClick={() => setFilter("low")}
							className={`px-4 py-2 rounded-lg font-medium transition-colors ${
								filter === "low" ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							Low Stock
						</button>
						<button
							onClick={() => setFilter("out")}
							className={`px-4 py-2 rounded-lg font-medium transition-colors ${
								filter === "out" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							Out of Stock
						</button>
					</div>
				</div>
			</div>

			{/* Products Table */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filteredProducts.map((product) => {
							const status = getStockStatus(product.stock);
							const StatusIcon = status.icon;

							return (
								<tr
									key={product.id}
									className="hover:bg-gray-50"
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											<div className="h-10 w-10 flex-shrink-0">
												<img
													className="h-10 w-10 rounded-lg object-cover"
													src={product.imageUrl || "/images/placeholder.jpg"}
													alt={product.name}
												/>
											</div>
											<div className="ml-4">
												<div className="text-sm font-medium text-gray-900">{product.name}</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.brand}</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{product.price}</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{editingId === product.id ? (
											<input
												type="number"
												min="0"
												value={editStock}
												onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
												className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
											/>
										) : (
											<span className="text-sm font-medium text-gray-900">{product.stock}</span>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
											<StatusIcon className="h-3 w-3 mr-1" />
											{status.label}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
										{editingId === product.id ? (
											<button
												onClick={() => handleSaveStock(product.id)}
												disabled={loading}
												className="text-green-600 hover:text-green-900 flex items-center gap-1"
											>
												<Save className="h-4 w-4" />
												Save
											</button>
										) : (
											<button
												onClick={() => handleStartEdit(product)}
												className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
											>
												<Edit2 className="h-4 w-4" />
												Edit
											</button>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>

				{filteredProducts.length === 0 && (
					<div className="text-center py-12">
						<Package className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
						<p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
					</div>
				)}
			</div>
		</div>
	);
}
