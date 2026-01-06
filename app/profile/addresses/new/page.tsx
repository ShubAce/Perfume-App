"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const COUNTRIES: Array<{ code: string; name: string }> = [
	{ code: "AF", name: "Afghanistan" },
	{ code: "AL", name: "Albania" },
	{ code: "DZ", name: "Algeria" },
	{ code: "AS", name: "American Samoa" },
	{ code: "AD", name: "Andorra" },
	{ code: "AO", name: "Angola" },
	{ code: "AI", name: "Anguilla" },
	{ code: "AQ", name: "Antarctica" },
	{ code: "AG", name: "Antigua and Barbuda" },
	{ code: "AR", name: "Argentina" },
	{ code: "AM", name: "Armenia" },
	{ code: "AW", name: "Aruba" },
	{ code: "AU", name: "Australia" },
	{ code: "AT", name: "Austria" },
	{ code: "AZ", name: "Azerbaijan" },
	{ code: "BS", name: "Bahamas" },
	{ code: "BH", name: "Bahrain" },
	{ code: "BD", name: "Bangladesh" },
	{ code: "BB", name: "Barbados" },
	{ code: "BY", name: "Belarus" },
	{ code: "BE", name: "Belgium" },
	{ code: "BZ", name: "Belize" },
	{ code: "BJ", name: "Benin" },
	{ code: "BM", name: "Bermuda" },
	{ code: "BT", name: "Bhutan" },
	{ code: "BO", name: "Bolivia" },
	{ code: "BQ", name: "Bonaire, Sint Eustatius and Saba" },
	{ code: "BA", name: "Bosnia and Herzegovina" },
	{ code: "BW", name: "Botswana" },
	{ code: "BV", name: "Bouvet Island" },
	{ code: "BR", name: "Brazil" },
	{ code: "IO", name: "British Indian Ocean Territory" },
	{ code: "BN", name: "Brunei" },
	{ code: "BG", name: "Bulgaria" },
	{ code: "BF", name: "Burkina Faso" },
	{ code: "BI", name: "Burundi" },
	{ code: "CV", name: "Cabo Verde" },
	{ code: "KH", name: "Cambodia" },
	{ code: "CM", name: "Cameroon" },
	{ code: "CA", name: "Canada" },
	{ code: "KY", name: "Cayman Islands" },
	{ code: "CF", name: "Central African Republic" },
	{ code: "TD", name: "Chad" },
	{ code: "CL", name: "Chile" },
	{ code: "CN", name: "China" },
	{ code: "CX", name: "Christmas Island" },
	{ code: "CC", name: "Cocos (Keeling) Islands" },
	{ code: "CO", name: "Colombia" },
	{ code: "KM", name: "Comoros" },
	{ code: "CG", name: "Congo" },
	{ code: "CD", name: "Congo (DRC)" },
	{ code: "CK", name: "Cook Islands" },
	{ code: "CR", name: "Costa Rica" },
	{ code: "CI", name: "Côte d’Ivoire" },
	{ code: "HR", name: "Croatia" },
	{ code: "CU", name: "Cuba" },
	{ code: "CW", name: "Curaçao" },
	{ code: "CY", name: "Cyprus" },
	{ code: "CZ", name: "Czechia" },
	{ code: "DK", name: "Denmark" },
	{ code: "DJ", name: "Djibouti" },
	{ code: "DM", name: "Dominica" },
	{ code: "DO", name: "Dominican Republic" },
	{ code: "EC", name: "Ecuador" },
	{ code: "EG", name: "Egypt" },
	{ code: "SV", name: "El Salvador" },
	{ code: "GQ", name: "Equatorial Guinea" },
	{ code: "ER", name: "Eritrea" },
	{ code: "EE", name: "Estonia" },
	{ code: "SZ", name: "Eswatini" },
	{ code: "ET", name: "Ethiopia" },
	{ code: "FK", name: "Falkland Islands" },
	{ code: "FO", name: "Faroe Islands" },
	{ code: "FJ", name: "Fiji" },
	{ code: "FI", name: "Finland" },
	{ code: "FR", name: "France" },
	{ code: "GF", name: "French Guiana" },
	{ code: "PF", name: "French Polynesia" },
	{ code: "TF", name: "French Southern Territories" },
	{ code: "GA", name: "Gabon" },
	{ code: "GM", name: "Gambia" },
	{ code: "GE", name: "Georgia" },
	{ code: "DE", name: "Germany" },
	{ code: "GH", name: "Ghana" },
	{ code: "GI", name: "Gibraltar" },
	{ code: "GR", name: "Greece" },
	{ code: "GL", name: "Greenland" },
	{ code: "GD", name: "Grenada" },
	{ code: "GP", name: "Guadeloupe" },
	{ code: "GU", name: "Guam" },
	{ code: "GT", name: "Guatemala" },
	{ code: "GG", name: "Guernsey" },
	{ code: "GN", name: "Guinea" },
	{ code: "GW", name: "Guinea-Bissau" },
	{ code: "GY", name: "Guyana" },
	{ code: "HT", name: "Haiti" },
	{ code: "HM", name: "Heard Island and McDonald Islands" },
	{ code: "VA", name: "Vatican City" },
	{ code: "HN", name: "Honduras" },
	{ code: "HK", name: "Hong Kong" },
	{ code: "HU", name: "Hungary" },
	{ code: "IS", name: "Iceland" },
	{ code: "IN", name: "India" },
	{ code: "ID", name: "Indonesia" },
	{ code: "IR", name: "Iran" },
	{ code: "IQ", name: "Iraq" },
	{ code: "IE", name: "Ireland" },
	{ code: "IM", name: "Isle of Man" },
	{ code: "IL", name: "Israel" },
	{ code: "IT", name: "Italy" },
	{ code: "JM", name: "Jamaica" },
	{ code: "JP", name: "Japan" },
	{ code: "JE", name: "Jersey" },
	{ code: "JO", name: "Jordan" },
	{ code: "KZ", name: "Kazakhstan" },
	{ code: "KE", name: "Kenya" },
	{ code: "KI", name: "Kiribati" },
	{ code: "KP", name: "North Korea" },
	{ code: "KR", name: "South Korea" },
	{ code: "KW", name: "Kuwait" },
	{ code: "KG", name: "Kyrgyzstan" },
	{ code: "LA", name: "Laos" },
	{ code: "LV", name: "Latvia" },
	{ code: "LB", name: "Lebanon" },
	{ code: "LS", name: "Lesotho" },
	{ code: "LR", name: "Liberia" },
	{ code: "LY", name: "Libya" },
	{ code: "LI", name: "Liechtenstein" },
	{ code: "LT", name: "Lithuania" },
	{ code: "LU", name: "Luxembourg" },
	{ code: "MO", name: "Macao" },
	{ code: "MG", name: "Madagascar" },
	{ code: "MW", name: "Malawi" },
	{ code: "MY", name: "Malaysia" },
	{ code: "MV", name: "Maldives" },
	{ code: "ML", name: "Mali" },
	{ code: "MT", name: "Malta" },
	{ code: "MH", name: "Marshall Islands" },
	{ code: "MQ", name: "Martinique" },
	{ code: "MR", name: "Mauritania" },
	{ code: "MU", name: "Mauritius" },
	{ code: "YT", name: "Mayotte" },
	{ code: "MX", name: "Mexico" },
	{ code: "FM", name: "Micronesia" },
	{ code: "MD", name: "Moldova" },
	{ code: "MC", name: "Monaco" },
	{ code: "MN", name: "Mongolia" },
	{ code: "ME", name: "Montenegro" },
	{ code: "MS", name: "Montserrat" },
	{ code: "MA", name: "Morocco" },
	{ code: "MZ", name: "Mozambique" },
	{ code: "MM", name: "Myanmar" },
	{ code: "NA", name: "Namibia" },
	{ code: "NR", name: "Nauru" },
	{ code: "NP", name: "Nepal" },
	{ code: "NL", name: "Netherlands" },
	{ code: "NC", name: "New Caledonia" },
	{ code: "NZ", name: "New Zealand" },
	{ code: "NI", name: "Nicaragua" },
	{ code: "NE", name: "Niger" },
	{ code: "NG", name: "Nigeria" },
	{ code: "NU", name: "Niue" },
	{ code: "NF", name: "Norfolk Island" },
	{ code: "MK", name: "North Macedonia" },
	{ code: "MP", name: "Northern Mariana Islands" },
	{ code: "NO", name: "Norway" },
	{ code: "OM", name: "Oman" },
	{ code: "PK", name: "Pakistan" },
	{ code: "PW", name: "Palau" },
	{ code: "PS", name: "Palestine" },
	{ code: "PA", name: "Panama" },
	{ code: "PG", name: "Papua New Guinea" },
	{ code: "PY", name: "Paraguay" },
	{ code: "PE", name: "Peru" },
	{ code: "PH", name: "Philippines" },
	{ code: "PN", name: "Pitcairn" },
	{ code: "PL", name: "Poland" },
	{ code: "PT", name: "Portugal" },
	{ code: "PR", name: "Puerto Rico" },
	{ code: "QA", name: "Qatar" },
	{ code: "RE", name: "Réunion" },
	{ code: "RO", name: "Romania" },
	{ code: "RU", name: "Russia" },
	{ code: "RW", name: "Rwanda" },
	{ code: "BL", name: "Saint Barthélemy" },
	{ code: "SH", name: "Saint Helena, Ascension and Tristan da Cunha" },
	{ code: "KN", name: "Saint Kitts and Nevis" },
	{ code: "LC", name: "Saint Lucia" },
	{ code: "MF", name: "Saint Martin (French part)" },
	{ code: "PM", name: "Saint Pierre and Miquelon" },
	{ code: "VC", name: "Saint Vincent and the Grenadines" },
	{ code: "WS", name: "Samoa" },
	{ code: "SM", name: "San Marino" },
	{ code: "ST", name: "Sao Tome and Principe" },
	{ code: "SA", name: "Saudi Arabia" },
	{ code: "SN", name: "Senegal" },
	{ code: "RS", name: "Serbia" },
	{ code: "SC", name: "Seychelles" },
	{ code: "SL", name: "Sierra Leone" },
	{ code: "SG", name: "Singapore" },
	{ code: "SX", name: "Sint Maarten (Dutch part)" },
	{ code: "SK", name: "Slovakia" },
	{ code: "SI", name: "Slovenia" },
	{ code: "SB", name: "Solomon Islands" },
	{ code: "SO", name: "Somalia" },
	{ code: "ZA", name: "South Africa" },
	{ code: "GS", name: "South Georgia and the South Sandwich Islands" },
	{ code: "SS", name: "South Sudan" },
	{ code: "ES", name: "Spain" },
	{ code: "LK", name: "Sri Lanka" },
	{ code: "SD", name: "Sudan" },
	{ code: "SR", name: "Suriname" },
	{ code: "SJ", name: "Svalbard and Jan Mayen" },
	{ code: "SE", name: "Sweden" },
	{ code: "CH", name: "Switzerland" },
	{ code: "SY", name: "Syria" },
	{ code: "TW", name: "Taiwan" },
	{ code: "TJ", name: "Tajikistan" },
	{ code: "TZ", name: "Tanzania" },
	{ code: "TH", name: "Thailand" },
	{ code: "TL", name: "Timor-Leste" },
	{ code: "TG", name: "Togo" },
	{ code: "TK", name: "Tokelau" },
	{ code: "TO", name: "Tonga" },
	{ code: "TT", name: "Trinidad and Tobago" },
	{ code: "TN", name: "Tunisia" },
	{ code: "TR", name: "Türkiye" },
	{ code: "TM", name: "Turkmenistan" },
	{ code: "TC", name: "Turks and Caicos Islands" },
	{ code: "TV", name: "Tuvalu" },
	{ code: "UG", name: "Uganda" },
	{ code: "UA", name: "Ukraine" },
	{ code: "AE", name: "United Arab Emirates" },
	{ code: "GB", name: "United Kingdom" },
	{ code: "US", name: "United States" },
	{ code: "UM", name: "United States Minor Outlying Islands" },
	{ code: "UY", name: "Uruguay" },
	{ code: "UZ", name: "Uzbekistan" },
	{ code: "VU", name: "Vanuatu" },
	{ code: "VE", name: "Venezuela" },
	{ code: "VN", name: "Vietnam" },
	{ code: "VG", name: "Virgin Islands (British)" },
	{ code: "VI", name: "Virgin Islands (U.S.)" },
	{ code: "WF", name: "Wallis and Futuna" },
	{ code: "EH", name: "Western Sahara" },
	{ code: "YE", name: "Yemen" },
	{ code: "ZM", name: "Zambia" },
	{ code: "ZW", name: "Zimbabwe" },
];

export default function NewAddressPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.fullName || !formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch("/api/addresses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				toast.success("Address added successfully!");
				router.push("/profile");
				router.refresh();
			} else {
				const data = await response.json();
				toast.error(data.error || "Failed to add address");
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

	if (status === "loading") {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
			</div>
		);
	}

	if (!session) {
		router.push("/login?callbackUrl=/profile/addresses/new");
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
					<h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Address</h1>

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
								{COUNTRIES.map((c) => (
									<option
										key={c.code}
										value={c.code}
									>
										{c.name}
									</option>
								))}
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
								"Save Address"
							)}
						</button>
					</form>
				</div>
			</main>

			<Footer />
		</div>
	);
}
