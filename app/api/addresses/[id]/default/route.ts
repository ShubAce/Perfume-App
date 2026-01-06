import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { addresses } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

// PUT - Set address as default
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const addressId = parseInt(id);
		const userId = parseInt(session.user.id);

		// Unset all other defaults
		await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));

		// Set this address as default
		const [updated] = await db
			.update(addresses)
			.set({ isDefault: true })
			.where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
			.returning();

		if (!updated) {
			return NextResponse.json({ error: "Address not found" }, { status: 404 });
		}

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Error setting default address:", error);
		return NextResponse.json({ error: "Failed to set default address" }, { status: 500 });
	}
}
