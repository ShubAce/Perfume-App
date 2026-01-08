"use client";

import { useState } from "react";
import {
	TrendingUp,
	TrendingDown,
	DollarSign,
	ShoppingCart,
	Users,
	Package,
	ArrowUpRight,
	ArrowDownRight,
	Calendar,
	BarChart3,
	PieChart,
	Activity,
	Download,
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
	dailyRevenue: Array<{
		date: string;
		revenue: number;
		orders: number;
	}>;
	revenueByGender: Array<{
		gender: string;
		revenue: number;
		unitsSold: number;
	}>;
	revenueByBrand: Array<{
		brand: string;
		revenue: number;
		unitsSold: number;
	}>;
	topSellingProducts: Array<{
		productId: number | null;
		productName: string;
		brand: string;
		imageUrl: string | null;
		revenue: number;
		unitsSold: number;
	}>;
	customerMetrics: {
		newCustomers: number;
		returningCustomers: number;
	};
	monthlyComparison: {
		thisMonth: { revenue: number; orders: number };
		lastMonth: { revenue: number; orders: number };
		revenueGrowth: number;
		ordersGrowth: number;
	};
	orderStatusDistribution: Record<string, number>;
}

interface Props {
	data: AnalyticsData;
}

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

const statusColors: Record<string, string> = {
	pending: "#EAB308",
	confirmed: "#3B82F6",
	packed: "#A855F7",
	shipped: "#6366F1",
	delivered: "#22C55E",
	cancelled: "#EF4444",
	refunded: "#6B7280",
};

