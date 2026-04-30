'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion } from 'motion/react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Home', href: '#home' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Kontak', href: '#kontak' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo SMA IT Ulil Albab"
              width={56}
              height={56}
              className="h-14 w-14"
              priority
            />
            <div className="hidden md:block">
              <div className="text-[#2563EB] font-semibold text-sm leading-tight">
                SMA IT Ulil Albab
              </div>
              <div className="text-gray-600 text-xs">
                Sistem Informasi Akademik
              </div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-gray-700 hover:text-[#2563EB] transition-colors font-medium text-sm"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className="bg-[#2563EB] text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4"
          >
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block py-3 text-gray-700 hover:text-[#2563EB] transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className="w-full mt-2 bg-[#2563EB] text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
