"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	Search,
	ChevronLeft,
	ChevronRight,
	User,
	Mail,
	Calendar,
	ShoppingBag,
	Crown,
	Shield,
	UserCog,
	HeadphonesIcon,
	Megaphone,
	MoreHorizontal,
	RefreshCw,
	Download,
	Eye,
	Edit2,
	UserX,
	CheckCircle,
	XCircle,
	Loader2,
} from "lucide-react";
import Link from "next/link";

interface UserData {
	id: number;
	name: string;
	email: string;
	image: string | null;
	role: string | null;
	emailVerified: Date | null;
	createdAt: string | undefined;
	orderCount: number;
	totalSpent: number;
	lastOrderDate: string | null;
}

interface Props {
	users: UserData[];
	totalCount: number;
	currentPage: number;
	pageSize: number;
	roleCounts: Record<string, number>;
	currentRole?: string;
	currentSearch?: string;
}

const roleConfig: Record<string, { icon: typeof User; color: string; bg: string; label: string }> = {
	super_admin: { icon: Crown, color: "text-purple-700", bg: "bg-purple-100", label: "Super Admin" },
	admin: { icon: Shield, color: "text-blue-700", bg: "bg-blue-100", label: "Admin" },
	operations: { icon: UserCog, color: "text-green-700", bg: "bg-green-100", label: "Operations" },
	support: { icon: HeadphonesIcon, color: "text-orange-700", bg: "bg-orange-100", label: "Support" },
	marketing: { icon: Megaphone, color: "text-pink-700", bg: "bg-pink-100", label: "Marketing" },
	user: { icon: User, color: "text-gray-700", bg: "bg-gray-100", label: "Customer" },
	customer: { icon: User, color: "text-gray-700", bg: "bg-gray-100", label: "Customer" },
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatDate(dateString: string | undefined | null): string {
	if (!dateString) return "N/A";
	return new Date(dateString).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function getCustomerTier(totalSpent: number): { label: string; color: string } {
	if (totalSpent >= 50000) return { label: "Platinum", color: "text-purple-600" };
	if (totalSpent >= 25000) return { label: "Gold", color: "text-yellow-600" };
	if (totalSpent >= 10000) return { label: "Silver", color: "text-gray-500" };
	return { label: "Bronze", color: "text-orange-600" };
}

export default function UsersClient({ users, totalCount, currentPage, pageSize, roleCounts, currentRole, currentSearch }: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [search, setSearch] = useState(currentSearch || "");
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [exporting, setExporting] = useState(false);

	const totalPages = Math.ceil(totalCount / pageSize);

	const handleExport = async () => {
		setExporting(true);
		try {
			const params = new URLSearchParams();
			if (currentRole && currentRole !== "all") params.set("role", currentRole);
			if (currentSearch) params.set("search", currentSearch);

			const res = await fetch(`/api/admin/export/users?${params.toString()}`);
			if (!res.ok) throw new Error("Export failed");

			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			a.remove();
		} catch (error) {
			console.error("Export error:", error);
			alert("Failed to export users. Please try again.");
		} finally {
			setExporting(false);
		}
	};

	const handleSearch = () => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (currentRole) params.set("role", currentRole);
		params.set("page", "1");
		startTransition(() => {
			router.push(`/admin/users?${params.toString()}`);
		});
	};

	const handleRoleFilter = (role: string) => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (role !== "all") params.set("role", role);
		params.set("page", "1");
		startTransition(() => {
			router.push(`/admin/users?${params.toString()}`);
		});
	};

	const handlePageChange = (newPage: number) => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (currentRole) params.set("role", currentRole);
		params.set("page", newPage.toString());
		startTransition(() => {
			router.push(`/admin/users?${params.toString()}`);
		});
	};

	const handleSelectAll = () => {
		if (selectedUsers.length === users.length) {
			setSelectedUsers([]);
		} else {
			setSelectedUsers(users.map((u) => u.id.toString()));
		}
	};

	const handleSelectUser = (userId: number) => {
		const userIdStr = userId.toString();
		setSelectedUsers((prev) => (prev.includes(userIdStr) ? prev.filter((id) => id !== userIdStr) : [...prev, userIdStr]));
	};

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">User Management</h1>
					<p className="text-gray-500 mt-1">{totalCount} total users</p>
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

			{/* Role Tabs */}
			<div className="flex flex-wrap gap-2 mb-6">
				<button
					onClick={() => handleRoleFilter("all")}
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						!currentRole || currentRole === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					All Users ({totalCount})
				</button>
				{Object.entries(roleConfig).map(([role, config]) => {
					const count = roleCounts[role] || 0;
					if (count === 0 && role !== "user") return null;
					const RoleIcon = config.icon;
					return (
						<button
							key={role}
							onClick={() => handleRoleFilter(role)}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
								currentRole === role ? "bg-black text-white" : `${config.bg} ${config.color} hover:opacity-80`
							}`}
						>
							<RoleIcon className="w-4 h-4" />
							{config.label} ({count})
						</button>
					);
				})}
			</div>

			{/* Search */}
			<div className="flex gap-2 mb-6">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						placeholder="Search by name or email..."
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

			{/* Users Table */}
			<div className="bg-white rounded-xl border shadow-sm overflow-hidden">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							<th className="px-4 py-3">
								<input
									type="checkbox"
									checked={selectedUsers.length === users.length && users.length > 0}
									onChange={handleSelectAll}
									className="rounded border-gray-300"
								/>
							</th>
							<th className="px-4 py-3">User</th>
							<th className="px-4 py-3">Role</th>
							<th className="px-4 py-3">Orders</th>
							<th className="px-4 py-3">Total Spent</th>
							<th className="px-4 py-3">Tier</th>
							<th className="px-4 py-3">Last Order</th>
							<th className="px-4 py-3">Joined</th>
							<th className="px-4 py-3">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{users.length === 0 ? (
							<tr>
								<td
									colSpan={9}
									className="px-4 py-12 text-center"
								>
									<div className="flex flex-col items-center">
										<User className="w-12 h-12 text-gray-300 mb-3" />
										<p className="text-gray-500 font-medium">No users found</p>
										<p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
									</div>
								</td>
							</tr>
						) : (
							users.map((user) => {
								const config = roleConfig[user.role || "user"] || roleConfig.user;
								const RoleIcon = config.icon;
								const tier = getCustomerTier(user.totalSpent);

								return (
									<tr
										key={user.id}
										className="hover:bg-gray-50"
									>
										<td className="px-4 py-3">
											<input
												type="checkbox"
												checked={selectedUsers.includes(user.id.toString())}
												onChange={() => handleSelectUser(user.id)}
												className="rounded border-gray-300"
											/>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
													{user.image ? (
														<img
															src={user.image}
															alt={user.name}
															className="w-full h-full object-cover"
														/>
													) : (
														<User className="w-5 h-5 text-gray-500" />
													)}
												</div>
												<div>
													<div className="flex items-center gap-2">
														<p className="font-medium text-gray-900">{user.name}</p>
														{user.emailVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
													</div>
													<div className="flex items-center gap-2 text-xs text-gray-500">
														<Mail className="w-3 h-3" />
														{user.email}
													</div>
												</div>
											</div>
										</td>
										<td className="px-4 py-3">
											<span
												className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
											>
												<RoleIcon className="w-3 h-3" />
												{config.label}
											</span>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-1">
												<ShoppingBag className="w-4 h-4 text-gray-400" />
												<span className="font-medium">{user.orderCount}</span>
											</div>
										</td>
										<td className="px-4 py-3">
											<span className="font-semibold">{formatCurrency(user.totalSpent)}</span>
										</td>
										<td className="px-4 py-3">
											<span className={`font-medium ${tier.color}`}>{tier.label}</span>
										</td>
										<td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.lastOrderDate)}</td>
										<td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-1">
												<Link
													href={`/admin/users/${user.id}`}
													className="p-2 hover:bg-gray-100 rounded-lg"
													title="View Details"
												>
													<Eye className="w-4 h-4 text-gray-500" />
												</Link>
												<button
													className="p-2 hover:bg-gray-100 rounded-lg"
													title="Edit User"
												>
													<Edit2 className="w-4 h-4 text-gray-500" />
												</button>
												<button
													className="p-2 hover:bg-gray-100 rounded-lg"
													title="More Actions"
												>
													<MoreHorizontal className="w-4 h-4 text-gray-500" />
												</button>
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
							Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} users
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
