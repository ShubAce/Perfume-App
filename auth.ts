import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/src/index";
import { users } from "@/src/db/schema"; // Make sure to export 'accounts' in schema too!
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: DrizzleAdapter(db), // This automatically saves Google users to your DB
	session: { strategy: "jwt" }, // JWT is easier for simple apps than database sessions
	providers: [
		// 1. Google Provider
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
		// 2. Email/Password Provider
		Credentials({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			authorize: async (credentials, request) => {
				if (!credentials?.email || !credentials?.password) return null;

				// Find user
				const user = await db.query.users.findFirst({
					where: eq(users.email, credentials.email as string),
				});

				if (!user || !user.password) return null; // No user or user uses Google only

				// Verify Password
				const isValid = await bcrypt.compare(credentials.password as string, user.password);

				if (!isValid) return null;

				return { id: user.id.toString(), name: user.name, email: user.email, role: user.role || undefined };
			},
		}),
	],
	callbacks: {
		// Add 'role' and 'id' to the session so we can access it in the UI
		jwt({ token, user }) {
			if (user) {
				token.role = user.role;
				token.id = user.id;
			}
			return token;
		},
		session({ session, token }) {
			if (session.user) {
				session.user.role = token.role as string;
				session.user.id = token.id as string;
			}
			return session;
		},
	},
});
