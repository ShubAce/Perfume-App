"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, ShoppingBag, User, LogIn } from "lucide-react";

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
};

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const isLoggedIn = true;

	const menuItems = [
		{ label: "Aqua Perfume", href: ROUTES.collections.aquaPerfume },
		{ label: "Attars", href: ROUTES.collections.attars },
		{ label: "Personal Care", href: ROUTES.collections.personalCare },
		{ label: "About Us", href: ROUTES.about },
		{ label: "New Arrivals", href: ROUTES.collections.newArrivals },
	];

	return (
		<>
			<nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					{/* Mobile Menu Button */}
					<button
						aria-label="Open menu"
						onClick={() => setOpen(true)}
						className="-ml-2 mr-2 inline-flex items-center rounded-md p-2 text-gray-700 md:hidden"
					>
						<Menu className="h-6 w-6" />
					</button>

					{/* Logo */}
					<div className="flex flex-1 items-center justify-center md:justify-start">
						<Link
							href={ROUTES.home}
							className="text-xl font-bold tracking-tighter text-gray-800 md:text-2xl"
						>
							SCENTOS
						</Link>
					</div>

					{/* Right Icons */}
					<div className="flex items-center gap-4">
						<Link
							href={ROUTES.search}
							className="p-2 text-gray-700"
						>
							<Search className="h-5 w-5" />
						</Link>

						<Link
							href={ROUTES.cart}
							className="p-2 text-gray-700"
						>
							<ShoppingBag className="h-5 w-5" />
						</Link>

						{isLoggedIn ? (
							<Link
								href={ROUTES.profile}
								className="p-2 text-gray-700"
							>
								<User className="h-5 w-5" />
							</Link>
						) : (
							<Link
								href={ROUTES.login}
								className="inline-flex items-center rounded-full bg-black px-3 py-1 text-sm font-bold text-white"
							>
								<LogIn className="mr-2 h-4 w-4" />
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
							className="rounded-full bg-gray-100 p-2"
						>
							<X className="h-5 w-5 text-gray-800" />
						</button>

						<Link
							href={ROUTES.home}
							className="text-xl font-bold tracking-tighter text-gray-800"
							onClick={() => setOpen(false)}
						>
							SCENTOS
						</Link>

						<div className="w-8" />
					</div>

					<ul className="divide-y px-4">
						{menuItems.map(({ label, href }) => (
							<li
								key={label}
								className="py-6"
							>
								<Link
									href={href}
									onClick={() => setOpen(false)}
									className="flex items-center justify-between text-lg text-gray-800"
								>
									{label}
									<span>→</span>
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}
		</>
	);
}
