import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/index";
import { addresses } from "@/src/db/schema";
import { eq } from "drizzle-orm";

// GET - Fetch all addresses for user
export async function GET() {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = parseInt(session.user.id);
		const userAddresses = await db.query.addresses.findMany({
			where: eq(addresses.userId, userId),
			orderBy: (addresses, { desc }) => [desc(addresses.isDefault)],
		});

		return NextResponse.json(userAddresses);
	} catch (error) {
		console.error("Error fetching addresses:", error);
		return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
	}
}

// POST - Create new address
export async function POST(req: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = parseInt(session.user.id);
		const body = await req.json();
		const { label, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = body;

		// If this is marked as default, unset all other defaults
		if (isDefault) {
			await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
		}

		const [newAddress] = await db
			.insert(addresses)
			.values({
				userId,
				label: label || "Home",
				fullName,
				phone,
				addressLine1,
				addressLine2,
				city,
				state,
				postalCode,
				country: country || "US",
				isDefault: isDefault || false,
			})
			.returning();

		return NextResponse.json(newAddress, { status: 201 });
	} catch (error) {
		console.error("Error creating address:", error);
		return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
	}
}
