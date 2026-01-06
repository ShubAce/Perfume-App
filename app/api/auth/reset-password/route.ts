import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { users, passwordResetTokens } from "@/src/db/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// GET - Validate token
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const token = searchParams.get("token");

		if (!token) {
			return NextResponse.json({ error: "Token is required" }, { status: 400 });
		}

		// Hash the token to compare with stored hash
		const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

		// Find valid token
		const resetToken = await db.query.passwordResetTokens.findFirst({
			where: and(eq(passwordResetTokens.token, hashedToken), gt(passwordResetTokens.expiresAt, new Date())),
		});

		if (!resetToken) {
			return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
		}

		return NextResponse.json({ valid: true });
	} catch (error) {
		console.error("Token validation error:", error);
		return NextResponse.json({ error: "Failed to validate token" }, { status: 500 });
	}
}

// POST - Reset password
export async function POST(request: NextRequest) {
	try {
		const { token, password } = await request.json();

		if (!token || !password) {
			return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
		}

		if (password.length < 8) {
			return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
		}

		// Hash the token to compare with stored hash
		const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

		// Find valid token
		const resetToken = await db.query.passwordResetTokens.findFirst({
			where: and(eq(passwordResetTokens.token, hashedToken), gt(passwordResetTokens.expiresAt, new Date())),
		});

		if (!resetToken) {
			return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
		}

		// Hash the new password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Update user's password
		await db.update(users).set({ password: hashedPassword }).where(eq(users.id, resetToken.userId));

		// Delete all reset tokens for this user
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, resetToken.userId));

		return NextResponse.json({
			success: true,
			message: "Password reset successfully",
		});
	} catch (error) {
		console.error("Password reset error:", error);
		return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
	}
}
