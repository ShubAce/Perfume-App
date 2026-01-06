"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditAddressPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const params = useParams();
	const addressId = params.id as string;

	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		label: "Home",
		fullName: "",
		phone: "",
		addressLine1: "",
		addressLine2: "",
		city: "",
		state: "",
		postalCode: "",
		country: "US",
		isDefault: false,
	});

	// Fetch existing address
	useEffect(() => {
		const fetchAddress = async () => {
			try {
				const response = await fetch(`/api/addresses/${addressId}`);
				if (response.ok) {
					const data = await response.json();
					setFormData({
						label: data.label || "Home",
						fullName: data.fullName || "",
						phone: data.phone || "",
						addressLine1: data.addressLine1 || "",
						addressLine2: data.addressLine2 || "",
						city: data.city || "",
						state: data.state || "",
						postalCode: data.postalCode || "",
						country: data.country || "US",
						isDefault: data.isDefault || false,
					});
				} else {
					toast.error("Address not found");
					router.push("/profile");
				}
			} catch (error) {
				toast.error("Failed to load address");
				router.push("/profile");
			} finally {
				setIsLoading(false);
			}
		};

		if (session && addressId) {
			fetchAddress();
		}
	}, [session, addressId, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.fullName || !formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/addresses/${addressId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				toast.success("Address updated successfully!");
				router.push("/profile");
				router.refresh();
			} else {
				const data = await response.json();
				toast.error(data.error || "Failed to update address");
			}
		} catch (error) {
			toast.error("Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
		}));
	};

	if (status === "loading" || isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
			</div>
		);
	}

	if (!session) {
		router.push("/login?callbackUrl=/profile");
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
				{/* Back Button */}
				<Link
					href="/profile"
					className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-8 transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Profile
				</Link>

				<div className="bg-white rounded-2xl shadow-sm p-8">
					<h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Address</h1>

					<form
						onSubmit={handleSubmit}
						className="space-y-6"
					>
						{/* Label */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Address Label</label>
							<div className="flex gap-3">
								{["Home", "Work", "Other"].map((label) => (
									<button
										key={label}
										type="button"
										onClick={() => setFormData((prev) => ({ ...prev, label }))}
										className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
											formData.label === label ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
										}`}
									>
										{label}
									</button>
								))}
							</div>
						</div>

						{/* Full Name */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Full Name <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="fullName"
								value={formData.fullName}
								onChange={handleChange}
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								placeholder="John Doe"
								required
							/>
						</div>

						{/* Phone */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
							<input
								type="tel"
								name="phone"
								value={formData.phone}
								onChange={handleChange}
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								placeholder="+1 (555) 000-0000"
							/>
						</div>

						{/* Address Line 1 */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Street Address <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="addressLine1"
								value={formData.addressLine1}
								onChange={handleChange}
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								placeholder="123 Main Street"
								required
							/>
						</div>

						{/* Address Line 2 */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Apartment, Suite, etc. (Optional)</label>
							<input
								type="text"
								name="addressLine2"
								value={formData.addressLine2}
								onChange={handleChange}
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								placeholder="Apt 4B"
							/>
						</div>

						{/* City, State, Zip */}
						<div className="grid grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									City <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="city"
									value={formData.city}
									onChange={handleChange}
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									placeholder="New York"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									State <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="state"
									value={formData.state}
									onChange={handleChange}
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									placeholder="NY"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									ZIP Code <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="postalCode"
									value={formData.postalCode}
									onChange={handleChange}
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									placeholder="10001"
									required
								/>
							</div>
						</div>

						{/* Country */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
							<select
								name="country"
								value={formData.country}
								onChange={handleChange}
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							>
								<option value="US">United States</option>
								<option value="CA">Canada</option>
								<option value="UK">United Kingdom</option>
							</select>
						</div>

						{/* Default Checkbox */}
						<div className="flex items-center gap-3">
							<input
								type="checkbox"
								name="isDefault"
								id="isDefault"
								checked={formData.isDefault}
								onChange={handleChange}
								className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
							/>
							<label
								htmlFor="isDefault"
								className="text-sm text-gray-700"
							>
								Set as default shipping address
							</label>
						</div>

						{/* Submit */}
						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-shadow disabled:opacity-60"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="h-5 w-5 animate-spin" />
									Saving...
								</>
							) : (
								"Update Address"
							)}
						</button>
					</form>
				</div>
			</main>

			<Footer />
		</div>
	);
}
