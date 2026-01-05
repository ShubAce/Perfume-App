import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsAndConditionsPage() {
	return (
		<div>
			<Navbar />
			<main className="bg-white">
				{/* Header */}
				<section className="mx-auto max-w-7xl px-6 py-20 text-center">
					<p className="mb-4 text-sm tracking-widest text-gray-500 uppercase">Legal</p>
					<h1 className="text-4xl md:text-5xl font-light text-gray-900">Terms & Conditions</h1>
					<p className="mx-auto mt-6 max-w-2xl text-gray-600">
						Please read these terms carefully before using our website or purchasing our products.
					</p>
				</section>

				{/* Content */}
				<section className="mx-auto max-w-4xl px-6 pb-24 space-y-12 text-gray-700">
					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">1. General</h2>
						<p>
							By accessing or using this website, you agree to be bound by these Terms and Conditions. If you do not agree with any part
							of these terms, you should not use our website or services.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">2. Products & Services</h2>
						<p>
							We strive to display product information, descriptions, and pricing as accurately as possible. However, we do not
							guarantee that all content is error-free. Product availability and prices are subject to change without notice.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">3. Orders & Payments</h2>
						<p>
							All orders placed through our website are subject to acceptance and availability. We reserve the right to refuse or cancel
							any order at our discretion. Payments must be completed through approved payment methods at checkout.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">4. Shipping & Delivery</h2>
						<p>
							Delivery timelines provided are estimates only. We are not responsible for delays caused by courier services, natural
							events, or circumstances beyond our control.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">5. Returns & Refunds</h2>
						<p>
							Returns and refunds are governed by our Return & Refund Policy. Please review that policy carefully before making a
							purchase.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">6. Intellectual Property</h2>
						<p>
							All content on this website, including logos, text, images, and designs, is the intellectual property of SCENTOS and may
							not be copied, reproduced, or distributed without prior written consent.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">7. User Conduct</h2>
						<p>
							You agree not to misuse the website, attempt unauthorized access, or engage in any activity that may harm the website, its
							users, or its infrastructure.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">8. Limitation of Liability</h2>
						<p>
							To the maximum extent permitted by law, SCENTOS shall not be liable for any indirect, incidental, or consequential damages
							arising from the use of our website or products.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">9. Changes to Terms</h2>
						<p>
							We reserve the right to update or modify these Terms and Conditions at any time. Continued use of the website after
							changes implies acceptance of the updated terms.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">10. Governing Law</h2>
						<p>
							These terms shall be governed and interpreted in accordance with the laws of India, without regard to conflict of law
							principles.
						</p>
					</div>

					<div>
						<h2 className="text-xl font-medium text-gray-900 mb-3">11. Contact Us</h2>
						<p>If you have any questions about these Terms and Conditions, please contact us through our Contact Us page.</p>
					</div>
				</section>
			</main>
			<footer>
				<Footer />
			</footer>
		</div>
	);
}
