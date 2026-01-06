"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/src/index";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Login with Google OAuth
 * @param callbackUrl - URL to redirect after successful login
 */
export async function loginWithGoogle(callbackUrl?: string) {
	const redirectTo = callbackUrl || "/";
	await signIn("google", { redirectTo });
}

/**
 * Login with email/password credentials
 * @param formData - Form data containing email, password, and optional callbackUrl
 */
export async function loginWithCredentials(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const callbackUrl = formData.get("callbackUrl") as string;
	const redirectTo = callbackUrl || "/";

	try {
		await signIn("credentials", {
			email,
			password,
			redirectTo,
		});
	} catch (error) {
		// NextAuth throws a redirect error that we must re-throw
		if ((error as Error).message.includes("NEXT_REDIRECT")) {
			throw error;
		}
		throw new Error("Invalid email or password");
	}
}

export async function logout() {
	await signOut({ redirectTo: "/" });
}

/**
 * Sign up a new user and automatically log them in
 * @param formData - Form data containing name, email, password, and optional callbackUrl
 * @returns Error object if failed, otherwise redirects to callbackUrl
 */
export async function signUp(formData: FormData) {
	const name = formData.get("name") as string;
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const callbackUrl = formData.get("callbackUrl") as string;
	const redirectTo = callbackUrl || "/";

	if (!name || !email || !password) {
		return { error: "All fields are required" };
	}

	// 1. Check if user already exists
	const existingUser = await db.query.users.findFirst({
		where: eq(users.email, email),
	});

	if (existingUser) {
		return { error: "Email already in use" };
	}

	// 2. Hash Password
	const hashedPassword = await bcrypt.hash(password, 10);

	// 3. Create User
	await db.insert(users).values({
		name,
		email,
		password: hashedPassword,
		role: "customer",
	});

	// 4. Auto-login: Sign in the user immediately after account creation
	// This creates the session and sets auth cookies automatically
	try {
		await signIn("credentials", {
			email,
			password,
			redirectTo,
		});
	} catch (error) {
		// NextAuth throws a redirect error on success - this is expected
		if ((error as Error).message.includes("NEXT_REDIRECT")) {
			throw error;
		}
		// If sign-in fails after signup, return error (shouldn't happen normally)
		return { error: "Account created but login failed. Please sign in manually." };
	}
}
