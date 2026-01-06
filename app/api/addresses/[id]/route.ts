import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { addresses } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

// GET - Fetch single address
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const addressId = parseInt(id);
		const userId = parseInt(session.user.id);

		const address = await db.query.addresses.findFirst({
			where: and(eq(addresses.id, addressId), eq(addresses.userId, userId)),
		});

		if (!address) {
			return NextResponse.json({ error: "Address not found" }, { status: 404 });
		}

		return NextResponse.json(address);
	} catch (error) {
		console.error("Error fetching address:", error);
		return NextResponse.json({ error: "Failed to fetch address" }, { status: 500 });
	}
}

// PUT - Update address
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const addressId = parseInt(id);
		const userId = parseInt(session.user.id);
		const body = await req.json();

		// If setting as default, unset all other defaults first
		if (body.isDefault) {
			await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
		}

		const [updated] = await db
			.update(addresses)
			.set({
				label: body.label,
				fullName: body.fullName,
				phone: body.phone,
				addressLine1: body.addressLine1,
				addressLine2: body.addressLine2,
				city: body.city,
				state: body.state,
				postalCode: body.postalCode,
				country: body.country,
				isDefault: body.isDefault,
			})
			.where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
			.returning();

		if (!updated) {
			return NextResponse.json({ error: "Address not found" }, { status: 404 });
		}

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Error updating address:", error);
		return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
	}
}

// DELETE - Remove address
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const addressId = parseInt(id);
		const userId = parseInt(session.user.id);

		const [deleted] = await db
			.delete(addresses)
			.where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
			.returning();

		if (!deleted) {
			return NextResponse.json({ error: "Address not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting address:", error);
		return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
	}
}
