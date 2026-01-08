import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/src/index";
import { users, accounts } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
	// Don't use DrizzleAdapter since our schema uses integer IDs (serial)
	// and the adapter requires string IDs. We handle user creation manually.
	session: { strategy: "jwt" },
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
		// Handle sign in - create user if they don't exist (for Google OAuth)
		async signIn({ user, account, profile }) {
			if (account?.provider === "google") {
				try {
					// Check if user exists by email
					let existingUser = await db.query.users.findFirst({
						where: eq(users.email, user.email!),
					});

					if (!existingUser) {
						// Create new user for Google sign-in
						const [newUser] = await db
							.insert(users)
							.values({
								name: user.name || "Google User",
								email: user.email!,
								image: user.image,
								emailVerified: new Date(),
							})
							.returning();
						existingUser = newUser;
					} else {
						// Update image if changed
						if (user.image && existingUser.image !== user.image) {
							await db.update(users).set({ image: user.image }).where(eq(users.id, existingUser.id));
						}
					}

					// Check if this Google account is already linked
					const existingAccount = await db.query.accounts.findFirst({
						where: and(eq(accounts.provider, account.provider), eq(accounts.providerAccountId, account.providerAccountId)),
					});

					if (!existingAccount) {
						// Link Google account to user
						await db.insert(accounts).values({
							userId: existingUser.id,
							type: account.type,
							provider: account.provider,
							providerAccountId: account.providerAccountId,
							access_token: account.access_token,
							refresh_token: account.refresh_token,
							expires_at: account.expires_at,
							token_type: account.token_type,
							scope: account.scope,
							id_token: account.id_token,
						});
					}

					// Store the database user ID for the JWT callback
					user.id = existingUser.id.toString();
					user.role = existingUser.role || "customer";

					return true;
				} catch (error) {
					console.error("Error during Google sign-in:", error);
					return false;
				}
			}
			return true;
		},
		// Add 'role' and 'id' to the JWT token
		async jwt({ token, user, account }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
			}
			// For Google sign-in, fetch the role from DB if not set
			if (account?.provider === "google" && !token.role) {
				const dbUser = await db.query.users.findFirst({
					where: eq(users.email, token.email!),
				});
				if (dbUser) {
					token.id = dbUser.id.toString();
					token.role = dbUser.role || "customer";
				}
			}
			return token;
		},
		// Add user info to the session
		session({ session, token }) {
			if (session.user) {
				session.user.role = token.role as string;
				session.user.id = token.id as string;
			}
			return session;
		},
	},
});
