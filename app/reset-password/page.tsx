"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Toaster, toast } from "sonner";
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
	const [passwordStrength, setPasswordStrength] = useState(0);

	// Validate token on mount
	useEffect(() => {
		if (!token) {
			setIsValidToken(false);
			return;
		}

		const validateToken = async () => {
			try {
				const response = await fetch(`/api/auth/reset-password?token=${token}`);
				setIsValidToken(response.ok);
			} catch {
				setIsValidToken(false);
			}
		};

		validateToken();
	}, [token]);

	// Password strength checker
	useEffect(() => {
		let strength = 0;
		if (password.length >= 8) strength++;
		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
		if (/\d/.test(password)) strength++;
		if (/[^a-zA-Z0-9]/.test(password)) strength++;
		setPasswordStrength(strength);
	}, [password]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			toast.error("Passwords don't match");
			return;
		}

		if (password.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		if (isSubmitting) return;

		setIsSubmitting(true);

		const loadingToastId = toast.loading("Resetting password...");

		try {
			const response = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password }),
			});

			const data = await response.json();

			toast.dismiss(loadingToastId);

			if (response.ok) {
				setIsSuccess(true);
				toast.success("Password reset successfully!");
				// Redirect to login after 3 seconds
				setTimeout(() => {
					router.push("/login");
				}, 3000);
			} else {
				toast.error(data.error || "Failed to reset password");
				setIsSubmitting(false);
			}
		} catch (error) {
			toast.dismiss(loadingToastId);
			toast.error("Something went wrong. Please try again.");
			setIsSubmitting(false);
		}
	};

	// Loading state while validating token
	if (isValidToken === null) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
			</div>
		);
	}

	// Invalid or expired token
	if (!isValidToken) {
		return (
			<div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center">
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</div>
				<h3 className="text-xl font-semibold text-gray-900 mb-2">Invalid or Expired Link</h3>
				<p className="text-gray-600 mb-6">This password reset link is invalid or has expired. Please request a new one.</p>
				<Link
					href="/forgot-password"
					className="inline-flex items-center justify-center w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
				>
					Request New Link
				</Link>
			</div>
		);
	}

	// Success state
	if (isSuccess) {
		return (
			<div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center">
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
					<CheckCircle className="w-8 h-8" />
				</div>
				<h3 className="text-xl font-semibold text-gray-900 mb-2">Password Reset!</h3>
				<p className="text-gray-600 mb-6">Your password has been successfully reset. Redirecting to login...</p>
				<Link
					href="/login"
					className="inline-flex items-center justify-center w-full py-3 px-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors"
				>
					Go to Login
				</Link>
			</div>
		);
	}

	const strengthColors = ["bg-gray-200", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
	const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

	return (
		<div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
			<form
				onSubmit={handleSubmit}
				className="space-y-5"
			>
				<div>
					<label
						htmlFor="password"
						className="block text-sm font-semibold text-gray-700 mb-2"
					>
						New Password
					</label>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock className="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="password"
							type={showPassword ? "text" : "password"}
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={isSubmitting}
							className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-100"
							placeholder="Enter new password"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute inset-y-0 right-0 pr-3 flex items-center"
						>
							{showPassword ? (
								<EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
							) : (
								<Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
							)}
						</button>
					</div>
					{/* Password Strength Indicator */}
					{password && (
						<div className="mt-2">
							<div className="flex gap-1">
								{[1, 2, 3, 4].map((level) => (
									<div
										key={level}
										className={`h-1 flex-1 rounded-full transition-colors ${
											passwordStrength >= level ? strengthColors[passwordStrength] : "bg-gray-200"
										}`}
									/>
								))}
							</div>
							<p className={`text-xs mt-1 ${passwordStrength >= 3 ? "text-green-600" : "text-gray-500"}`}>
								{strengthLabels[passwordStrength] || "Enter a password"}
							</p>
						</div>
					)}
				</div>

				<div>
					<label
						htmlFor="confirmPassword"
						className="block text-sm font-semibold text-gray-700 mb-2"
					>
						Confirm Password
					</label>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock className="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="confirmPassword"
							type={showConfirmPassword ? "text" : "password"}
							required
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							disabled={isSubmitting}
							className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-100 ${
								confirmPassword && password !== confirmPassword ? "border-red-300" : "border-gray-300"
							}`}
							placeholder="Confirm new password"
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute inset-y-0 right-0 pr-3 flex items-center"
						>
							{showConfirmPassword ? (
								<EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
							) : (
								<Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
							)}
						</button>
					</div>
					{confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>}
				</div>

				<button
					type="submit"
					disabled={isSubmitting || password !== confirmPassword || password.length < 8}
					className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
							Resetting...
						</>
					) : (
						"Reset Password"
					)}
				</button>
			</form>
		</div>
	);
}

export default function ResetPasswordPage() {
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
								<Lock className="w-8 h-8" />
							</div>
							<h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
							<p className="mt-2 text-sm text-gray-600">Enter your new password below.</p>
						</div>

						{/* Form Card with Suspense */}
						<Suspense
							fallback={
								<div className="flex items-center justify-center py-12">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
								</div>
							}
						>
							<ResetPasswordForm />
						</Suspense>
					</div>
				</div>
			</div>
		</>
	);
}
