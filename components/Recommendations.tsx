import Link from "next/link";
import Image from "next/image";

interface Product {
	id: number;
	name: string;
	brand: string;
	slug: string;
	price: string;
	imageUrl: string | null;
	gender?: string;
	concentration?: string | null;
	isTrending?: boolean;
}

interface ProductCardProps {
	product: Product;
	showBadge?: boolean;
	compact?: boolean;
}

export function ProductCard({ product, showBadge = false, compact = false }: ProductCardProps) {
	return (
		<Link
			href={`/product/${product.slug}`}
			className={`group block rounded-xl bg-white shadow-sm transition-all hover:shadow-lg ${compact ? "p-3" : "p-4"}`}
		>
			<div className={`relative overflow-hidden rounded-lg bg-gray-100 ${compact ? "aspect-square" : "aspect-square"}`}>
				{product.imageUrl ? (
					<Image
						src={product.imageUrl}
						alt={product.name}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full items-center justify-center text-gray-400">No Image</div>
				)}
				{showBadge && product.isTrending && (
					<span className="absolute left-2 top-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 px-2 py-0.5 text-xs font-bold text-white">
						Trending
					</span>
				)}
			</div>
			<div className={compact ? "mt-2" : "mt-4"}>
				<p className={`font-medium uppercase tracking-wide text-purple-600 ${compact ? "text-[10px]" : "text-xs"}`}>{product.brand}</p>
				<h3
					className={`font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1 ${
						compact ? "text-sm mt-0.5" : "mt-1"
					}`}
				>
					{product.name}
				</h3>
				{!compact && product.concentration && <p className="mt-0.5 text-xs text-gray-500">{product.concentration}</p>}
				<p className={`font-bold text-gray-900 ${compact ? "mt-1 text-sm" : "mt-2 text-lg"}`}>${product.price}</p>
			</div>
		</Link>
	);
}

interface RecommendationSectionProps {
	title: string;
	subtitle?: string;
	products: Product[];
	viewAllLink?: string;
	icon?: React.ReactNode;
	variant?: "default" | "compact" | "horizontal";
}

export function RecommendationSection({ title, subtitle, products, viewAllLink, icon, variant = "default" }: RecommendationSectionProps) {
	if (products.length === 0) return null;

	return (
		<section className="py-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
						{icon}
						{title}
					</h2>
					{subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
				</div>
				{viewAllLink && (
					<Link
						href={viewAllLink}
						className="text-sm font-semibold text-purple-600 hover:text-purple-700"
					>
						View all →
					</Link>
				)}
			</div>

			{variant === "horizontal" ? (
				<div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
					{products.map((product) => (
						<div
							key={product.id}
							className="min-w-[200px] snap-start"
						>
							<ProductCard
								product={product}
								compact
							/>
						</div>
					))}
				</div>
			) : (
				<div
					className={`grid gap-4 ${
						variant === "compact" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
					}`}
				>
					{products.map((product) => (
						<ProductCard
							key={product.id}
							product={product}
							showBadge
							compact={variant === "compact"}
						/>
					))}
				</div>
			)}
		</section>
	);
}

interface MoodCollectionProps {
	moods: { name: string; icon: string; color: string }[];
}

export function MoodCollection({ moods }: MoodCollectionProps) {
	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
			{moods.map((mood) => (
				<Link
					key={mood.name}
					href={`/search?mood=${encodeURIComponent(mood.name.toLowerCase())}`}
					className={`group relative overflow-hidden rounded-2xl p-6 text-center transition-transform hover:scale-105 ${mood.color}`}
				>
					<div className="text-4xl mb-2">{mood.icon}</div>
					<h3 className="font-semibold text-gray-900">{mood.name}</h3>
				</Link>
			))}
		</div>
	);
}

interface SeasonalPicksProps {
	currentSeason: "spring" | "summer" | "fall" | "winter";
}

export function SeasonalBanner({ currentSeason }: SeasonalPicksProps) {
	const seasonData = {
		spring: {
			title: "Spring Collection",
			description: "Fresh florals and light citrus for the new season",
			gradient: "from-green-100 to-pink-100",
			icon: "🌸",
		},
		summer: {
			title: "Summer Essentials",
			description: "Aquatic and citrus scents for hot days",
			gradient: "from-cyan-100 to-yellow-100",
			icon: "☀️",
		},
		fall: {
			title: "Fall Favorites",
			description: "Warm spices and cozy woods",
			gradient: "from-orange-100 to-amber-100",
			icon: "🍂",
		},
		winter: {
			title: "Winter Warmers",
			description: "Rich orientals and deep amber",
			gradient: "from-blue-100 to-purple-100",
			icon: "❄️",
		},
	};

	const season = seasonData[currentSeason];

	return (
		<Link
			href={`/search?season=${currentSeason}`}
			className={`block rounded-2xl bg-linear-to-r ${season.gradient} p-8 transition-transform hover:scale-[1.02]`}
		>
			<div className="flex items-center gap-4">
				<span className="text-5xl">{season.icon}</span>
				<div>
					<h3 className="text-2xl font-bold text-gray-900">{season.title}</h3>
					<p className="mt-1 text-gray-600">{season.description}</p>
				</div>
			</div>
		</Link>
	);
}
