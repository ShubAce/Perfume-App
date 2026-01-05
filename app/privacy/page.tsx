import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function PrivacyPolicyPage() {
	return (
		<div>
			<nav>
				<Navbar />
			</nav>

			<main className="bg-white">
				{/* Header */}
				<section className="mx-auto max-w-7xl px-6 py-20 text-center">
					<p className="mb-4 text-sm tracking-widest text-gray-500 uppercase">Legal</p>
					<h1 className="text-4xl md:text-5xl font-light text-gray-900">Privacy Policy</h1>
					<p className="mx-auto mt-6 max-w-2xl text-gray-600">
						Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
					</p>
				</section>

				{/* Content */}
				<section className="mx-auto max-w-4xl px-6 pb-24 space-y-12 text-gray-700">
					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">1. Information We Collect</h2>
						<p>
							We may collect personal information such as your name, email address, phone number, shipping address, and payment details
							when you place an order or interact with our website.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">2. How We Use Your Information</h2>
						<p>
							Your information is used to process orders, provide customer support, improve our services, and communicate updates or
							promotional offers when permitted by law.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">3. Sharing of Information</h2>
						<p>
							We do not sell or rent your personal information. Information may be shared with trusted third-party service providers
							solely for order fulfillment, payment processing, and delivery services.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">4. Cookies & Tracking Technologies</h2>
						<p>
							We use cookies and similar technologies to enhance your browsing experience, analyze website traffic, and improve
							functionality. You can modify your browser settings to manage cookie preferences.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">5. Data Security</h2>
						<p>
							We implement reasonable security measures to protect your personal data. However, no method of transmission over the
							internet is completely secure, and we cannot guarantee absolute security.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">6. Your Rights</h2>
						<p>
							You have the right to access, update, or request deletion of your personal information, subject to applicable laws and
							legal obligations.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">7. Third-Party Links</h2>
						<p>
							Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of
							those sites.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">8. Changes to This Policy</h2>
						<p>We may update this Privacy Policy from time to time. Changes will be effective immediately upon posting on this page.</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">9. Contact Us</h2>
						<p>If you have any questions or concerns regarding this Privacy Policy, please contact us through our Contact Us page.</p>
					</div>
				</section>
			</main>
			<footer>
				<Footer />
			</footer>
		</div>
	);
}
