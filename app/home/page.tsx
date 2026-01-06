import { db } from "@/src/index";
import { products } from "@/src/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RecommendationSection, SeasonalBanner, MoodCollection } from "@/components/Recommendations";
import { getTrendingProducts, getSeasonalPicks, getMoodPicks } from "@/lib/recommendations";
import { Sparkles, Gift, Zap, Star } from "lucide-react";

// Helper to get current season
function getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
	const month = new Date().getMonth();
	if (month >= 2 && month <= 4) return "spring";
	if (month >= 5 && month <= 7) return "summer";
	if (month >= 8 && month <= 10) return "fall";
	return "winter";
}

// Category Card Component
function CategoryCard({ title, image, link, subtitle }: { title: string; image: string; link: string; subtitle?: string }) {
	return (
		<Link
			href={link}
			className="group relative block h-[400px] overflow-hidden rounded-2xl bg-gray-100"
		>
			<Image
				src={image}
				alt={title}
				fill
				className="object-cover transition-transform duration-700 group-hover:scale-110"
			/>
			<div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
			<div className="absolute bottom-8 left-8 text-white">
				<h3 className="text-3xl font-bold">{title}</h3>
				{subtitle && <p className="mt-2 text-sm text-gray-200">{subtitle}</p>}
				<p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white/90 group-hover:text-white">
					Shop Collection
					<span className="transition-transform group-hover:translate-x-1">→</span>
				</p>
			</div>
		</Link>
	);
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
	return (
		<div className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-sm">
			<div className="shrink-0 rounded-full bg-purple-100 p-3 text-purple-600">{icon}</div>
			<div>
				<h3 className="font-semibold text-gray-900">{title}</h3>
				<p className="mt-1 text-sm text-gray-600">{description}</p>
			</div>
		</div>
	);
}

// Mood data for the mood collection
const MOODS = [
	{ name: "Fresh", icon: "🌊", color: "bg-cyan-100 hover:bg-cyan-200" },
	{ name: "Romantic", icon: "💕", color: "bg-pink-100 hover:bg-pink-200" },
	{ name: "Mysterious", icon: "🌙", color: "bg-purple-100 hover:bg-purple-200" },
	{ name: "Bold", icon: "🔥", color: "bg-orange-100 hover:bg-orange-200" },
];

