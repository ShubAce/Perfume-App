"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, User, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import GlobalSearch from "./GlobalSearch";

export const ROUTES = {
	home: "/",
	about: "/aboutus",
	collections: {
		aquaPerfume: "/collections/aqua-perfume",
		attars: "/collections/attars",
		personalCare: "/collections/personal-care",
		newArrivals: "/collections/new-arrivals",
	},
	search: "/search",
	cart: "/cart",
	login: "/login",
	profile: "/profile",
	quiz: "/quiz",
};

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { data: session, status } = useSession();
	const { itemCount } = useCart();

	useEffect(() => {
		setMounted(true);
	}, []);

	// Avoid auth UI flicker on first paint (SSR/hydration) by waiting for mount + session resolution
	const isAuthReady = mounted && status !== "loading";
	const isLoggedIn = isAuthReady && status === "authenticated" && !!session?.user;

	// Handle scroll effect
	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Keyboard shortcut for search
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				const searchButton = document.querySelector("[data-search-trigger]") as HTMLButtonElement;
				searchButton?.click();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const menuItems = [
		{ label: "For Him", href: "/shop/men" },
		{ label: "For Her", href: "/shop/women" },
		{ label: "Unisex", href: "/shop/unisex" },
		{ label: "New Arrivals", href: "/shop/new" },
		{ label: "Find Your Scent", href: "/quiz", highlight: true },
		{ label: "About Us", href: ROUTES.about },
	];

	return (
		<>
			<nav
				className={`sticky top-0 z-50 w-full transition-all duration-300 ${
					scrolled ? "border-b border-gray-100 bg-white/95 backdrop-blur-lg shadow-sm" : "bg-white/90 backdrop-blur-md"
				}`}
			>
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					{/* Mobile Menu Button */}
					<button
						aria-label="Open menu"
						onClick={() => setOpen(true)}
						className="-ml-2 mr-2 inline-flex items-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
					>
						<Menu className="h-6 w-6" />
					</button>

					{/* Logo */}
					<div className="flex items-center md:flex-none">
						<Link
							href={ROUTES.home}
							className="text-xl font-bold tracking-tighter text-gray-800 md:text-2xl"
						>
							<span className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">SCENTOS</span>
						</Link>
					</div>


					{/* Right Icons */}
					<div className="flex items-center gap-2">
						{/* Global Search */}
						<GlobalSearch />

						{/* Cart */}
						<Link
							href={ROUTES.cart}
							className="relative p-2 text-gray-700 hover:text-purple-600 transition-colors"
						>
							<ShoppingBag className="h-5 w-5" />
							{itemCount > 0 && (
								<span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-r from-purple-600 to-pink-600 text-xs font-bold text-white">
									{itemCount > 9 ? "9+" : itemCount}
								</span>
							)}
						</Link>

						{/* User Menu */}
						{!isAuthReady ? (
							<div className="p-2">
								<div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
							</div>
						) : isLoggedIn ? (
							<Link
								href={ROUTES.profile}
								className="p-2 text-gray-700 hover:text-purple-600 transition-colors"
							>
								{session?.user?.image ? (
									<img
										src={session.user.image}
										alt="Profile"
										className="h-6 w-6 rounded-full ring-2 ring-purple-100"
									/>
								) : (
									<User className="h-5 w-5" />
								)}
							</Link>
						) : (
							<Link
								href={ROUTES.login}
								className="hidden sm:inline-flex items-center gap-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-shadow"
							>
								<LogIn className="h-4 w-4" />
								Login
							</Link>
						)}
					</div>
				</div>
			</nav>

			{/* Mobile Menu */}
			{open && (
				<div className="fixed inset-0 z-50 bg-white">
					<div className="flex items-center justify-between border-b px-4 py-4">
						<button
							aria-label="Close menu"
							onClick={() => setOpen(false)}
							className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 transition-colors"
						>
							<X className="h-5 w-5 text-gray-800" />
						</button>

						<Link
							href={ROUTES.home}
							className="text-xl font-bold tracking-tighter"
							onClick={() => setOpen(false)}
						>
							<span className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">SCENTOS</span>
						</Link>

						<div className="w-9" />
					</div>

					<div className="p-4">
						{/* Mobile Search */}
						<div className="mb-6">
							<GlobalSearch />
						</div>

						<ul className="divide-y">
							{menuItems.map(({ label, href, highlight }) => (
								<li
									key={label}
									className="py-4"
								>
									<Link
										href={href}
										onClick={() => setOpen(false)}
										className={`flex items-center justify-between text-lg ${
											highlight ? "text-purple-600 font-semibold" : "text-gray-800"
										}`}
									>
										{label}
										<span>→</span>
									</Link>
								</li>
							))}
						</ul>

						{/* Mobile Login Button */}
						{isAuthReady && !isLoggedIn && (
							<div className="mt-6">
								<Link
									href={ROUTES.login}
									onClick={() => setOpen(false)}
									className="flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-medium text-white"
								>
									<LogIn className="h-4 w-4" />
									Login / Sign Up
								</Link>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
