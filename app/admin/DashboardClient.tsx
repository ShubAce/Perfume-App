"use client";

import { useState } from "react";
import {
	TrendingUp,
	TrendingDown,
	DollarSign,
	ShoppingCart,
	Users,
	Package,
	AlertTriangle,
	Clock,
	CheckCircle,
	Truck,
	XCircle,
	RotateCcw,
	Eye,
	ArrowUpRight,
	ArrowDownRight,
	Calendar,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
	kpis: {
		totalRevenue: number;
		todayRevenue: number;
		monthRevenue: number;
		momGrowth: number;
		totalOrders: number;
		todayOrders: number;
		pendingOrders: number;
		aov: number;
		totalUsers: number;
		activeUsers: number;
		newUsersThisMonth: number;
		totalProducts: number;
		lowStockProducts: number;
	};
	recentOrders: Array<{
		id: number;
		userId: number | null;
		userName: string;
		userEmail: string;
		total: number;
		status: string | null;
		itemCount: number;
		createdAt: string | undefined;
	}>;
	topProducts: Array<{
		id: number | null;
		name: string;
		brand: string;
		imageUrl: string | null | undefined;
		totalSold: number;
		revenue: number;
	}>;
	ordersByStatus: Record<string, number>;
}

interface Props {
	data: DashboardData;
}

const statusColors: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
	pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
	confirmed: { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle },
	packed: { bg: "bg-purple-100", text: "text-purple-800", icon: Package },
	shipped: { bg: "bg-indigo-100", text: "text-indigo-800", icon: Truck },
	delivered: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
	cancelled: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
	refunded: { bg: "bg-gray-100", text: "text-gray-800", icon: RotateCcw },
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatNumber(num: number): string {
	if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
	if (num >= 1000) return (num / 1000).toFixed(1) + "K";
	return num.toString();
}

