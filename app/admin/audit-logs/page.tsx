import { db } from "@/src/index";
import { auditLogs } from "@/src/db/schema";
import { desc, eq, and, count } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AuditLogsClient from "./AuditLogsClient";

export default async function AdminAuditLogsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
	const { authorized } = await validateAdminAccess("settings");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/audit-logs");
	}

	const params = await searchParams;
	const page = typeof params.page === "string" ? parseInt(params.page) : 1;
	const limit = 50;
	const offset = (page - 1) * limit;
	const action = typeof params.action === "string" ? params.action : undefined;
	const search = typeof params.search === "string" ? params.search : undefined;

	// Build where conditions
	const conditions = [];
	if (action && action !== "all") {
		conditions.push(eq(auditLogs.action, action));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Fetch audit logs with pagination
	const [logsList, totalCount, actionCounts] = await Promise.all([
		db.query.auditLogs.findMany({
			where: whereClause,
			with: {
				admin: true,
			},
			orderBy: desc(auditLogs.createdAt),
			limit,
			offset,
		}),
		db
			.select({ count: count() })
			.from(auditLogs)
			.where(whereClause)
			.then((r) => r[0]?.count || 0),
		db
			.select({
				action: auditLogs.action,
				count: count(),
			})
			.from(auditLogs)
			.groupBy(auditLogs.action),
	]);

	const formattedLogs = logsList.map((log) => ({
		id: log.id,
		adminId: log.adminId,
		adminName: log.admin?.name || "System",
		adminEmail: log.admin?.email || "N/A",
		action: log.action,
		entityType: log.entityType,
		entityId: log.entityId,
		details: log.details,
		ipAddress: log.ipAddress,
		createdAt: log.createdAt?.toISOString(),
	}));

	const actionCountsMap = actionCounts.reduce((acc, item) => {
		acc[item.action || "unknown"] = item.count;
		return acc;
	}, {} as Record<string, number>);

	return (
		<AuditLogsClient
			logs={formattedLogs}
			totalCount={totalCount}
			currentPage={page}
			pageSize={limit}
			actionCounts={actionCountsMap}
			currentAction={action}
			currentSearch={search}
		/>
	);
}
