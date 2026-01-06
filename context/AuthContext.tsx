"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface User {
	id: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
	role?: string;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data: session, status } = useSession();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		if (session?.user) {
			setUser({
				id: session.user.id || "",
				name: session.user.name,
				email: session.user.email,
				image: session.user.image,
				role: session.user.role,
			});
		} else {
			setUser(null);
		}
	}, [session]);

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading: status === "loading",
				isAuthenticated: !!session?.user,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
