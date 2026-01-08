"use client";

import { useState } from "react";
import {
	HeadphonesIcon,
	MessageSquare,
	Clock,
	CheckCircle,
	AlertTriangle,
	Search,
	Filter,
	User,
	Package,
	ChevronDown,
	X,
	Download,
} from "lucide-react";
import { toast } from "sonner";

interface Ticket {
	id: number;
	subject: string;
	description: string;
	status: string | null;
	priority: string | null;
	adminNotes: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
	user: {
		id: number;
		name: string;
		email: string;
	} | null;
	order: {
		id: number;
		totalAmount: string;
		status: string | null;
	} | null;
	assignee: {
		id: number;
		name: string;
	} | null;
}

interface SupportStaff {
	id: number;
	name: string;
	role: string | null;
}

interface Stats {
	total: number;
	open: number;
	inProgress: number;
	resolved: number;
	urgent: number;
}

interface Props {
	tickets: Ticket[];
	supportStaff: SupportStaff[];
	stats: Stats;
}

export default function SupportClient({ tickets: initialTickets, supportStaff, stats }: Props) {
	const [tickets, setTickets] = useState(initialTickets);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [priorityFilter, setPriorityFilter] = useState<string>("all");
	const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
	const [loading, setLoading] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [adminNotes, setAdminNotes] = useState("");

	const handleExport = async () => {
		setExporting(true);
		try {
			const params = new URLSearchParams();
			if (statusFilter !== "all") params.set("status", statusFilter);
			if (priorityFilter !== "all") params.set("priority", priorityFilter);

			const response = await fetch(`/api/admin/export/support?${params.toString()}`);
			if (!response.ok) throw new Error("Export failed");

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `support-tickets-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success("Support tickets exported successfully");
		} catch (error) {
			toast.error("Failed to export support tickets");
		} finally {
			setExporting(false);
		}
	};

	const filteredTickets = tickets.filter((ticket) => {
		const matchesSearch =
			ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ticket.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ticket.user?.email.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
		const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

		return matchesSearch && matchesStatus && matchesPriority;
	});

	const handleUpdateTicket = async (ticketId: number, updates: Record<string, any>) => {
		setLoading(true);
		try {
			const response = await fetch(`/api/admin/support/${ticketId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			});

			if (response.ok) {
				const updatedTicket = await response.json();
				setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, ...updatedTicket } : t)));
				if (selectedTicket?.id === ticketId) {
					setSelectedTicket({ ...selectedTicket, ...updatedTicket });
				}
				toast.success("Ticket updated successfully");
			} else {
				toast.error("Failed to update ticket");
			}
		} catch (error) {
			toast.error("Error updating ticket");
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string | null) => {
		switch (status) {
			case "open":
				return "bg-blue-100 text-blue-800";
			case "in_progress":
				return "bg-yellow-100 text-yellow-800";
			case "resolved":
				return "bg-green-100 text-green-800";
			case "closed":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getPriorityColor = (priority: string | null) => {
		switch (priority) {
			case "urgent":
				return "bg-red-100 text-red-800";
			case "high":
				return "bg-orange-100 text-orange-800";
			case "medium":
				return "bg-yellow-100 text-yellow-800";
			case "low":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
				<button
					onClick={handleExport}
					disabled={exporting}
					className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
				>
					<Download className="h-5 w-5" />
					{exporting ? "Exporting..." : "Export"}
				</button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center">
						<div className="p-2 rounded-full bg-purple-100 text-purple-600">
							<MessageSquare className="h-5 w-5" />
						</div>
						<div className="ml-3">
							<p className="text-xs font-medium text-gray-500">Total</p>
							<p className="text-xl font-semibold text-gray-900">{stats.total}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center">
						<div className="p-2 rounded-full bg-blue-100 text-blue-600">
							<Clock className="h-5 w-5" />
						</div>
						<div className="ml-3">
							<p className="text-xs font-medium text-gray-500">Open</p>
							<p className="text-xl font-semibold text-gray-900">{stats.open}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center">
						<div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
							<HeadphonesIcon className="h-5 w-5" />
						</div>
						<div className="ml-3">
							<p className="text-xs font-medium text-gray-500">In Progress</p>
							<p className="text-xl font-semibold text-gray-900">{stats.inProgress}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center">
						<div className="p-2 rounded-full bg-green-100 text-green-600">
							<CheckCircle className="h-5 w-5" />
						</div>
						<div className="ml-3">
							<p className="text-xs font-medium text-gray-500">Resolved</p>
							<p className="text-xl font-semibold text-gray-900">{stats.resolved}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center">
						<div className="p-2 rounded-full bg-red-100 text-red-600">
							<AlertTriangle className="h-5 w-5" />
						</div>
						<div className="ml-3">
							<p className="text-xs font-medium text-gray-500">Urgent</p>
							<p className="text-xl font-semibold text-gray-900">{stats.urgent}</p>
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
							placeholder="Search tickets..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						/>
					</div>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
					>
						<option value="all">All Status</option>
						<option value="open">Open</option>
						<option value="in_progress">In Progress</option>
						<option value="resolved">Resolved</option>
						<option value="closed">Closed</option>
					</select>
					<select
						value={priorityFilter}
						onChange={(e) => setPriorityFilter(e.target.value)}
						className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
					>
						<option value="all">All Priority</option>
						<option value="urgent">Urgent</option>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
					</select>
				</div>
			</div>

			{/* Tickets List */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filteredTickets.map((ticket) => (
							<tr
								key={ticket.id}
								onClick={() => {
									setSelectedTicket(ticket);
									setAdminNotes(ticket.adminNotes || "");
								}}
								className="hover:bg-gray-50 cursor-pointer"
							>
								<td className="px-6 py-4">
									<div>
										<div className="text-sm font-medium text-gray-900">#{ticket.id}</div>
										<div className="text-sm text-gray-500 truncate max-w-xs">{ticket.subject}</div>
									</div>
								</td>
								<td className="px-6 py-4">
									<div className="text-sm text-gray-900">{ticket.user?.name || "Unknown"}</div>
									<div className="text-sm text-gray-500">{ticket.user?.email}</div>
								</td>
								<td className="px-6 py-4">
									<span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
										{ticket.status?.replace("_", " ")}
									</span>
								</td>
								<td className="px-6 py-4">
									<span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
										{ticket.priority}
									</span>
								</td>
								<td className="px-6 py-4 text-sm text-gray-500">{ticket.assignee?.name || "Unassigned"}</td>
								<td className="px-6 py-4 text-sm text-gray-500">
									{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "-"}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{filteredTickets.length === 0 && (
					<div className="text-center py-12">
						<MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
						<p className="mt-1 text-sm text-gray-500">No support tickets match your criteria.</p>
					</div>
				)}
			</div>

			{/* Ticket Detail Modal */}
			{selectedTicket && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex justify-between items-start mb-4">
								<div>
									<h2 className="text-xl font-bold text-gray-900">Ticket #{selectedTicket.id}</h2>
									<p className="text-gray-500">{selectedTicket.subject}</p>
								</div>
								<button
									onClick={() => setSelectedTicket(null)}
									className="text-gray-400 hover:text-gray-600"
								>
									<X className="h-6 w-6" />
								</button>
							</div>

							<div className="space-y-4">
								{/* Customer Info */}
								<div className="bg-gray-50 rounded-lg p-4">
									<div className="flex items-center gap-3 mb-2">
										<User className="h-5 w-5 text-gray-400" />
										<span className="font-medium text-gray-900">{selectedTicket.user?.name}</span>
									</div>
									<p className="text-sm text-gray-500 ml-8">{selectedTicket.user?.email}</p>
									{selectedTicket.order && (
										<div className="flex items-center gap-3 mt-2 ml-8">
											<Package className="h-4 w-4 text-gray-400" />
											<span className="text-sm text-gray-500">
												Order #{selectedTicket.order.id} - ₹{selectedTicket.order.totalAmount}
											</span>
										</div>
									)}
								</div>

								{/* Description */}
								<div>
									<h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
									<p className="text-gray-600 bg-gray-50 rounded-lg p-4">{selectedTicket.description}</p>
								</div>

								{/* Status & Priority */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
										<select
											value={selectedTicket.status || ""}
											onChange={(e) => handleUpdateTicket(selectedTicket.id, { status: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										>
											<option value="open">Open</option>
											<option value="in_progress">In Progress</option>
											<option value="resolved">Resolved</option>
											<option value="closed">Closed</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
										<select
											value={selectedTicket.priority || ""}
											onChange={(e) => handleUpdateTicket(selectedTicket.id, { priority: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										>
											<option value="low">Low</option>
											<option value="medium">Medium</option>
											<option value="high">High</option>
											<option value="urgent">Urgent</option>
										</select>
									</div>
								</div>

								{/* Assign To */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
									<select
										value={selectedTicket.assignee?.id || ""}
										onChange={(e) =>
											handleUpdateTicket(selectedTicket.id, { assignedTo: e.target.value ? parseInt(e.target.value) : null })
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
									>
										<option value="">Unassigned</option>
										{supportStaff.map((staff) => (
											<option
												key={staff.id}
												value={staff.id}
											>
												{staff.name} ({staff.role})
											</option>
										))}
									</select>
								</div>

								{/* Admin Notes */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
									<textarea
										value={adminNotes}
										onChange={(e) => setAdminNotes(e.target.value)}
										rows={4}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
										placeholder="Internal notes..."
									/>
									<button
										onClick={() => handleUpdateTicket(selectedTicket.id, { adminNotes })}
										disabled={loading}
										className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
									>
										{loading ? "Saving..." : "Save Notes"}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
