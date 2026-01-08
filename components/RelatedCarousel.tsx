"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

type Product = {
	id: number;
	slug: string;
	name: string;
	brand?: string;
	price?: string | number;
	imageUrl?: string | null;
};

export default function RelatedCarousel({ products }: { products: Product[] }) {
	const scrollerRef = useRef<HTMLDivElement | null>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const update = () => {
			setCanScrollLeft(el.scrollLeft > 0);
			setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
		};
		update();
		el.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
		return () => {
			el.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		};
	}, [products]);

	const scrollByCard = (direction: "left" | "right") => {
		const el = scrollerRef.current;
		if (!el) return;
		// scroll by container width (approx one row)
		const amount = Math.max(el.clientWidth * 0.75, 300);
		el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
	};

	if (!products || products.length === 0) return null;

	return (
		<div className="relative">
			{/* Mobile / small screens: horizontal scroller with arrows */}
			<div className="lg:hidden relative flex justify-center items-center">
				<button
					aria-label="Scroll left"
					onClick={() => scrollByCard("left")}
					disabled={!canScrollLeft}
					className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md disabled:opacity-40 text-gray-800"
				>
					‹
				</button>

				<div
					ref={scrollerRef}
					className="no-scrollbar scroll-smooth flex gap-6 overflow-x-auto pb-4 pl-4 pr-8 snap-x snap-mandatory"
					style={{ WebkitOverflowScrolling: "touch" }}
				>
					{products.map((p) => (
						<div
							key={p.id}
							className="snap-start min-w-[220px] max-w-[280px] flex-shrink-0 rounded-lg bg-white p-3 shadow-sm"
						>
							<Link
								href={`/product/${p.slug}`}
								tabIndex={-1}
								className="block"
							>
								<div className="relative aspect-square mb-4 overflow-hidden rounded-md bg-gray-100">
									{p.imageUrl ? (
										<Image
											src={p.imageUrl}
											alt={p.name}
											fill
											className="object-cover"
										/>
									) : (
										<div className="flex h-full items-center justify-center text-gray-400">Img</div>
									)}
								</div>
							</Link>
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-900">
										<Link href={`/product/${p.slug}`}>{p.name}</Link>
									</h3>
									<p className="mt-1 text-xs text-gray-500">{p.brand}</p>
								</div>
								<div className="ml-4 text-sm font-semibold text-gray-900">₹{p.price}</div>
							</div>
						</div>
					))}
				</div>

				<button
					aria-label="Scroll right"
					onClick={() => scrollByCard("right")}
					disabled={!canScrollRight}
					className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md disabled:opacity-40 text-gray-800"
				>
					›
				</button>
			</div>

			{/* Desktop / large screens: grid layout */}
			<div className="hidden lg:block">
				<div className="grid grid-cols-4 gap-6">
					{products.map((p) => (
						<div
							key={p.id}
							className="rounded-lg bg-white p-4 shadow hover:shadow-md transition-shadow"
						>
							<Link
								href={`/product/${p.slug}`}
								tabIndex={-1}
								className="block"
							>
								<div className="relative pb-[100%] mb-4 overflow-hidden rounded-md bg-gray-100">
									{p.imageUrl ? (
										<Image
											src={p.imageUrl}
											alt={p.name}
											fill
											className="object-cover"
										/>
									) : (
										<div className="flex h-full items-center justify-center text-gray-400">Img</div>
									)}
								</div>
							</Link>
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-900">
										<Link href={`/product/${p.slug}`}>{p.name}</Link>
									</h3>
									<p className="mt-1 text-xs text-gray-500">{p.brand}</p>
								</div>
								<div className="ml-4 text-sm font-semibold text-gray-900">₹{p.price}</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
