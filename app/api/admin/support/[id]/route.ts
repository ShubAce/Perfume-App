import { NextResponse } from "next/server";
import { db } from "@/src/index";
import { supportTickets } from "@/src/db/schema";
import { validateAdminAccess } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { authorized } = await validateAdminAccess("support");
	if (!authorized) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const ticketId = parseInt(id);
		const body = await request.json();

		const updateData: any = {
			updatedAt: new Date(),
		};

		if (body.status !== undefined) updateData.status = body.status;
		if (body.priority !== undefined) updateData.priority = body.priority;
		if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
		if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;

		const [updatedTicket] = await db.update(supportTickets).set(updateData).where(eq(supportTickets.id, ticketId)).returning();

		return NextResponse.json(updatedTicket);
	} catch (error) {
		console.error("Error updating ticket:", error);
		return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
	}
}
