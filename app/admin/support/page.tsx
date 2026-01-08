import { db } from "@/src/index";
import { supportTickets, users } from "@/src/db/schema";
import { validateAdminAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { desc, eq, count } from "drizzle-orm";
import SupportClient from "./SupportClient";

export default async function SupportPage() {
	const { authorized } = await validateAdminAccess("support");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/support");
	}

	// Fetch all support tickets with relations
	const tickets = await db.query.supportTickets.findMany({
		with: {
			user: true,
			order: true,
			assignee: true,
		},
		orderBy: desc(supportTickets.createdAt),
	});

	// Fetch support staff for assignment
	const supportStaff = await db.query.users.findMany({
		where: (users, { or, eq }) => or(eq(users.role, "support"), eq(users.role, "admin"), eq(users.role, "super_admin")),
	});

	// Calculate stats
	const stats = {
		total: tickets.length,
		open: tickets.filter((t) => t.status === "open").length,
		inProgress: tickets.filter((t) => t.status === "in_progress").length,
		resolved: tickets.filter((t) => t.status === "resolved").length,
		urgent: tickets.filter((t) => t.priority === "urgent").length,
	};

	return (
		<SupportClient
			tickets={tickets}
			supportStaff={supportStaff}
			stats={stats}
		/>
	);
}
