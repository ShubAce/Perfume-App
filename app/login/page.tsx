"use client";

import { loginWithGoogle, loginWithCredentials } from "@/app/actions/auth";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Toaster, toast } from "sonner";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	// Get callback URL from query params or sessionStorage
	const [callbackUrl, setCallbackUrl] = useState<string>("/");

	useEffect(() => {
		// Priority: query param > sessionStorage > default
		const queryCallback = searchParams.get("callbackUrl");
		const storedCallback = typeof window !== "undefined" ? sessionStorage.getItem("authCallbackUrl") : null;

		if (queryCallback) {
			setCallbackUrl(queryCallback);
			// Store it for persistence through auth flow
			sessionStorage.setItem("authCallbackUrl", queryCallback);
		} else if (storedCallback) {
			setCallbackUrl(storedCallback);
		}
	}, [searchParams]);

	// Handle Google sign in with callback URL
	const handleGoogleSignIn = async () => {
		if (isGoogleLoading) return;
		setIsGoogleLoading(true);

		const loadingToastId = toast.loading("Connecting to Google...");

		try {
			// Clear stored callback before redirect
			sessionStorage.removeItem("authCallbackUrl");
			await loginWithGoogle(callbackUrl);
			toast.dismiss(loadingToastId);
		} catch (err) {
			const message = (err as Error).message;
			if (message.includes("NEXT_REDIRECT")) {
				toast.dismiss(loadingToastId);
				toast.success("Welcome! Redirecting... 🎉");
				return;
			}
			toast.dismiss(loadingToastId);
			toast.error("Failed to connect to Google");
			setIsGoogleLoading(false);
		}
	};

	// Handle credentials login
	const handleCredentialsLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Prevent double submission
		if (isSubmitting) return;

		setIsSubmitting(true);
		setError(null);

		const loadingToastId = toast.loading("Signing in...");

		try {
			const formData = new FormData(e.currentTarget);
			// Add callback URL to form data for server action
			formData.append("callbackUrl", callbackUrl);

			// Clear stored callback before login
			sessionStorage.removeItem("authCallbackUrl");

			await loginWithCredentials(formData);

			// Success - show success toast
			toast.dismiss(loadingToastId);
			toast.success("Welcome back! 🎉");
		} catch (err) {
			const message = (err as Error).message;

			// NextAuth redirect throws an error - this is expected on success
			if (message.includes("NEXT_REDIRECT")) {
				toast.dismiss(loadingToastId);
				toast.success("Welcome back! 🎉");
				return;
			}

			// Actual error
			toast.dismiss(loadingToastId);
			setError("Invalid email or password");
			toast.error("Invalid email or password");
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Toaster
				position="top-center"
				richColors
			/>
			<div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-100 to-gray-50">
				<Navbar />

				<div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
					<div className="max-w-md w-full">
						{/* Header */}
						<div className="text-center mb-8">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white mb-4">
								<svg
									className="w-8 h-8"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
									/>
								</svg>
							</div>
							<h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
							<p className="mt-2 text-sm text-gray-600">Sign in to continue your fragrance journey</p>
						</div>

						{/* Form Card */}
						<div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
							{error && (
								<div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-lg flex items-start">
									<svg
										className="w-5 h-5 mr-2 shrink-0 mt-0.5"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clipRule="evenodd"
										/>
									</svg>
									<span>{error}</span>
								</div>
							)}

							{/* GOOGLE BUTTON */}
							<button
								type="button"
								onClick={handleGoogleSignIn}
								disabled={isGoogleLoading || isSubmitting}
								className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
							>
								{isGoogleLoading ? (
									<>
										<svg
											className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-700"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										Connecting...
									</>
								) : (
									<>
										<svg
											className="h-5 w-5 mr-2"
											viewBox="0 0 24 24"
										>
											<path
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
												fill="#4285F4"
											/>
											<path
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
												fill="#34A853"
											/>
											<path
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
												fill="#FBBC05"
											/>
											<path
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
												fill="#EA4335"
											/>
										</svg>
										Sign in with Google
									</>
								)}
							</button>

							<div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
								</div>
							</div>

							{/* EMAIL FORM */}
							<form
								className="space-y-5"
								onSubmit={handleCredentialsLogin}
							>
								<div>
									<label
										htmlFor="email"
										className="block text-sm font-semibold text-gray-700 mb-2"
									>
										Email Address
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<svg
												className="h-5 w-5 text-gray-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
												/>
											</svg>
										</div>
										<input
											id="email"
											name="email"
											type="email"
											required
											disabled={isSubmitting}
											className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
											placeholder="you@example.com"
										/>
									</div>
								</div>

								<div>
									<label
										htmlFor="password"
										className="block text-sm font-semibold text-gray-700 mb-2"
									>
										Password
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<svg
												className="h-5 w-5 text-gray-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
												/>
											</svg>
										</div>
										<input
											id="password"
											name="password"
											type="password"
											required
											disabled={isSubmitting}
											className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
											placeholder="Enter your password"
										/>
									</div>
									{/* Forgot Password Link - always visible, highlighted on error */}
									<div className="flex justify-end mt-2">
										<Link
											href="/forgot-password"
											className={`text-sm font-medium transition-colors ${
												error ? "text-purple-600 hover:text-purple-700 animate-pulse" : "text-gray-500 hover:text-purple-600"
											}`}
										>
											Forgot password?
										</Link>
									</div>
								</div>

								<button
									type="submit"
									disabled={isSubmitting || isGoogleLoading}
									className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
								>
									{isSubmitting ? (
										<>
											<svg
												className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												/>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												/>
											</svg>
											Signing In...
										</>
									) : (
										<>
											<svg
												className="w-5 h-5 mr-2"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
												/>
											</svg>
											Sign In
										</>
									)}
								</button>
							</form>

							<div className="mt-6">
								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-gray-300"></div>
									</div>
									<div className="relative flex justify-center text-sm">
										<span className="px-4 bg-white text-gray-500 font-medium">New to our store?</span>
									</div>
								</div>

								<div className="mt-6 text-center">
									<Link
										href={`/signup${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
										className="text-sm font-semibold text-black hover:text-gray-700 transition-colors inline-flex items-center"
									>
										Create a new account
										<svg
											className="w-4 h-4 ml-1"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
