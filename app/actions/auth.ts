"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/src/index";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginWithGoogle() {
	await signIn("google", { redirectTo: "/" });
}

export async function loginWithCredentials(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	try {
		await signIn("credentials", {
			email,
			password,
			redirectTo: "/",
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

export async function signUp(formData: FormData) {
	const name = formData.get("name") as string;
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

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

	// 4. Redirect to Login (so they can sign in with their new account)
	redirect("/login");
}
