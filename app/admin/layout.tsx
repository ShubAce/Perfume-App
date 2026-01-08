"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
	LayoutDashboard,
	Package,
	BarChart3,
	Users,
	ShoppingBag,
	Warehouse,
	Tag,
	DollarSign,
	HeadphonesIcon,
	FileText,
	Settings,
	ChevronLeft,
	ChevronRight,
	LogOut,
	Menu,
	X,
	Shield,
	Bell,
} from "lucide-react";
import { Toaster } from "sonner";

interface NavItem {
	label: string;
	href: string;
	icon: React.ReactNode;
	module: string;
	badge?: number;
}

const navItems: NavItem[] = [
	{ label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" />, module: "dashboard" },
	{ label: "Orders", href: "/admin/orders", icon: <Package className="h-5 w-5" />, module: "orders" },
	{ label: "Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-5 w-5" />, module: "analytics" },
	{ label: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" />, module: "users" },
	{ label: "Products", href: "/admin/products", icon: <ShoppingBag className="h-5 w-5" />, module: "products" },
	{ label: "Inventory", href: "/admin/inventory", icon: <Warehouse className="h-5 w-5" />, module: "inventory" },
	{ label: "Promotions", href: "/admin/promotions", icon: <Tag className="h-5 w-5" />, module: "promotions" },
	{ label: "Finance", href: "/admin/finance", icon: <DollarSign className="h-5 w-5" />, module: "finance" },
	{ label: "Support", href: "/admin/support", icon: <HeadphonesIcon className="h-5 w-5" />, module: "support" },
	{ label: "Audit Logs", href: "/admin/audit-logs", icon: <FileText className="h-5 w-5" />, module: "logs" },
	{ label: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" />, module: "settings" },
];

// Role permissions (simplified for client-side)
const ROLE_MODULES: Record<string, string[]> = {
	super_admin: ["*"],
	admin: ["dashboard", "orders", "analytics", "users", "products", "inventory", "promotions", "support", "logs"],
	operations: ["dashboard", "orders", "inventory", "support"],
	support: ["dashboard", "orders", "support"],
	marketing: ["dashboard", "analytics", "promotions"],
};

function hasModuleAccess(role: string | undefined, module: string): boolean {
	if (!role) return false;
	const modules = ROLE_MODULES[role];
	if (!modules) return false;
	return modules.includes("*") || modules.includes(module);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	const userRole = session?.user?.role;

	// Redirect non-admin users
	useEffect(() => {
		if (status === "loading") return;

		if (!session?.user) {
			router.push("/login?callbackUrl=/admin");
			return;
		}

		const adminRoles = ["super_admin", "admin", "operations", "support", "marketing"];
		if (!adminRoles.includes(userRole || "")) {
			router.push("/?error=unauthorized");
		}
	}, [session, status, router, userRole]);

	// Loading state
	if (status === "loading") {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
			</div>
		);
	}

	// Not authorized
	if (!session?.user || !["super_admin", "admin", "operations", "support", "marketing"].includes(userRole || "")) {
		return null;
	}

	const filteredNavItems = navItems.filter((item) => hasModuleAccess(userRole, item.module));

	const getRoleBadge = (role: string) => {
		const badges: Record<string, { color: string; label: string }> = {
			super_admin: { color: "bg-red-100 text-red-700", label: "Super Admin" },
			admin: { color: "bg-purple-100 text-purple-700", label: "Admin" },
			operations: { color: "bg-blue-100 text-blue-700", label: "Operations" },
			support: { color: "bg-green-100 text-green-700", label: "Support" },
			marketing: { color: "bg-amber-100 text-amber-700", label: "Marketing" },
		};
		return badges[role] || { color: "bg-gray-100 text-gray-700", label: role };
	};

	const roleBadge = getRoleBadge(userRole || "");

	return (
		<div className="min-h-screen bg-gray-100">
			<Toaster
				position="top-right"
				richColors
			/>

			{/* Mobile Header */}
			<div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
				<button
					onClick={() => setMobileOpen(true)}
					className="p-2 rounded-lg hover:bg-gray-100"
				>
					<Menu className="h-6 w-6 text-gray-600" />
				</button>
				<div className="flex items-center gap-2">
					<Shield className="h-5 w-5 text-purple-600" />
					<span className="font-bold text-gray-900">Admin</span>
				</div>
				<div className="w-10" />
			</div>

			{/* Mobile Sidebar Overlay */}
			{mobileOpen && (
				<div className="lg:hidden fixed inset-0 z-50">
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => setMobileOpen(false)}
					/>
					<div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
						<div className="p-4 border-b border-gray-200 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Shield className="h-6 w-6 text-purple-600" />
								<span className="font-bold text-gray-900">Admin Console</span>
							</div>
							<button
								onClick={() => setMobileOpen(false)}
								className="p-2 rounded-lg hover:bg-gray-100"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<nav className="p-4 space-y-1">
							{filteredNavItems.map((item) => {
								const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setMobileOpen(false)}
										className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
											isActive ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
										}`}
									>
										{item.icon}
										<span className="font-medium">{item.label}</span>
									</Link>
								);
							})}
						</nav>
					</div>
				</div>
			)}

			{/* Desktop Sidebar */}
			<aside
				className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
					collapsed ? "w-20" : "w-64"
				}`}
			>
				{/* Logo */}
				<div className={`p-4 border-b border-gray-200 flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
					<Shield className="h-8 w-8 text-purple-600 shrink-0" />
					{!collapsed && (
						<div>
							<h1 className="font-bold text-gray-900">Admin Console</h1>
							<span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge.color}`}>{roleBadge.label}</span>
						</div>
					)}
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-4 space-y-1 overflow-y-auto">
					{filteredNavItems.map((item) => {
						const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
						return (
							<Link
								key={item.href}
								href={item.href}
								title={collapsed ? item.label : undefined}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${collapsed ? "justify-center" : ""} ${
									isActive ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
								}`}
							>
								{item.icon}
								{!collapsed && <span className="font-medium">{item.label}</span>}
								{!collapsed && item.badge && (
									<span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
								)}
							</Link>
						);
					})}
				</nav>

				{/* Collapse Toggle */}
				<div className="p-4 border-t border-gray-200">
					<button
						onClick={() => setCollapsed(!collapsed)}
						className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
					>
						{collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
						{!collapsed && <span className="text-sm">Collapse</span>}
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className={`transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"} pt-16 lg:pt-0`}>
				{/* Top Bar */}
				<header className="hidden lg:flex sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">
							{filteredNavItems.find((item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)))
								?.label || "Dashboard"}
						</h2>
					</div>
					<div className="flex items-center gap-4">
						<button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
							<Bell className="h-5 w-5" />
							<span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
						</button>
						<div className="flex items-center gap-3">
							<div className="text-right">
								<p className="text-sm font-medium text-gray-900">{session.user.name}</p>
								<p className="text-xs text-gray-500">{session.user.email}</p>
							</div>
							{session.user.image ? (
								<img
									src={session.user.image}
									alt=""
									className="h-10 w-10 rounded-full"
								/>
							) : (
								<div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
									<span className="text-purple-700 font-semibold">{session.user.name?.charAt(0).toUpperCase()}</span>
								</div>
							)}
						</div>
					</div>
				</header>

				{/* Page Content */}
				<div className="p-4 lg:p-6">{children}</div>
			</main>
		</div>
	);
}
