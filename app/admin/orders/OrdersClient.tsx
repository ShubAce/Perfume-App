"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	Search,
	Filter,
	ChevronDown,
	ChevronUp,
	ChevronLeft,
	ChevronRight,
	Package,
	Clock,
	CheckCircle,
	Truck,
	XCircle,
	RotateCcw,
	Eye,
	MoreHorizontal,
	Download,
	RefreshCw,
	Mail,
	User,
	CreditCard,
	AlertCircle,
	Loader2,
} from "lucide-react";

interface OrderItem {
	id: number;
	productName: string;
	productImage: string | null | undefined;
	quantity: number;
	price: number;
}

interface Order {
	id: number;
	userId: number | null;
	userName: string;
	userEmail: string;
	total: number;
	status: string | null;
	paymentId: string | null;
	itemCount: number;
	items: OrderItem[];
	createdAt: string | undefined;
}

interface Props {
	orders: Order[];
	totalCount: number;
	currentPage: number;
	pageSize: number;
	statusCounts: Record<string, number>;
	currentStatus?: string;
	currentSearch?: string;
}

const statusConfig: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
	pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock, label: "Pending" },
	confirmed: { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle, label: "Confirmed" },
	packed: { bg: "bg-purple-100", text: "text-purple-800", icon: Package, label: "Packed" },
	shipped: { bg: "bg-indigo-100", text: "text-indigo-800", icon: Truck, label: "Shipped" },
	delivered: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle, label: "Delivered" },
	cancelled: { bg: "bg-red-100", text: "text-red-800", icon: XCircle, label: "Cancelled" },
	refunded: { bg: "bg-gray-100", text: "text-gray-800", icon: RotateCcw, label: "Refunded" },
	paid: { bg: "bg-green-100", text: "text-green-800", icon: CreditCard, label: "Paid" },
};

