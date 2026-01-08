"use client";

import { useState } from "react";
import { Tag, Plus, Edit2, Trash2, Search, Calendar, Percent, DollarSign, CheckCircle, XCircle, Download } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
	id: number;
	code: string;
	discountType: string;
	discountValue: string;
	minOrderAmount: string | null;
	maxDiscountAmount: string | null;
	usageLimit: number | null;
	usedCount: number | null;
	expiresAt: Date | null;
	isActive: boolean | null;
	createdAt: Date | null;
}

interface Props {
	coupons: Coupon[];
}

export default function PromotionsClient({ coupons: initialCoupons }: Props) {
	const [coupons, setCoupons] = useState(initialCoupons);
	const [searchTerm, setSearchTerm] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
	const [loading, setLoading] = useState(false);
	const [exporting, setExporting] = useState(false);

	const [formData, setFormData] = useState({
		code: "",
		discountType: "percentage",
		discountValue: "",
		minOrderAmount: "",
		maxDiscountAmount: "",
		usageLimit: "",
		expiresAt: "",
		isActive: true,
	});

	const handleExport = async () => {
		setExporting(true);
		try {
			const response = await fetch("/api/admin/export/promotions");
			if (!response.ok) throw new Error("Export failed");

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `promotions-export-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success("Promotions exported successfully");
		} catch (error) {
			toast.error("Failed to export promotions");
		} finally {
			setExporting(false);
		}
	};

	const filteredCoupons = coupons.filter((coupon) => coupon.code.toLowerCase().includes(searchTerm.toLowerCase()));

	const resetForm = () => {
		setFormData({
			code: "",
			discountType: "percentage",
			discountValue: "",
			minOrderAmount: "",
			maxDiscountAmount: "",
			usageLimit: "",
			expiresAt: "",
			isActive: true,
		});
		setEditingCoupon(null);
	};

	const handleOpenModal = (coupon?: Coupon) => {
		if (coupon) {
			setEditingCoupon(coupon);
			setFormData({
				code: coupon.code,
				discountType: coupon.discountType || "percentage",
				discountValue: coupon.discountValue,
				minOrderAmount: coupon.minOrderAmount || "",
				maxDiscountAmount: coupon.maxDiscountAmount || "",
				usageLimit: coupon.usageLimit?.toString() || "",
				expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
				isActive: coupon.isActive ?? true,
			});
		} else {
			resetForm();
		}
		setShowModal(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const url = editingCoupon ? `/api/admin/promotions/${editingCoupon.id}` : "/api/admin/promotions";
			const method = editingCoupon ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const data = await response.json();
				if (editingCoupon) {
					setCoupons(coupons.map((c) => (c.id === editingCoupon.id ? data.coupon : c)));
					toast.success("Coupon updated successfully");
				} else {
					setCoupons([data.coupon, ...coupons]);
					toast.success("Coupon created successfully");
				}
				setShowModal(false);
				resetForm();
			} else {
				const error = await response.json();
				toast.error(error.message || "Failed to save coupon");
			}
		} catch (error) {
			toast.error("Error saving coupon");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (couponId: number) => {
		if (!confirm("Are you sure you want to delete this coupon?")) return;

		try {
			const response = await fetch(`/api/admin/promotions/${couponId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				setCoupons(coupons.filter((c) => c.id !== couponId));
				toast.success("Coupon deleted successfully");
			} else {
				toast.error("Failed to delete coupon");
			}
		} catch (error) {
			toast.error("Error deleting coupon");
		}
	};

	const toggleActive = async (coupon: Coupon) => {
		try {
			const response = await fetch(`/api/admin/promotions/${coupon.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: !coupon.isActive }),
			});

			if (response.ok) {
				setCoupons(coupons.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c)));
				toast.success(`Coupon ${!coupon.isActive ? "activated" : "deactivated"}`);
			}
		} catch (error) {
			toast.error("Error updating coupon");
		}
	};

	const isExpired = (coupon: Coupon) => {
		if (!coupon.expiresAt) return false;
		return new Date(coupon.expiresAt) < new Date();
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-gray-900">Promotions & Coupons</h1>
				<div className="flex gap-2">
					<button
						onClick={handleExport}
						disabled={exporting}
						className="flex items-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
					>
						<Download className="h-5 w-5" />
						{exporting ? "Exporting..." : "Export"}
					</button>
					<button
						onClick={() => handleOpenModal()}
						className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
					>
						<Plus className="h-5 w-5" />
						Create Coupon
					</button>
				</div>
			</div>

			{/* Search */}
			<div className="bg-white rounded-lg shadow p-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					<input
						type="text"
						placeholder="Search coupons..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					/>
				</div>
			</div>

			{/* Coupons Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredCoupons.map((coupon) => (
					<div
						key={coupon.id}
						className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
							coupon.isActive && !isExpired(coupon) ? "border-green-500" : "border-gray-300"
						}`}
					>
						<div className="p-6">
							<div className="flex justify-between items-start mb-4">
								<div>
									<h3 className="text-lg font-bold text-gray-900 font-mono">{coupon.code}</h3>
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
											coupon.isActive && !isExpired(coupon) ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
										}`}
									>
										{isExpired(coupon) ? "Expired" : coupon.isActive ? "Active" : "Inactive"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={() => handleOpenModal(coupon)}
										className="p-1 text-gray-400 hover:text-purple-600"
									>
										<Edit2 className="h-4 w-4" />
									</button>
									<button
										onClick={() => handleDelete(coupon.id)}
										className="p-1 text-gray-400 hover:text-red-600"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center gap-2">
									{coupon.discountType === "percentage" ? (
										<Percent className="h-4 w-4 text-purple-600" />
									) : (
										<DollarSign className="h-4 w-4 text-purple-600" />
									)}
									<span className="text-2xl font-bold text-purple-600">
										{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
									</span>
									<span className="text-gray-500">off</span>
								</div>

								{coupon.minOrderAmount && <p className="text-sm text-gray-500">Min. order: ₹{coupon.minOrderAmount}</p>}

								<div className="flex items-center gap-2 text-sm text-gray-500">
									<Calendar className="h-4 w-4" />
									<span>
										{coupon.createdAt ? new Date(coupon.createdAt).toLocaleDateString() : "No start"} -{" "}
										{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "No end"}
									</span>
								</div>

								<div className="flex justify-between items-center pt-2 border-t border-gray-100">
									<span className="text-sm text-gray-500">
										Used: {coupon.usedCount || 0} / {coupon.usageLimit || "∞"}
									</span>
									<button
										onClick={() => toggleActive(coupon)}
										className={`p-1 rounded ${coupon.isActive ? "text-green-600" : "text-gray-400"}`}
									>
										{coupon.isActive ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
									</button>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{filteredCoupons.length === 0 && (
				<div className="text-center py-12 bg-white rounded-lg shadow">
					<Tag className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 text-sm font-medium text-gray-900">No coupons found</h3>
					<p className="mt-1 text-sm text-gray-500">Create your first coupon to get started.</p>
				</div>
			)}

			{/* Modal */}
			{showModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
						<div className="p-6">
							<h2 className="text-xl font-bold text-gray-900 mb-4">{editingCoupon ? "Edit Coupon" : "Create Coupon"}</h2>
							<form
								onSubmit={handleSubmit}
								className="space-y-4"
							>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
									<input
										type="text"
										required
										value={formData.code}
										onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										placeholder="e.g., SUMMER20"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
										<select
											value={formData.discountType}
											onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										>
											<option value="percentage">Percentage</option>
											<option value="fixed">Fixed Amount</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
										<input
											type="number"
											required
											min="0"
											step="0.01"
											value={formData.discountValue}
											onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Min. Order Amount</label>
										<input
											type="number"
											min="0"
											step="0.01"
											value={formData.minOrderAmount}
											onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
											placeholder="Optional"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount</label>
										<input
											type="number"
											min="0"
											step="0.01"
											value={formData.maxDiscountAmount}
											onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
											placeholder="Optional"
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
										<input
											type="number"
											min="0"
											value={formData.usageLimit}
											onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
											placeholder="Unlimited"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
										<input
											type="date"
											value={formData.expiresAt}
											onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										/>
									</div>
								</div>

								<div className="flex items-center">
									<input
										type="checkbox"
										id="isActive"
										checked={formData.isActive}
										onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
										className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
									/>
									<label
										htmlFor="isActive"
										className="ml-2 text-sm text-gray-700"
									>
										Active
									</label>
								</div>

								<div className="flex justify-end gap-3 pt-4">
									<button
										type="button"
										onClick={() => setShowModal(false)}
										className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={loading}
										className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
									>
										{loading ? "Saving..." : editingCoupon ? "Update" : "Create"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
