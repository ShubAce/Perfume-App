"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const FooterSection = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 md:border-none">
      {/* Mobile Header */}
      <button
        className="flex w-full items-center justify-between py-4 text-sm font-semibold tracking-widest text-gray-600 uppercase md:hidden"
        onClick={() => setOpen(!open)}
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Desktop Title */}
      <h4 className="hidden md:block mb-4 text-sm font-semibold tracking-widest text-gray-600 uppercase">
        {title}
      </h4>

      {/* Links */}
      <ul
        className={`space-y-3 text-sm text-gray-800 ${
          open ? "block pb-4" : "hidden"
        } md:block`}
      >
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="hover:underline transition"
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
  return (
    <footer className="bg-white px-6 py-12">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-10">
        <FooterSection
          title="Shop by Collections"
          links={[
            { label: "Niche Parfum", href: "/collections/niche-parfum" },
            { label: "Body Mist", href: "/collections/body-mist" },
            { label: "RollOn", href: "/collections/rollon" },
            { label: "Body Lotion", href: "/collections/body-lotion" },
            { label: "Shower Gel", href: "/collections/shower-gel" },
          ]}
        />

        <FooterSection
          title="Quick Links"
          links={[
            { label: "Home", href: "/" },
            { label: "About Us", href: "/aboutus" },
            { label: "Contact Us", href: "/contact" },
          ]}
        />

        <FooterSection
          title="Important Links"
          links={[
            { label: "Terms and Conditions", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Return & Refund Policy", href: "/returns" },
          ]}
        />
      </div>
    </footer>
  );
}
