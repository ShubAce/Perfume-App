"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "./CartContext";
import { AuthProvider } from "./AuthContext";
import { PersonalizationProvider } from "./PersonalizationContext";
import { Toaster } from "sonner";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<SessionProvider>
			<AuthProvider>
				<PersonalizationProvider>
					<CartProvider>
						<Toaster
							position="top-center"
							richColors
						/>
						{children}
					</CartProvider>
				</PersonalizationProvider>
			</AuthProvider>
		</SessionProvider>
	);
}