function formatDate(dateString: string | undefined): string {
	if (!dateString) return "N/A";
	return new Date(dateString).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default function DashboardClient({ data }: Props) {
	const { kpis, recentOrders, topProducts, ordersByStatus } = data;
	const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("month");

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
					<p className="text-gray-500 mt-1">Welcome back! Here&apos;s your business overview.</p>
				</div>
				<div className="flex items-center gap-2 bg-white rounded-lg border p-1">
					{["today", "week", "month"].map((range) => (
						<button
							key={range}
							onClick={() => setTimeRange(range as typeof timeRange)}
							className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
								timeRange === range ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
							}`}
						>
							{range.charAt(0).toUpperCase() + range.slice(1)}
						</button>
					))}
				</div>
			</div>

			{/* KPI Cards - Top Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Total Revenue */}
				<div className="bg-white rounded-xl border p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<DollarSign className="w-6 h-6 text-green-600" />
						</div>
						{kpis.momGrowth !== 0 && (
							<div className={`flex items-center gap-1 text-sm font-medium ${kpis.momGrowth > 0 ? "text-green-600" : "text-red-600"}`}>
								{kpis.momGrowth > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
								{Math.abs(kpis.momGrowth).toFixed(1)}%
							</div>
						)}
					</div>
					<div className="mt-4">
						<p className="text-sm text-gray-500">Total Revenue</p>
						<p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.totalRevenue)}</p>
						<p className="text-xs text-gray-400 mt-1">This month: {formatCurrency(kpis.monthRevenue)}</p>
					</div>
				</div>

				{/* Today's Revenue */}
				<div className="bg-white rounded-xl border p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<Calendar className="w-6 h-6 text-blue-600" />
						</div>
					</div>
					<div className="mt-4">
						<p className="text-sm text-gray-500">Today&apos;s Revenue</p>
						<p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.todayRevenue)}</p>
						<p className="text-xs text-gray-400 mt-1">{kpis.todayOrders} orders today</p>
					</div>
				</div>

				{/* Total Orders */}
				<div className="bg-white rounded-xl border p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<ShoppingCart className="w-6 h-6 text-purple-600" />
						</div>
						{kpis.pendingOrders > 0 && (
							<div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
								<AlertTriangle className="w-4 h-4" />
								{kpis.pendingOrders} pending
							</div>
						)}
					</div>
					<div className="mt-4">
						<p className="text-sm text-gray-500">Total Orders</p>
						<p className="text-2xl font-bold text-gray-900">{formatNumber(kpis.totalOrders)}</p>
						<p className="text-xs text-gray-400 mt-1">AOV: {formatCurrency(kpis.aov)}</p>
					</div>
				</div>

				{/* Total Users */}
				<div className="bg-white rounded-xl border p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
							<Users className="w-6 h-6 text-orange-600" />
						</div>
					</div>
					<div className="mt-4">
						<p className="text-sm text-gray-500">Total Users</p>
						<p className="text-2xl font-bold text-gray-900">{formatNumber(kpis.totalUsers)}</p>
						<p className="text-xs text-gray-400 mt-1">
							{kpis.activeUsers} active (30d) • {kpis.newUsersThisMonth} new this month
						</p>
					</div>
				</div>
			</div>

			{/* Secondary Stats Row */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
					<p className="text-green-100 text-sm">Delivered</p>
					<p className="text-2xl font-bold">{ordersByStatus["delivered"] || 0}</p>
				</div>
				<div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
					<p className="text-yellow-100 text-sm">Pending</p>
					<p className="text-2xl font-bold">{ordersByStatus["pending"] || 0}</p>
				</div>
				<div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
					<p className="text-indigo-100 text-sm">In Transit</p>
					<p className="text-2xl font-bold">{ordersByStatus["shipped"] || 0}</p>
				</div>
				<div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
					<p className="text-red-100 text-sm">Cancelled</p>
					<p className="text-2xl font-bold">{ordersByStatus["cancelled"] || 0}</p>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Recent Orders */}
				<div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
					<div className="p-4 border-b flex items-center justify-between">
						<h2 className="font-semibold text-gray-900">Recent Orders</h2>
						<Link
							href="/admin/orders"
							className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
						>
							View All <ArrowUpRight className="w-4 h-4" />
						</Link>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									<th className="px-4 py-3">Order ID</th>
									<th className="px-4 py-3">Customer</th>
									<th className="px-4 py-3">Total</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3">Date</th>
									<th className="px-4 py-3"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{recentOrders.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-gray-500"
										>
											No orders yet
										</td>
									</tr>
								) : (
									recentOrders.map((order) => {
										const statusConfig = statusColors[order.status || "pending"];
										const StatusIcon = statusConfig?.icon || Clock;
										return (
											<tr
												key={order.id}
												className="hover:bg-gray-50"
											>
												<td className="px-4 py-3">
													<span className="font-mono text-sm text-gray-900">#{order.id}</span>
												</td>
												<td className="px-4 py-3">
													<div>
														<p className="text-sm font-medium text-gray-900">{order.userName}</p>
														<p className="text-xs text-gray-500">{order.userEmail}</p>
													</div>
												</td>
												<td className="px-4 py-3">
													<span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span>
												</td>
												<td className="px-4 py-3">
													<span
														className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig?.bg} ${statusConfig?.text}`}
													>
														<StatusIcon className="w-3 h-3" />
														{order.status}
													</span>
												</td>
												<td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
												<td className="px-4 py-3">
													<Link
														href={`/admin/orders/${order.id}`}
														className="p-2 hover:bg-gray-100 rounded-lg inline-flex"
													>
														<Eye className="w-4 h-4 text-gray-500" />
													</Link>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Right Column */}
				<div className="space-y-6">
					{/* Top Products */}
					<div className="bg-white rounded-xl border shadow-sm">
						<div className="p-4 border-b flex items-center justify-between">
							<h2 className="font-semibold text-gray-900">Top Products</h2>
							<Link
								href="/admin/products"
								className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
							>
								View All <ArrowUpRight className="w-4 h-4" />
							</Link>
						</div>
						<div className="p-4 space-y-4">
							{topProducts.length === 0 ? (
								<p className="text-center text-gray-500 py-4">No product data yet</p>
							) : (
								topProducts.map((product, idx) => (
									<div
										key={product.id}
										className="flex items-center gap-3"
									>
										<div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
											{idx + 1}
										</div>
										<div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
											<p className="text-xs text-gray-500">{product.brand}</p>
										</div>
										<div className="text-right">
											<p className="text-sm font-semibold text-gray-900">{product.totalSold} sold</p>
											<p className="text-xs text-gray-500">{formatCurrency(product.revenue)}</p>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Inventory Alert */}
					{kpis.lowStockProducts > 0 && (
						<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
							<div className="flex items-start gap-3">
								<div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
									<AlertTriangle className="w-5 h-5 text-amber-600" />
								</div>
								<div>
									<h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
									<p className="text-sm text-amber-700 mt-1">
										{kpis.lowStockProducts} product{kpis.lowStockProducts > 1 ? "s" : ""} running low on stock.
									</p>
									<Link
										href="/admin/inventory?filter=low-stock"
										className="text-sm font-medium text-amber-800 hover:text-amber-900 mt-2 inline-block"
									>
										Review Inventory →
									</Link>
								</div>
							</div>
						</div>
					)}

					{/* Quick Stats */}
					<div className="bg-white rounded-xl border shadow-sm p-4">
						<h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">Total Products</span>
								<span className="font-semibold text-gray-900">{kpis.totalProducts}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">Conversion Rate</span>
								<span className="font-semibold text-gray-900">
									{kpis.totalUsers > 0 ? ((kpis.totalOrders / kpis.totalUsers) * 100).toFixed(1) : 0}%
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">Returning Customers</span>
								<span className="font-semibold text-gray-900">
									{kpis.totalUsers > 0 ? ((kpis.activeUsers / kpis.totalUsers) * 100).toFixed(1) : 0}%
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
