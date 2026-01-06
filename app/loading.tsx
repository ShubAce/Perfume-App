export default function Loading() {
	return (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
			{/* Animated Perfume Bottle */}
			<div className="relative w-20 h-20 mb-6">
				{/* Outer ring */}
				<div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-pulse" />
				{/* Spinning ring */}
				<div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" />
				{/* Inner icon */}
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-3xl animate-bounce">✨</span>
				</div>
			</div>

			{/* Loading Text */}
			<p className="text-gray-600 font-medium animate-pulse">Discovering fragrances...</p>
		</div>
	);
}
