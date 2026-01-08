import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Admin role hierarchy
export const ADMIN_ROLES = {
	SUPER_ADMIN: "super_admin",
	ADMIN: "admin",
	OPERATIONS: "operations",
	SUPPORT: "support",
	MARKETING: "marketing",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

// Role permissions matrix
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
	super_admin: ["*"], // Full access
	admin: ["dashboard", "orders", "analytics", "users", "products", "inventory", "promotions", "support", "logs"],
	operations: ["dashboard", "orders", "inventory", "support"],
	support: ["dashboard", "orders:view", "users:view", "support"],
	marketing: ["dashboard:view", "analytics:view", "promotions"],
};

// Check if user has required role
export function hasAdminRole(userRole: string | null | undefined): boolean {
	if (!userRole) return false;
	return Object.values(ADMIN_ROLES).includes(userRole as AdminRole);
}

// Check if role has permission for a specific module
export function hasPermission(role: AdminRole, module: string, action: "view" | "edit" = "view"): boolean {
	const permissions = ROLE_PERMISSIONS[role];
	if (!permissions) return false;

	// Super admin has all permissions
	if (permissions.includes("*")) return true;

	// Check for specific permission
	if (permissions.includes(module)) return true;
	if (permissions.includes(`${module}:${action}`)) return true;
	if (action === "view" && permissions.includes(`${module}:view`)) return true;

	return false;
}

// Get role hierarchy level (higher = more permissions)
export function getRoleLevel(role: AdminRole): number {
	const levels: Record<AdminRole, number> = {
		super_admin: 100,
		admin: 80,
		operations: 60,
		support: 40,
		marketing: 20,
	};
	return levels[role] || 0;
}

// Check if current role can modify target role
export function canModifyRole(currentRole: AdminRole, targetRole: AdminRole): boolean {
	return getRoleLevel(currentRole) > getRoleLevel(targetRole);
}

// Server-side role validation helper
export async function validateAdminAccess(
	requiredModule?: string,
	requiredAction: "view" | "edit" = "view"
): Promise<{
	authorized: boolean;
	session: any;
	user: any;
	role: AdminRole | null;
	error?: string;
}> {
	const session = await auth();

	if (!session?.user) {
		return { authorized: false, session: null, user: null, role: null, error: "Not authenticated" };
	}

	const userRole = session.user.role as AdminRole | undefined;

	if (!hasAdminRole(userRole)) {
		return { authorized: false, session, user: session.user, role: null, error: "Not an admin" };
	}

	if (requiredModule && !hasPermission(userRole as AdminRole, requiredModule, requiredAction)) {
		return {
			authorized: false,
			session,
			user: session.user,
			role: userRole as AdminRole,
			error: `No permission for ${requiredModule}:${requiredAction}`,
		};
	}

	return { authorized: true, session, user: session.user, role: userRole as AdminRole };
}
