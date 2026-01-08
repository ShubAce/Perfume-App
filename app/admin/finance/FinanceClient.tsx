"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Download, Filter, CreditCard, Wallet, PiggyBank } from "lucide-react";
import { toast } from "sonner";

interface Stats {
	totalRevenue: number;
	todayRevenue: number;
	weekRevenue: number;
	monthRevenue: number;
	yearRevenue: number;
}

interface Transaction {
	id: number;
	totalAmount: string;
	status: string | null;
	createdAt: Date | null;
	user: {
		id: number;
		name: string;
		email: string;
	} | null;
}

interface RevenueByMonth {
	month: string;
	revenue: string | null;
	orderCount: number;
}

interface Props {
	stats: Stats;
	transactions: Transaction[];
	revenueByMonth: RevenueByMonth[];
}

export default function FinanceClient({ stats, transactions, revenueByMonth }: Props) {
	const [period, setPeriod] = useState<"today" | "week" | "month" | "year" | "all">("month");
	const [exporting, setExporting] = useState(false);

	const handleExport = async () => {
		setExporting(true);
		try {
			const response = await fetch(`/api/admin/export/finance?period=${period}`);
			if (!response.ok) throw new Error("Export failed");

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `finance-report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success("Finance report exported successfully");
		} catch (error) {
			toast.error("Failed to export finance report");
		} finally {
			setExporting(false);
		}
	};

	const getDisplayRevenue = () => {
		switch (period) {
			case "today":
				return stats.todayRevenue;
			case "week":
				return stats.weekRevenue;
			case "month":
				return stats.monthRevenue;
			case "year":
				return stats.yearRevenue;
			default:
				return stats.totalRevenue;
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
		}).format(amount);
	};

	const getStatusColor = (status: string | null) => {
		switch (status) {
			case "delivered":
				return "bg-green-100 text-green-800";
			case "shipped":
				return "bg-blue-100 text-blue-800";
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-gray-900">Finance Overview</h1>
				<button
					onClick={handleExport}
					disabled={exporting}
					className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
				>
					<Download className="h-5 w-5" />
					{exporting ? "Exporting..." : "Export Report"}
				</button>
			</div>

			{/* Period Selector */}
			<div className="flex gap-2">
				{[
					{ key: "today", label: "Today" },
					{ key: "week", label: "This Week" },
					{ key: "month", label: "This Month" },
					{ key: "year", label: "This Year" },
					{ key: "all", label: "All Time" },
				].map((p) => (
					<button
						key={p.key}
						onClick={() => setPeriod(p.key as any)}
						className={`px-4 py-2 rounded-lg font-medium transition-colors ${
							period === p.key ? "bg-purple-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						{p.label}
					</button>
				))}
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="bg-white rounded-xl shadow-md p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-500">Total Revenue</p>
							<p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(getDisplayRevenue())}</p>
						</div>
						<div className="p-3 bg-purple-100 rounded-full">
							<DollarSign className="h-8 w-8 text-purple-600" />
						</div>
					</div>
					<div className="mt-4 flex items-center text-sm">
						<ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
						<span className="text-green-500 font-medium">12.5%</span>
						<span className="text-gray-500 ml-1">vs last period</span>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-md p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-500">Today's Revenue</p>
							<p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.todayRevenue)}</p>
						</div>
						<div className="p-3 bg-green-100 rounded-full">
							<TrendingUp className="h-8 w-8 text-green-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-md p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
							<p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.monthRevenue)}</p>
						</div>
						<div className="p-3 bg-blue-100 rounded-full">
							<Calendar className="h-8 w-8 text-blue-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-md p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-500">Yearly Revenue</p>
							<p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.yearRevenue)}</p>
						</div>
						<div className="p-3 bg-amber-100 rounded-full">
							<PiggyBank className="h-8 w-8 text-amber-600" />
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Revenue Chart */}
				<div className="bg-white rounded-xl shadow-md p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
					<div className="space-y-4">
						{revenueByMonth.slice(0, 6).map((item, index) => {
							const revenue = parseFloat(item.revenue || "0");
							const maxRevenue = Math.max(...revenueByMonth.map((r) => parseFloat(r.revenue || "0")));
							const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;

							return (
								<div
									key={item.month}
									className="space-y-1"
								>
									<div className="flex justify-between text-sm">
										<span className="text-gray-600">{item.month}</span>
										<span className="font-medium text-gray-900">{formatCurrency(revenue)}</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-purple-600 h-2 rounded-full transition-all duration-300"
											style={{ width: `${percentage}%` }}
										/>
									</div>
									<div className="text-xs text-gray-500">{item.orderCount} orders</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Recent Transactions */}
				<div className="bg-white rounded-xl shadow-md p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
					<div className="space-y-3">
						{transactions.slice(0, 8).map((transaction) => (
							<div
								key={transaction.id}
								className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-gray-100 rounded-full">
										<CreditCard className="h-4 w-4 text-gray-600" />
									</div>
									<div>
										<p className="text-sm font-medium text-gray-900">Order #{transaction.id}</p>
										<p className="text-xs text-gray-500">{transaction.user?.name || "Guest"}</p>
									</div>
								</div>
								<div className="text-right">
									<p className="text-sm font-semibold text-gray-900">₹{transaction.totalAmount}</p>
									<span
										className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
									>
										{transaction.status}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
