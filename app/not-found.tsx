import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />

			<main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
				<div className="text-center max-w-lg">
					{/* Decorative Element */}
					<div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 mb-8">
						<div className="absolute inset-0 bg-linear-to-br from-purple-200 to-pink-200 rounded-full animate-pulse" />
						<div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
							<span className="text-5xl sm:text-6xl">💔</span>
						</div>
					</div>

					{/* Error Code */}
					<h1 className="text-7xl sm:text-9xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
						404
					</h1>

					{/* Message */}
					<h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">Page Not Found</h2>
					<p className="mt-3 text-gray-600 text-base sm:text-lg">
						Oops! The fragrance you&apos;re looking for seems to have evaporated. Let&apos;s help you find your way back.
					</p>

					{/* Actions */}
					<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
						<Link
							href="/"
							className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
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
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
							Go Home
						</Link>
						<Link
							href="/shop/all"
							className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-purple-300 hover:text-purple-600 transition-all"
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
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
							Browse Shop
						</Link>
					</div>

					{/* Help Link */}
					<p className="mt-8 text-sm text-gray-500">
						Need help?{" "}
						<Link
							href="/aboutus"
							className="text-purple-600 hover:underline font-medium"
						>
							Contact us
						</Link>
					</p>
				</div>
			</main>

			<Footer />
		</div>
	);
}
