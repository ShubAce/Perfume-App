"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Toaster, toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (isSubmitting) return;

		setIsSubmitting(true);

		const loadingToastId = toast.loading("Sending reset link...");

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			toast.dismiss(loadingToastId);

			if (response.ok) {
				setIsSuccess(true);
				toast.success("Reset link sent! Check your email.");
			} else {
				toast.error(data.error || "Failed to send reset link");
				setIsSubmitting(false);
			}
		} catch (error) {
			toast.dismiss(loadingToastId);
			toast.error("Something went wrong. Please try again.");
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
						{/* Back Link */}
						<Link
							href="/login"
							className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors mb-8"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Login
						</Link>

						{/* Header */}
						<div className="text-center mb-8">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
								<Mail className="w-8 h-8" />
							</div>
							<h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
							<p className="mt-2 text-sm text-gray-600">No worries! Enter your email and we&apos;ll send you a reset link.</p>
						</div>

						{/* Form Card */}
						<div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
							{isSuccess ? (
								// Success State
								<div className="text-center py-6">
									<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
										<CheckCircle className="w-8 h-8" />
									</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h3>
									<p className="text-gray-600 mb-6">
										We&apos;ve sent a password reset link to <strong className="text-gray-900">{email}</strong>
									</p>
									<p className="text-sm text-gray-500 mb-6">
										Didn&apos;t receive the email? Check your spam folder or{" "}
										<button
											onClick={() => {
												setIsSuccess(false);
												setIsSubmitting(false);
											}}
											className="text-purple-600 hover:underline font-medium"
										>
											try again
										</button>
									</p>
									<Link
										href="/login"
										className="inline-flex items-center justify-center w-full py-3 px-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors"
									>
										Back to Login
									</Link>
								</div>
							) : (
								// Form State
								<form
									onSubmit={handleSubmit}
									className="space-y-5"
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
												<Mail className="h-5 w-5 text-gray-400" />
											</div>
											<input
												id="email"
												name="email"
												type="email"
												required
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												disabled={isSubmitting}
												className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
												placeholder="you@example.com"
											/>
										</div>
									</div>

									<button
										type="submit"
										disabled={isSubmitting}
										className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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
												Sending...
											</>
										) : (
											"Send Reset Link"
										)}
									</button>
								</form>
							)}

							{!isSuccess && (
								<div className="mt-6 text-center">
									<p className="text-sm text-gray-500">
										Remember your password?{" "}
										<Link
											href="/login"
											className="text-purple-600 hover:underline font-medium"
										>
											Sign in
										</Link>
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