const statusFlow = ["pending", "confirmed", "packed", "shipped", "delivered"];

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatDate(dateString: string | undefined, full = false): string {
	if (!dateString) return "N/A";
	const options: Intl.DateTimeFormatOptions = full
		? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
		: { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
	return new Date(dateString).toLocaleDateString("en-IN", options);
}

export default function OrdersClient({ orders, totalCount, currentPage, pageSize, statusCounts, currentStatus, currentSearch }: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [search, setSearch] = useState(currentSearch || "");
	const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
	const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
	const [bulkAction, setBulkAction] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);
	const [exporting, setExporting] = useState(false);

	const totalPages = Math.ceil(totalCount / pageSize);

	const handleExport = async () => {
		setExporting(true);
		try {
			const params = new URLSearchParams();
			if (currentStatus && currentStatus !== "all") params.set("status", currentStatus);
			if (currentSearch) params.set("search", currentSearch);

			const res = await fetch(`/api/admin/export/orders?${params.toString()}`);
			if (!res.ok) throw new Error("Export failed");

			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			a.remove();
		} catch (error) {
			console.error("Export error:", error);
			alert("Failed to export orders. Please try again.");
		} finally {
			setExporting(false);
		}
	};

	const handleSearch = () => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (currentStatus) params.set("status", currentStatus);
		params.set("page", "1");
		startTransition(() => {
			router.push(`/admin/orders?${params.toString()}`);
		});
	};

	const handleStatusFilter = (status: string) => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (status !== "all") params.set("status", status);
		params.set("page", "1");
		startTransition(() => {
			router.push(`/admin/orders?${params.toString()}`);
		});
	};

	const handlePageChange = (newPage: number) => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (currentStatus) params.set("status", currentStatus);
		params.set("page", newPage.toString());
		startTransition(() => {
			router.push(`/admin/orders?${params.toString()}`);
		});
	};

	const handleSelectAll = () => {
		if (selectedOrders.length === orders.length) {
			setSelectedOrders([]);
		} else {
			setSelectedOrders(orders.map((o) => o.id.toString()));
		}
	};

	const handleSelectOrder = (orderId: number) => {
		const orderIdStr = orderId.toString();
		setSelectedOrders((prev) => (prev.includes(orderIdStr) ? prev.filter((id) => id !== orderIdStr) : [...prev, orderIdStr]));
	};

	const handleBulkStatusUpdate = async () => {
		if (!bulkAction || selectedOrders.length === 0) return;
		setIsUpdating(true);
		try {
			const res = await fetch("/api/admin/orders/bulk-update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderIds: selectedOrders.map((id) => parseInt(id)), status: bulkAction }),
			});
			if (res.ok) {
				setSelectedOrders([]);
				setBulkAction("");
				router.refresh();
			}
		} catch (error) {
			console.error("Bulk update failed:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleStatusUpdate = async (orderId: number, newStatus: string) => {
		setIsUpdating(true);
		try {
			const res = await fetch(`/api/admin/orders/${orderId}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			const data = await res.json();
			if (res.ok) {
				router.refresh();
			} else {
				console.error("Status update failed:", data.error);
				alert(`Failed to update order status: ${data.error || "Unknown error"}`);
			}
		} catch (error) {
			console.error("Status update failed:", error);
			alert("Failed to update order status. Please try again.");
		} finally {
			setIsUpdating(false);
		}
	};

	const getNextStatus = (currentStatus: string): string | null => {
		const idx = statusFlow.indexOf(currentStatus);
		if (idx === -1 || idx === statusFlow.length - 1) return null;
		return statusFlow[idx + 1];
	};

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
					<p className="text-gray-500 mt-1">{totalCount} total orders</p>
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
				</div>
			</div>

			{/* Status Tabs */}
			<div className="flex flex-wrap gap-2 mb-6">
				<button
					onClick={() => handleStatusFilter("all")}
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						!currentStatus || currentStatus === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					All ({totalCount})
				</button>
				{Object.entries(statusConfig).map(([status, config]) => {
					const count = statusCounts[status] || 0;
					return (
						<button
							key={status}
							onClick={() => handleStatusFilter(status)}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
								currentStatus === status ? "bg-black text-white" : `${config.bg} ${config.text} hover:opacity-80`
							}`}
						>
							{config.label} ({count})
						</button>
					);
				})}
			</div>

			{/* Search and Bulk Actions */}
			<div className="flex flex-col sm:flex-row gap-4 mb-6">
				<div className="flex-1 flex gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder="Search by order ID, customer name, or email..."
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

				{selectedOrders.length > 0 && (
					<div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
						<span className="text-sm text-blue-800 font-medium">{selectedOrders.length} selected</span>
						<select
							value={bulkAction}
							onChange={(e) => setBulkAction(e.target.value)}
							className="px-3 py-1.5 border rounded-lg text-sm bg-white"
						>
							<option value="">Bulk Action</option>
							{statusFlow.map((status) => (
								<option
									key={status}
									value={status}
								>
									Mark as {statusConfig[status]?.label}
								</option>
							))}
							<option value="cancelled">Cancel Orders</option>
						</select>
						<button
							onClick={handleBulkStatusUpdate}
							disabled={!bulkAction || isUpdating}
							className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
						>
							{isUpdating ? "Updating..." : "Apply"}
						</button>
					</div>
				)}
			</div>

			{/* Orders Table */}
			<div className="bg-white rounded-xl border shadow-sm overflow-hidden">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							<th className="px-4 py-3">
								<input
									type="checkbox"
									checked={selectedOrders.length === orders.length && orders.length > 0}
									onChange={handleSelectAll}
									className="rounded border-gray-300"
								/>
							</th>
							<th className="px-4 py-3">Order</th>
							<th className="px-4 py-3">Customer</th>
							<th className="px-4 py-3">Items</th>
							<th className="px-4 py-3">Total</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3">Payment</th>
							<th className="px-4 py-3">Date</th>
							<th className="px-4 py-3">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{orders.length === 0 ? (
							<tr>
								<td
									colSpan={9}
									className="px-4 py-12 text-center"
								>
									<div className="flex flex-col items-center">
										<Package className="w-12 h-12 text-gray-300 mb-3" />
										<p className="text-gray-500 font-medium">No orders found</p>
										<p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
									</div>
								</td>
							</tr>
						) : (
							orders.map((order) => {
								const config = statusConfig[order.status || "pending"];
								const StatusIcon = config?.icon || Clock;
								const isExpanded = expandedOrder === order.id;
								const nextStatus = getNextStatus(order.status || "pending");

								return (
									<React.Fragment key={order.id}>
										<tr className={`hover:bg-gray-50 ${isExpanded ? "bg-gray-50" : ""}`}>
											<td className="px-4 py-3">
												<input
													type="checkbox"
													checked={selectedOrders.includes(order.id.toString())}
													onChange={() => handleSelectOrder(order.id)}
													className="rounded border-gray-300"
												/>
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<button
														onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
														className="p-1 hover:bg-gray-200 rounded"
													>
														{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
													</button>
													<span className="font-mono text-sm font-medium">#{order.id}</span>
												</div>
											</td>
											<td className="px-4 py-3">
												<div>
													<p className="font-medium text-gray-900">{order.userName}</p>
													<p className="text-xs text-gray-500">{order.userEmail}</p>
												</div>
											</td>
											<td className="px-4 py-3">
												<span className="text-sm">{order.itemCount} items</span>
											</td>
											<td className="px-4 py-3">
												<span className="font-semibold">{formatCurrency(order.total)}</span>
											</td>
											<td className="px-4 py-3">
												<span
													className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config?.bg} ${config?.text}`}
												>
													<StatusIcon className="w-3 h-3" />
													{config?.label}
												</span>
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-1">
													<CreditCard className="w-4 h-4 text-gray-400" />
													<span className="text-sm">{order.paymentId ? "Stripe" : "N/A"}</span>
												</div>
												<span className={`text-xs ${order.status === "delivered" ? "text-green-600" : "text-yellow-600"}`}>
													{order.status === "delivered" ? "paid" : "pending"}
												</span>
											</td>
											<td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-1">
													{nextStatus && order.status !== "cancelled" && (
														<button
															onClick={() => handleStatusUpdate(order.id, nextStatus)}
															disabled={isUpdating}
															className="px-3 py-1.5 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
														>
															{statusConfig[nextStatus]?.label}
														</button>
													)}
													<button
														className="p-2 hover:bg-gray-100 rounded-lg"
														title="More actions"
													>
														<MoreHorizontal className="w-4 h-4 text-gray-500" />
													</button>
												</div>
											</td>
										</tr>
										{/* Expanded Row */}
										{isExpanded && (
											<tr className="bg-gray-50">
												<td
													colSpan={9}
													className="px-4 py-4"
												>
													<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
														{/* Order Items */}
														<div className="lg:col-span-2">
															<h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
															<div className="space-y-3">
																{order.items.map((item) => (
																	<div
																		key={item.id}
																		className="flex items-center gap-4 p-3 bg-white rounded-lg border"
																	>
																		<div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
																			{item.productImage ? (
																				<img
																					src={item.productImage}
																					alt={item.productName}
																					className="w-full h-full object-cover"
																				/>
																			) : (
																				<div className="w-full h-full flex items-center justify-center">
																					<Package className="w-6 h-6 text-gray-400" />
																				</div>
																			)}
																		</div>
																		<div className="flex-1">
																			<p className="font-medium text-gray-900">{item.productName}</p>
																			<p className="text-sm text-gray-500">
																				Qty: {item.quantity} × {formatCurrency(item.price)}
																			</p>
																		</div>
																		<p className="font-semibold">{formatCurrency(item.quantity * item.price)}</p>
																	</div>
																))}
															</div>
														</div>

														{/* Customer Details */}
														<div className="space-y-4">
															<div className="p-4 bg-white rounded-lg border">
																<h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
																	<User className="w-4 h-4" /> Customer Details
																</h4>
																<div className="space-y-2 text-sm">
																	<p className="flex items-center gap-2">
																		<User className="w-4 h-4 text-gray-400" />
																		{order.userName}
																	</p>
																	<p className="flex items-center gap-2">
																		<Mail className="w-4 h-4 text-gray-400" />
																		{order.userEmail}
																	</p>
																	{order.paymentId && (
																		<p className="flex items-center gap-2">
																			<CreditCard className="w-4 h-4 text-gray-400" />
																			<span className="truncate">{order.paymentId}</span>
																		</p>
																	)}
																</div>
															</div>

															{/* Quick Actions */}
															<div className="flex flex-wrap gap-2">
																{order.status !== "cancelled" && order.status !== "delivered" && (
																	<button
																		onClick={() => handleStatusUpdate(order.id, "cancelled")}
																		className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
																	>
																		Cancel Order
																	</button>
																)}
																{order.status === "delivered" && (
																	<button
																		onClick={() => handleStatusUpdate(order.id, "refunded")}
																		className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
																	>
																		Process Refund
																	</button>
																)}
															</div>
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								);
							})
						)}
					</tbody>
				</table>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
						<p className="text-sm text-gray-500">
							Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} orders
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
		</div>
	);
}
