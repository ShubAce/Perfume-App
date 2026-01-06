"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Instagram, Facebook, Twitter, Mail, MapPin, Phone } from "lucide-react";

const FooterSection = ({ title, links }: { title: string; links: { label: string; href: string }[] }) => {
	const [open, setOpen] = useState(false);

	return (
		<div className="border-b border-gray-200 md:border-none">
			{/* Mobile Header */}
			<button
				className="flex w-full items-center justify-between py-4 text-sm font-semibold tracking-wider text-gray-700 uppercase md:hidden"
				onClick={() => setOpen(!open)}
			>
				{title}
				<ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
			</button>

			{/* Desktop Title */}
			<h4 className="hidden md:block mb-5 text-sm font-semibold tracking-wider text-gray-700 uppercase">{title}</h4>

			{/* Links */}
			<ul className={`space-y-3 text-sm ${open ? "block pb-4" : "hidden"} md:block`}>
				{links.map((link) => (
					<li key={link.label}>
						<Link
							href={link.href}
							className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
						>
							{link.label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
};

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="bg-gray-50 border-t border-gray-200">
			{/* Main Footer Content */}
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
					{/* Brand Column */}
					<div className="md:col-span-2 lg:col-span-1">
						<Link
							href="/"
							className="inline-block text-2xl font-bold tracking-tight mb-4"
						>
							<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">SCENTOS</span>
						</Link>
						<p className="text-sm text-gray-600 mb-6 max-w-xs">
							Discover your signature scent. Premium fragrances crafted for every mood and occasion.
						</p>
						{/* Social Links */}
						<div className="flex items-center gap-4">
							<a
								href="#"
								className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
								aria-label="Instagram"
							>
								<Instagram className="h-5 w-5" />
							</a>
							<a
								href="#"
								className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
								aria-label="Facebook"
							>
								<Facebook className="h-5 w-5" />
							</a>
							<a
								href="#"
								className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
								aria-label="Twitter"
							>
								<Twitter className="h-5 w-5" />
							</a>
						</div>
					</div>

					{/* Shop Links */}
					<FooterSection
						title="Shop"
						links={[
							{ label: "For Him", href: "/shop/men" },
							{ label: "For Her", href: "/shop/women" },
							{ label: "Unisex", href: "/shop/unisex" },
							{ label: "New Arrivals", href: "/shop/new" },
							{ label: "Best Sellers", href: "/shop/all" },
						]}
					/>

					{/* Company Links */}
					<FooterSection
						title="Company"
						links={[
							{ label: "About Us", href: "/aboutus" },
							{ label: "Contact", href: "/contact" },
							{ label: "Scent Quiz", href: "/quiz" },
							{ label: "Gift Cards", href: "/gift-cards" },
						]}
					/>

					{/* Support Links */}
					<FooterSection
						title="Support"
						links={[
							{ label: "FAQ", href: "/faq" },
							{ label: "Shipping Info", href: "/shipping" },
							{ label: "Returns & Exchanges", href: "/returns" },
							{ label: "Track Order", href: "/track-order" },
						]}
					/>
				</div>
			</div>

			{/* Bottom Bar */}
			<div className="border-t border-gray-200">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
						<p className="text-sm text-gray-500 text-center sm:text-left">© {currentYear} SCENTOS. All rights reserved.</p>
						<div className="flex items-center gap-6 text-sm">
							<Link
								href="/privacy"
								className="text-gray-500 hover:text-purple-600 transition-colors"
							>
								Privacy Policy
							</Link>
							<Link
								href="/terms"
								className="text-gray-500 hover:text-purple-600 transition-colors"
							>
								Terms of Service
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
