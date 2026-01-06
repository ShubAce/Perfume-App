import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Protected routes that require authentication
const protectedRoutes = ["/checkout", "/profile", "/orders"];

// Routes that should redirect if already authenticated
const authRoutes = ["/login", "/signup"];

export default async function middleware(request: NextRequest) {
	const session = await auth();
	const { pathname, searchParams } = request.nextUrl;

	// Check if the route is protected
	const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

	// Check if it's an auth route
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

	// Redirect to login if accessing protected route without auth
	if (isProtectedRoute && !session) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Redirect if already authenticated and trying to access auth routes
	// Use callbackUrl if present, otherwise default to home
	if (isAuthRoute && session) {
		const callbackUrl = searchParams.get("callbackUrl");
		const redirectTo = callbackUrl || "/";
		return NextResponse.redirect(new URL(redirectTo, request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/checkout/:path*", "/profile/:path*", "/orders/:path*", "/login", "/signup"],
};