export default async function EnhancedHome() {
	const currentSeason = getCurrentSeason();

	// Fetch all data in parallel
	const [trendingProducts, seasonalProducts, freshPicks, romanticPicks, newArrivals] = await Promise.all([
		getTrendingProducts(8),
		getSeasonalPicks(currentSeason, 4),
		getMoodPicks("fresh", 4),
		getMoodPicks("romantic", 4),
		db.query.products.findMany({
			orderBy: desc(products.createdAt),
			limit: 4,
		}),
	]);

	return (
		<>
			<main className="min-h-screen bg-white">
				<Navbar />

				{/* 1. HERO SECTION - Enhanced */}
				<section className="relative h-[85vh] w-full overflow-hidden bg-gray-900">
					<div className="absolute inset-0">
						<Image
							src="https://images.unsplash.com/photo-1557170334-a9632e77c6e4?q=80&w=3000&auto=format&fit=crop"
							alt="Hero Banner"
							fill
							className="object-cover opacity-60"
							priority
						/>
						<div className="absolute inset-0 bg-linear-to-r from-black/50 to-transparent" />
					</div>
					<div className="relative z-10 flex h-full flex-col items-start justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
						<span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white mb-6">
							<Sparkles className="h-4 w-4" />
							New Collection Available
						</span>
						<h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl max-w-2xl">
							Find Your{" "}
							<span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Signature Scent</span>
						</h1>
						<p className="mt-6 max-w-lg text-lg text-gray-200">
							Discover exclusive, long-lasting fragrances crafted for every mood and occasion.
						</p>
						<div className="mt-10 flex flex-wrap gap-4">
							<Link
								href="/shop/all"
								className="rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition-all hover:scale-105 hover:shadow-lg"
							>
								Shop Now
							</Link>
							<Link
								href="/quiz"
								className="rounded-full bg-white/10 backdrop-blur-sm border border-white/30 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/20"
							>
								✨ Take the Quiz
							</Link>
						</div>
					</div>
				</section>

				{/* 2. TRUST BADGES */}
				<section className="border-b border-gray-100 bg-gray-50 py-8">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<FeatureCard
								icon={<Zap className="h-5 w-5" />}
								title="Fast Shipping"
								description="Free delivery on orders over $50"
							/>
							<FeatureCard
								icon={<Star className="h-5 w-5" />}
								title="100% Authentic"
								description="Guaranteed genuine products"
							/>
							<FeatureCard
								icon={<Gift className="h-5 w-5" />}
								title="Gift Ready"
								description="Beautiful packaging included"
							/>
							<FeatureCard
								icon={<Sparkles className="h-5 w-5" />}
								title="Samples Included"
								description="Try new scents with every order"
							/>
						</div>
					</div>
				</section>

				{/* 3. CATEGORY SECTION */}
				<section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold tracking-tight text-gray-900">Shop by Category</h2>
						<p className="mt-2 text-gray-600">Find the perfect fragrance for anyone</p>
					</div>
					<div className="grid gap-6 sm:grid-cols-3">
						<CategoryCard
							title="For Him"
							subtitle="Bold & sophisticated scents"
							link="/shop/men"
							image="https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80"
						/>
						<CategoryCard
							title="For Her"
							subtitle="Elegant & captivating fragrances"
							link="/shop/women"
							image="https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80"
						/>
						<CategoryCard
							title="Unisex"
							subtitle="Universal appeal for all"
							link="/shop/unisex"
							image="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80"
						/>
					</div>
				</section>

				{/* 4. DISCOVER BY MOOD */}
				<section className="bg-linear-to-br from-purple-50 via-pink-50 to-amber-50 py-20">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-12">
							<h2 className="text-3xl font-bold tracking-tight text-gray-900">Discover by Mood</h2>
							<p className="mt-2 text-gray-600">What feeling do you want to create today?</p>
						</div>
						<MoodCollection moods={MOODS} />

						{/* Quiz CTA */}
						<div className="mt-12 text-center">
							<Link
								href="/quiz"
								className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-medium text-white shadow-lg hover:shadow-xl transition-shadow"
							>
								<Sparkles className="h-5 w-5" />
								Take the Scent Quiz
							</Link>
							<p className="mt-3 text-sm text-gray-600">Answer a few questions and we'll find your perfect match</p>
						</div>
					</div>
				</section>

				{/* 5. TRENDING NOW */}
				<section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
					<RecommendationSection
						title="Trending Now"
						subtitle="Most loved fragrances this week"
						products={trendingProducts}
						viewAllLink="/search?sortBy=popular"
						variant="horizontal"
					/>
				</section>

				{/* 6. SEASONAL PICKS */}
				<section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
					<SeasonalBanner currentSeason={currentSeason} />
					<div className="mt-8">
						<RecommendationSection
							title={`Best for ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}`}
							products={seasonalProducts}
							variant="compact"
						/>
					</div>
				</section>

				{/* 7. EDITOR'S PICKS - Fresh & Romantic Collections */}
				<section className="bg-gray-50 py-20">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="grid gap-12 lg:grid-cols-2">
							<RecommendationSection
								title="Fresh & Clean"
								subtitle="Light, invigorating scents for everyday"
								products={freshPicks}
								viewAllLink="/search?mood=fresh"
								variant="compact"
								icon={<span className="text-2xl">🌊</span>}
							/>
							<RecommendationSection
								title="Romantic Collection"
								subtitle="Captivating scents for special moments"
								products={romanticPicks}
								viewAllLink="/search?mood=romantic"
								variant="compact"
								icon={<span className="text-2xl">💕</span>}
							/>
						</div>
					</div>
				</section>

				{/* 8. NEW ARRIVALS */}
				<section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
					<RecommendationSection
						title="Just Arrived"
						subtitle="Be the first to try our newest additions"
						products={newArrivals as any}
						viewAllLink="/shop/new"
						icon={<Sparkles className="h-6 w-6 text-purple-600" />}
					/>
				</section>

				{/* 9. GIFT FINDER CTA */}
				<section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
					<div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-purple-600 to-pink-600 p-12 text-center text-white">
						<div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10" />
						<div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-white/10" />
						<div className="relative">
							<span className="text-5xl mb-4 block">🎁</span>
							<h2 className="text-3xl font-bold">Looking for a Gift?</h2>
							<p className="mt-3 text-lg text-purple-100 max-w-lg mx-auto">
								Find the perfect fragrance for someone special with our gift finder
							</p>
							<Link
								href="/quiz?gift=true"
								className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-bold text-purple-600 shadow-lg hover:shadow-xl transition-shadow"
							>
								Find the Perfect Gift
							</Link>
						</div>
					</div>
				</section>
			</main>

			<Footer />
		</>
	);
}
