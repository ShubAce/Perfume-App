import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { auditLogs } from "@/src/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
	try {
		const { authorized, error } = await validateAdminAccess("logs", "view");

		if (!authorized) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const action = searchParams.get("action");

		// Build conditions
		const conditions = [];
		if (action && action !== "all") {
			conditions.push(eq(auditLogs.action, action));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Fetch audit logs with relations
		const logsList = await db.query.auditLogs.findMany({
			where: whereClause,
			with: {
				admin: true,
			},
			orderBy: desc(auditLogs.createdAt),
			limit: 1000, // Limit export to last 1000 records
		});

		// Generate CSV
		const headers = [
			"Log ID",
			"Admin Name",
			"Admin Email",
			"Action",
			"Entity Type",
			"Entity ID",
			"IP Address",
			"Details",
			"Created At",
		];

		const rows = logsList.map((log) => {
			const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : "";
			return [
				log.id,
				`"${(log.admin?.name || "System").replace(/"/g, '""')}"`,
				log.admin?.email || "",
				log.action,
				log.entityType || "",
				log.entityId || "",
				log.ipAddress || "",
				`"${details}"`,
				log.createdAt ? new Date(log.createdAt).toISOString() : "",
			].join(",");
		});

		const csv = [headers.join(","), ...rows].join("\n");

		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
			},
		});
	} catch (error) {
		console.error("Error exporting audit logs:", error);
		return NextResponse.json({ error: "Failed to export audit logs" }, { status: 500 });
	}
}
