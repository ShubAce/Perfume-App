import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutUs() {
	return (
		<div>
			<nav>
				<Navbar />
			</nav>

			<main className="bg-white">
				{/* Hero Section */}
				<section className="mx-auto max-w-7xl px-6 py-24 text-center">
					<p className="mb-4 text-sm tracking-widest text-gray-500 uppercase">About Us</p>
					<h1 className="mx-auto max-w-3xl text-4xl md:text-5xl font-light leading-tight text-gray-900">
						Crafting fragrances that become a part of who you are.
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600">
						We believe perfume is more than a scent — it’s a memory, a mood, and a quiet expression of individuality.
					</p>
				</section>

				{/* Brand Story */}
				<section className="mx-auto max-w-7xl px-6 py-20 border-t border-gray-100">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
						<div>
							<h2 className="text-2xl font-light text-gray-900 mb-6">Our Story</h2>
							<p className="text-gray-600 leading-relaxed mb-4">
								Founded with a deep appreciation for fine perfumery, our brand was born from a simple idea — to create scents that
								feel personal, timeless, and effortlessly elegant.
							</p>
							<p className="text-gray-600 leading-relaxed">
								Inspired by niche fragrance houses across the world, we focus on balance: modern compositions rooted in classic
								craftsmanship. Every formulation is carefully developed to evolve beautifully on the skin, revealing layers over time.
							</p>
						</div>

						<div className="bg-gray-50 p-10 rounded-sm">
							<p className="text-sm tracking-widest text-gray-500 uppercase mb-4">Philosophy</p>
							<p className="text-gray-700 leading-relaxed">
								We don’t follow trends. We create fragrances that last beyond seasons — scents that feel intimate, confident, and
								uniquely yours.
							</p>
						</div>
					</div>
				</section>

				{/* What Makes Us Different */}
				<section className="bg-gray-50">
					<div className="mx-auto max-w-7xl px-6 py-20">
						<h2 className="text-center text-2xl font-light text-gray-900 mb-14">What Sets Us Apart</h2>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
							<div>
								<h3 className="mb-3 text-sm font-semibold tracking-widest uppercase text-gray-700">Thoughtful Formulation</h3>
								<p className="text-gray-600 leading-relaxed">
									Each fragrance is crafted with carefully sourced ingredients, blended to create depth, longevity, and character.
								</p>
							</div>

							<div>
								<h3 className="mb-3 text-sm font-semibold tracking-widest uppercase text-gray-700">Modern Minimalism</h3>
								<p className="text-gray-600 leading-relaxed">
									From scent profiles to packaging, we embrace simplicity — allowing quality and craftsmanship to speak for
									themselves.
								</p>
							</div>

							<div>
								<h3 className="mb-3 text-sm font-semibold tracking-widest uppercase text-gray-700">Designed for You</h3>
								<p className="text-gray-600 leading-relaxed">
									Our perfumes are created to blend seamlessly with your daily life, enhancing moments rather than overpowering
									them.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Closing Section */}
				<section className="mx-auto max-w-7xl px-6 py-24 text-center">
					<h2 className="mx-auto max-w-2xl text-3xl font-light text-gray-900">
						A fragrance should feel like a signature — subtle, personal, and unforgettable.
					</h2>
					<p className="mx-auto mt-6 max-w-xl text-gray-600">
						Thank you for being part of our journey. We invite you to explore our collections and find a scent that truly feels like you.
					</p>
				</section>
			</main>
			<footer>
				<Footer />
			</footer>
		</div>
	);
}
