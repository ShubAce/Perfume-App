import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { users, passwordResetTokens } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		// Find user by email
		const user = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase()),
		});

		// Always return success even if user not found (security best practice)
		// This prevents email enumeration attacks
		if (!user) {
			// Still return success to prevent user enumeration
			return NextResponse.json({
				success: true,
				message: "If an account exists with this email, you will receive a password reset link.",
			});
		}

		// Generate a secure reset token
		const resetToken = crypto.randomBytes(32).toString("hex");
		const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

		// Check if passwordResetTokens table exists and store token
		try {
			// Delete any existing tokens for this user
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

			// Store new token
			await db.insert(passwordResetTokens).values({
				userId: user.id,
				token: hashedToken,
				expiresAt,
			});
		} catch (dbError) {
			// If table doesn't exist, log but still return success
			console.log("Password reset tokens table may not exist:", dbError);
			// You would need to create a migration to add this table
		}

		// In production, you would send an email here with the reset link:
		// const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
		// await sendPasswordResetEmail(user.email, resetUrl);

		// For now, log the token (in production, remove this!)
		console.log(`Password reset requested for ${email}`);
		console.log(`Reset token (for development): ${resetToken}`);

		return NextResponse.json({
			success: true,
			message: "If an account exists with this email, you will receive a password reset link.",
			// Remove this in production - only for development testing
			...(process.env.NODE_ENV === "development" && { devToken: resetToken }),
		});
	} catch (error) {
		console.error("Forgot password error:", error);
		return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
	}
}
