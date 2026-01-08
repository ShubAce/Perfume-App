import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { supportTickets } from "@/src/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { validateAdminAccess } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
	try {
		const { authorized, error } = await validateAdminAccess("support", "view");

		if (!authorized) {
			return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");
		const priority = searchParams.get("priority");

		// Build conditions
		const conditions = [];
		if (status && status !== "all") {
			conditions.push(eq(supportTickets.status, status));
		}
		if (priority && priority !== "all") {
			conditions.push(eq(supportTickets.priority, priority));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Fetch tickets with relations
		const ticketsList = await db.query.supportTickets.findMany({
			where: whereClause,
			with: {
				user: true,
				order: true,
				assignee: true,
			},
			orderBy: desc(supportTickets.createdAt),
		});

		// Generate CSV
		const headers = [
			"Ticket ID",
			"Subject",
			"Customer Name",
			"Customer Email",
			"Status",
			"Priority",
			"Assigned To",
			"Order ID",
			"Created At",
			"Updated At",
		];

		const rows = ticketsList.map((ticket) => {
			return [
				ticket.id,
				`"${ticket.subject.replace(/"/g, '""')}"`,
				`"${(ticket.user?.name || "Unknown").replace(/"/g, '""')}"`,
				ticket.user?.email || "",
				ticket.status || "open",
				ticket.priority || "medium",
				ticket.assignee?.name || "Unassigned",
				ticket.orderId || "",
				ticket.createdAt ? new Date(ticket.createdAt).toISOString() : "",
				ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : "",
			].join(",");
		});

		const csv = [headers.join(","), ...rows].join("\n");

		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="support-tickets-${new Date().toISOString().split("T")[0]}.csv"`,
			},
		});
	} catch (error) {
		console.error("Error exporting support tickets:", error);
		return NextResponse.json({ error: "Failed to export support tickets" }, { status: 500 });
	}
}