export default function AnalyticsClient({ data }: Props) {
	const [activeChart, setActiveChart] = useState<"revenue" | "orders">("revenue");
	const [exporting, setExporting] = useState(false);

	const handleExport = async (type: "summary" | "products" | "brands") => {
		setExporting(true);
		try {
			const response = await fetch(`/api/admin/export/analytics?type=${type}&days=30`);
			if (!response.ok) throw new Error("Export failed");

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `analytics-${type}-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success(`Analytics ${type} exported successfully`);
		} catch (error) {
			toast.error("Failed to export analytics");
		} finally {
			setExporting(false);
		}
	};

	const { dailyRevenue, revenueByGender, revenueByBrand, topSellingProducts, customerMetrics, monthlyComparison, orderStatusDistribution } = data;

	// Calculate max values for chart scaling
	const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
	const maxOrders = Math.max(...dailyRevenue.map((d) => d.orders), 1);

	// Total gender revenue for percentage calculation
	const totalGenderRevenue = revenueByGender.reduce((acc, g) => acc + g.revenue, 0);
	const totalStatusOrders = Object.values(orderStatusDistribution).reduce((a, b) => a + b, 0);

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
					<p className="text-gray-500 mt-1">Track your store performance and trends</p>
				</div>
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2 text-sm text-gray-500">
						<Calendar className="w-4 h-4" />
						Last 30 days
					</div>
					<div className="relative group">
						<button
							disabled={exporting}
							className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
						>
							<Download className="h-4 w-4" />
							{exporting ? "Exporting..." : "Export"}
						</button>
						<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
							<button
								onClick={() => handleExport("summary")}
								className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-t-lg"
							>
								Revenue Summary
							</button>
							<button
								onClick={() => handleExport("products")}
								className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
							>
								Top Products
							</button>
							<button
								onClick={() => handleExport("brands")}
								className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-b-lg"
							>
								Brand Analytics
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Monthly Comparison Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-white rounded-xl border p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<DollarSign className="w-6 h-6 text-green-600" />
						</div>
						{monthlyComparison.revenueGrowth !== 0 && (
							<div
								className={`flex items-center gap-1 text-sm font-medium ${
									monthlyComparison.revenueGrowth > 0 ? "text-green-600" : "text-red-600"
								}`}
							>
								{monthlyComparison.revenueGrowth > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
								{Math.abs(monthlyComparison.revenueGrowth).toFixed(1)}%
							</div>
						)}
					</div>
					<div className="mt-4">
						<p className="text-sm text-gray-500">This Month Revenue</p>
						<p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyComparison.thisMonth.revenue)}</p>
						<p className="text-xs text-gray-400 mt-1">Last month: {formatCurrency(monthlyComparison.lastMonth.revenue)}</p>
					</div>
				</div>

				<div className="bg-white rounded-xl border p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<ShoppingCart className="w-6 h-6 text-blue-600" />
						</div>
						{monthlyComparison.ordersGrowth !== 0 && (
							<div
								className={`flex items-center gap-1 text-sm font-medium ${
									monthlyComparison.ordersGrowth > 0 ? "text-green-600" : "text-red-600"
								}`}
							>
								{monthlyComparison.ordersGrowth > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
								{Math.abs(monthlyComparison.ordersGrowth).toFixed(1)}%
							</div>
						)}
					</div>
					<div className="mt-4">
						<p className="text-sm text-gray-500">This Month Orders</p>
						<p className="text-2xl font-bold text-gray-900">{monthlyComparison.thisMonth.orders}</p>
						<p className="text-xs text-gray-400 mt-1">Last month: {monthlyComparison.lastMonth.orders}</p>
					</div>
				</div>

				<div className="bg-white rounded-xl border p-6 shadow-sm">
					<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
						<Users className="w-6 h-6 text-purple-600" />
					</div>
					<div className="mt-4">
						<p className="text-sm text-gray-500">New Customers</p>
						<p className="text-2xl font-bold text-gray-900">{customerMetrics.newCustomers}</p>
						<p className="text-xs text-gray-400 mt-1">In last 30 days</p>
					</div>
				</div>

				<div className="bg-white rounded-xl border p-6 shadow-sm">
					<div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
						<Activity className="w-6 h-6 text-orange-600" />
					</div>
					<div className="mt-4">
						<p className="text-sm text-gray-500">Returning Customers</p>
						<p className="text-2xl font-bold text-gray-900">{customerMetrics.returningCustomers}</p>
						<p className="text-xs text-gray-400 mt-1">Made repeat purchases</p>
					</div>
				</div>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Revenue Chart */}
				<div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="font-semibold text-gray-900 flex items-center gap-2">
							<BarChart3 className="w-5 h-5" /> Daily Performance
						</h2>
						<div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
							<button
								onClick={() => setActiveChart("revenue")}
								className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
									activeChart === "revenue" ? "bg-white text-black shadow-sm" : "text-gray-600"
								}`}
							>
								Revenue
							</button>
							<button
								onClick={() => setActiveChart("orders")}
								className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
									activeChart === "orders" ? "bg-white text-black shadow-sm" : "text-gray-600"
								}`}
							>
								Orders
							</button>
						</div>
					</div>

					{dailyRevenue.length === 0 ? (
						<div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
					) : (
						<div className="h-64 flex items-end gap-1">
							{dailyRevenue.map((day, idx) => {
								const value = activeChart === "revenue" ? day.revenue : day.orders;
								const max = activeChart === "revenue" ? maxRevenue : maxOrders;
								const height = (value / max) * 100;
								return (
									<div
										key={day.date}
										className="flex-1 group relative"
										title={`${day.date}: ${activeChart === "revenue" ? formatCurrency(day.revenue) : day.orders + " orders"}`}
									>
										<div
											className="bg-gradient-to-t from-black to-gray-700 rounded-t-sm transition-all hover:from-gray-800 hover:to-gray-600"
											style={{ height: `${Math.max(height, 2)}%` }}
										/>
										<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
											{new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
											<br />
											{activeChart === "revenue" ? formatCurrency(day.revenue) : `${day.orders} orders`}
										</div>
									</div>
								);
							})}
						</div>
					)}

					<div className="flex justify-between mt-4 text-xs text-gray-500">
						<span>
							{dailyRevenue[0]?.date
								? new Date(dailyRevenue[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
								: ""}
						</span>
						<span>
							{dailyRevenue[dailyRevenue.length - 1]?.date
								? new Date(dailyRevenue[dailyRevenue.length - 1].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
								: ""}
						</span>
					</div>
				</div>

				{/* Order Status Distribution */}
				<div className="bg-white rounded-xl border shadow-sm p-6">
					<h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-6">
						<PieChart className="w-5 h-5" /> Order Status (30 days)
					</h2>

					{totalStatusOrders === 0 ? (
						<div className="h-48 flex items-center justify-center text-gray-500">No orders yet</div>
					) : (
						<div className="space-y-3">
							{Object.entries(orderStatusDistribution).map(([status, count]) => {
								const percentage = (count / totalStatusOrders) * 100;
								return (
									<div key={status}>
										<div className="flex items-center justify-between text-sm mb-1">
											<span className="capitalize text-gray-600">{status}</span>
											<span className="font-medium">
												{count} ({percentage.toFixed(1)}%)
											</span>
										</div>
										<div className="h-2 bg-gray-100 rounded-full overflow-hidden">
											<div
												className="h-full rounded-full transition-all"
												style={{
													width: `${percentage}%`,
													backgroundColor: statusColors[status] || "#6B7280",
												}}
											/>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Gender & Brand Analysis */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Revenue by Gender */}
				<div className="bg-white rounded-xl border shadow-sm p-6">
					<h2 className="font-semibold text-gray-900 mb-4">Revenue by Gender</h2>
					{revenueByGender.length === 0 ? (
						<div className="h-48 flex items-center justify-center text-gray-500">No data available</div>
					) : (
						<div className="space-y-4">
							{revenueByGender.slice(0, 6).map((item, idx) => {
								const percentage = totalGenderRevenue > 0 ? (item.revenue / totalGenderRevenue) * 100 : 0;
								const colors = ["bg-blue-500", "bg-pink-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-cyan-500"];
								return (
									<div key={item.gender}>
										<div className="flex items-center justify-between text-sm mb-1">
											<span className="text-gray-700 font-medium capitalize">{item.gender}</span>
											<span className="text-gray-500">
												{formatCurrency(item.revenue)} • {item.unitsSold} units
											</span>
										</div>
										<div className="h-3 bg-gray-100 rounded-full overflow-hidden">
											<div
												className={`h-full rounded-full ${colors[idx % colors.length]}`}
												style={{ width: `${percentage}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Revenue by Brand */}
				<div className="bg-white rounded-xl border shadow-sm p-6">
					<h2 className="font-semibold text-gray-900 mb-4">Top Brands by Revenue</h2>
					{revenueByBrand.length === 0 ? (
						<div className="h-48 flex items-center justify-center text-gray-500">No data available</div>
					) : (
						<div className="space-y-3">
							{revenueByBrand.map((brand, idx) => (
								<div
									key={brand.brand}
									className="flex items-center gap-3"
								>
									<div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-semibold">
										{idx + 1}
									</div>
									<div className="flex-1">
										<p className="font-medium text-gray-900">{brand.brand}</p>
										<p className="text-xs text-gray-500">{brand.unitsSold} units sold</p>
									</div>
									<p className="font-semibold text-gray-900">{formatCurrency(brand.revenue)}</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Top Selling Products */}
			<div className="bg-white rounded-xl border shadow-sm p-6">
				<h2 className="font-semibold text-gray-900 mb-4">Top Selling Products</h2>
				{topSellingProducts.length === 0 ? (
					<div className="h-32 flex items-center justify-center text-gray-500">No product data yet</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
						{topSellingProducts.slice(0, 5).map((product, idx) => (
							<div
								key={product.productId}
								className="p-4 border rounded-lg hover:shadow-md transition-shadow"
							>
								<div className="flex items-center gap-2 mb-3">
									<div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center text-white text-sm font-bold">
										{idx + 1}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs text-gray-500 truncate">{product.brand}</p>
									</div>
								</div>
								<div className="w-full h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden">
									{product.imageUrl ? (
										<img
											src={product.imageUrl}
											alt={product.productName}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<Package className="w-8 h-8 text-gray-400" />
										</div>
									)}
								</div>
								<p
									className="font-medium text-gray-900 text-sm truncate"
									title={product.productName}
								>
									{product.productName}
								</p>
								<div className="mt-2 flex items-center justify-between text-sm">
									<span className="text-gray-500">{product.unitsSold} sold</span>
									<span className="font-semibold text-green-600">{formatCurrency(product.revenue)}</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
