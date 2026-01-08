"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	Search,
	ChevronLeft,
	ChevronRight,
	Activity,
	User,
	Shield,
	Clock,
	RefreshCw,
	Download,
	Eye,
	Filter,
	ShoppingCart,
	Package,
	Settings,
	Globe,
} from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
	id: number;
	adminId: number | null;
	adminName: string;
	adminEmail: string;
	action: string;
	entityType: string | null;
	entityId: number | null;
	details: unknown;
	ipAddress: string | null;
	createdAt: string | undefined;
}

interface Props {
	logs: AuditLog[];
	totalCount: number;
	currentPage: number;
	pageSize: number;
	actionCounts: Record<string, number>;
	currentAction?: string;
	currentSearch?: string;
}

const actionConfig: Record<string, { icon: typeof Activity; color: string; bg: string; label: string }> = {
	order_status_update: { icon: ShoppingCart, color: "text-blue-700", bg: "bg-blue-100", label: "Order Update" },
	bulk_order_status_update: { icon: ShoppingCart, color: "text-indigo-700", bg: "bg-indigo-100", label: "Bulk Order Update" },
	user_role_change: { icon: Shield, color: "text-purple-700", bg: "bg-purple-100", label: "Role Change" },
	product_update: { icon: Package, color: "text-green-700", bg: "bg-green-100", label: "Product Update" },
	product_create: { icon: Package, color: "text-emerald-700", bg: "bg-emerald-100", label: "Product Created" },
	product_delete: { icon: Package, color: "text-red-700", bg: "bg-red-100", label: "Product Deleted" },
	settings_update: { icon: Settings, color: "text-gray-700", bg: "bg-gray-100", label: "Settings Update" },
	login: { icon: User, color: "text-green-700", bg: "bg-green-100", label: "Login" },
	logout: { icon: User, color: "text-orange-700", bg: "bg-orange-100", label: "Logout" },
};

function formatDate(dateString: string | undefined): string {
	if (!dateString) return "N/A";
	return new Date(dateString).toLocaleString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

function parseDetails(details: unknown): Record<string, unknown> | null {
	if (!details) return null;
	if (typeof details === "object") return details as Record<string, unknown>;
	try {
		return JSON.parse(String(details));
	} catch {
		return null;
	}
}

export default function AuditLogsClient({ logs, totalCount, currentPage, pageSize, actionCounts, currentAction, currentSearch }: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [search, setSearch] = useState(currentSearch || "");
	const [expandedLog, setExpandedLog] = useState<number | null>(null);
	const [exporting, setExporting] = useState(false);

	const totalPages = Math.ceil(totalCount / pageSize);

	const handleExport = async () => {
		setExporting(true);
		try {
			const params = new URLSearchParams();
			if (currentAction && currentAction !== "all") params.set("action", currentAction);

			const response = await fetch(`/api/admin/export/audit-logs?${params.toString()}`);
			if (!response.ok) throw new Error("Export failed");

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success("Audit logs exported successfully");
		} catch (error) {
			toast.error("Failed to export audit logs");
		} finally {
			setExporting(false);
		}
	};

	const handleSearch = () => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (currentAction) params.set("action", currentAction);
		params.set("page", "1");
		startTransition(() => {
			router.push(`/admin/audit-logs?${params.toString()}`);
		});
	};

	const handleActionFilter = (action: string) => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (action !== "all") params.set("action", action);
		params.set("page", "1");
		startTransition(() => {
			router.push(`/admin/audit-logs?${params.toString()}`);
		});
	};

	const handlePageChange = (newPage: number) => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (currentAction) params.set("action", currentAction);
		params.set("page", newPage.toString());
		startTransition(() => {
			router.push(`/admin/audit-logs?${params.toString()}`);
		});
	};

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
					<p className="text-gray-500 mt-1">{totalCount} total activities logged</p>
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
						<Download className={`w-4 h-4 ${exporting ? "animate-pulse" : ""}`} />
						{exporting ? "Exporting..." : "Export"}
					</button>
				</div>
			</div>

			{/* Action Filters */}
			<div className="flex flex-wrap gap-2 mb-6">
				<button
					onClick={() => handleActionFilter("all")}
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						!currentAction || currentAction === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					All ({totalCount})
				</button>
				{Object.entries(actionConfig).map(([action, config]) => {
					const count = actionCounts[action] || 0;
					if (count === 0) return null;
					const Icon = config.icon;
					return (
						<button
							key={action}
							onClick={() => handleActionFilter(action)}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
								currentAction === action ? "bg-black text-white" : `${config.bg} ${config.color} hover:opacity-80`
							}`}
						>
							<Icon className="w-4 h-4" />
							{config.label} ({count})
						</button>
					);
				})}
			</div>

			{/* Logs List */}
			<div className="bg-white rounded-xl border shadow-sm overflow-hidden">
				{logs.length === 0 ? (
					<div className="px-4 py-12 text-center">
						<Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
						<p className="text-gray-500 font-medium">No audit logs found</p>
						<p className="text-gray-400 text-sm mt-1">Admin activities will appear here</p>
					</div>
				) : (
					<div className="divide-y divide-gray-100">
						{logs.map((log) => {
							const config = actionConfig[log.action] || {
								icon: Activity,
								color: "text-gray-700",
								bg: "bg-gray-100",
								label: log.action,
							};
							const Icon = config.icon;
							const details = parseDetails(log.details);
							const isExpanded = expandedLog === log.id;

							return (
								<div
									key={log.id}
									className="hover:bg-gray-50"
								>
									<div
										className="p-4 cursor-pointer"
										onClick={() => setExpandedLog(isExpanded ? null : log.id)}
									>
										<div className="flex items-start gap-4">
											<div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
												<Icon className={`w-5 h-5 ${config.color}`} />
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 flex-wrap">
													<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
														{config.label}
													</span>
													{log.entityType && (
														<span className="text-xs text-gray-500">
															{log.entityType}
															{log.entityId && `: #${log.entityId}`}
														</span>
													)}
												</div>

												<div className="flex items-center gap-2 mt-1">
													<span className="font-medium text-gray-900">{log.adminName}</span>
													<span className="text-gray-400">•</span>
													<span className="text-sm text-gray-500">{log.adminEmail}</span>
												</div>

												<div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
													<span className="flex items-center gap-1">
														<Clock className="w-3 h-3" />
														{formatDate(log.createdAt)}
													</span>
													{log.ipAddress && (
														<span className="flex items-center gap-1">
															<Globe className="w-3 h-3" />
															{log.ipAddress}
														</span>
													)}
												</div>
											</div>

											<Eye className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
										</div>
									</div>

									{/* Expanded Details */}
									{isExpanded && details && (
										<div className="px-4 pb-4">
											<div className="ml-14 p-4 bg-gray-50 rounded-lg">
												<h4 className="text-sm font-medium text-gray-700 mb-2">Activity Details</h4>
												<pre className="text-xs text-gray-600 overflow-x-auto">{JSON.stringify(details, null, 2)}</pre>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
						<p className="text-sm text-gray-500">
							Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} logs
						</p>
						<div className="flex items-center gap-2">
							<button
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
								className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							<span className="px-4 py-2 text-sm">
								Page {currentPage} of {totalPages}
							</span>
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
