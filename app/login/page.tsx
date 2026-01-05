"use client";

import { loginWithGoogle, loginWithCredentials } from "@/app/actions/auth";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Toaster, toast } from "sonner";
import { useState } from "react";

export default function LoginPage() {
	const [error, setError] = useState<string | null>(null);

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
							<form action={loginWithGoogle}>
								<button
									type="submit"
									className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
								>
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
								</button>
							</form>

							<div className="relative my-6\">
								<div className="absolute inset-0 flex items-center\">
									<div className="w-full border-t border-gray-300"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-4 bg-white text-gray-500 font-medium    ">Or continue with email</span>
								</div>
							</div>

							{/* EMAIL FORM */}
							<form
								className="space-y-5"
								onSubmit={async (e) => {
									e.preventDefault();
									const formData = new FormData(e.currentTarget);
									try {
										toast.loading("Signing in...");
										await loginWithCredentials(formData);
										toast.success("Welcome back! Redirecting...");
									} catch (error) {
										const message = (error as Error).message;
										if (!message.includes("NEXT_REDIRECT")) {
											setError("Invalid email or password");
											toast.error("Invalid email or password");
										}
									}
								}}
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
											className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
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
											className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
											placeholder="Enter your password"
										/>
									</div>
								</div>

								<button
									type="submit"
									className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all transform hover:scale-[1.02] active:scale-[0.98]"
								>
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
										href="/signup"
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
