"use client";

import { signUp } from "@/app/actions/auth";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { Toaster, toast } from "sonner";

export default function SignupPage() {
	const [error, setError] = useState<string | null>(null);
	const [passwordStrength, setPasswordStrength] = useState(0);

	function checkPasswordStrength(password: string) {
		let strength = 0;
		if (password.length >= 8) strength++;
		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
		if (/\d/.test(password)) strength++;
		if (/[^a-zA-Z0-9]/.test(password)) strength++;
		return strength;
	}

	async function handleSubmit(formData: FormData) {
		const result = await signUp(formData);
		if (result?.error) {
			setError(result.error);
			toast.error(result.error);
		} else {
			toast.success("Account created successfully! Redirecting...");
		}
	}

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
										d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
									/>
								</svg>
							</div>
							<h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
							<p className="mt-2 text-sm text-gray-600">Join us and discover your signature scent</p>
						</div>

						{/* Form Card */}
						<div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
							<form
								className="space-y-5"
								action={handleSubmit}
							>
								{error && (
									<div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-lg flex items-start">
										<svg
											className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
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

								<div>
									<label
										htmlFor="name"
										className="block text-sm font-semibold text-gray-700 mb-2"
									>
										Full Name
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
													d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
												/>
											</svg>
										</div>
										<input
											id="name"
											name="name"
											type="text"
											required
											className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
											placeholder="Enter your full name"
										/>
									</div>
								</div>

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
											onChange={(e) => setPasswordStrength(checkPasswordStrength(e.target.value))}
											className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
											placeholder="Create a strong password"
										/>
									</div>
									{passwordStrength > 0 && (
										<div className="mt-2">
											<div className="flex gap-1">
												{[1, 2, 3, 4].map((level) => (
													<div
														key={level}
														className={`h-1.5 flex-1 rounded-full transition-all ${
															level <= passwordStrength
																? passwordStrength === 1
																	? "bg-red-500"
																	: passwordStrength === 2
																	? "bg-yellow-500"
																	: passwordStrength === 3
																	? "bg-blue-500"
																	: "bg-green-500"
																: "bg-gray-200"
														}`}
													/>
												))}
											</div>
											<p className="text-xs text-gray-500 mt-1">
												{passwordStrength === 1 && "Weak password"}
												{passwordStrength === 2 && "Fair password"}
												{passwordStrength === 3 && "Good password"}
												{passwordStrength === 4 && "Strong password"}
											</p>
										</div>
									)}
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
											d="M5 13l4 4L19 7"
										/>
									</svg>
									Create Account
								</button>
							</form>

							<div className="mt-6">
								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-gray-300"></div>
									</div>
									<div className="relative flex justify-center text-sm">
										<span className="px-4 bg-white text-gray-500 font-medium">Already a member?</span>
									</div>
								</div>

								<div className="mt-6 text-center">
									<Link
										href="/login"
										className="text-sm font-semibold text-black hover:text-gray-700 transition-colors inline-flex items-center"
									>
										Sign in to your account
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
