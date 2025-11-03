'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, Inbox, BarChart3, Settings, Sparkles, Wallet } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navItems = [
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/inbox', label: 'Inbox', icon: Inbox },
    { href: '/pnl', label: 'P&L', icon: BarChart3 },
    { href: '/balance', label: 'Balance', icon: Wallet },
    { href: '/admin', label: 'Admin', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#000000] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between md:justify-between items-center h-16">
          {/* Logo/Title - Hidden on mobile, visible on desktop */}
          <Link href="/upload" className="hidden md:flex items-center gap-3 group relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="relative p-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg backdrop-blur-sm transition-all duration-300 group-hover:border-[#00D9FF] group-hover:shadow-glow-cyan">
                <Sparkles className="w-5 h-5 text-[#A0A0A0] group-hover:text-[#00D9FF] transition-colors" />
              </div>
            </motion.div>

            <div className="relative">
              <motion.span className="text-lg font-bold text-[#FFFFFF] group-hover:text-[#00D9FF] transition-colors">
                BookMate
              </motion.span>
            </div>
          </Link>

          {/* Navigation Links - Centered on mobile, right-aligned on desktop */}
          <div className="flex gap-2 mx-auto md:mx-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="relative group"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`
                      relative px-4 py-2 rounded-xl transition-all duration-300
                      ${active
                        ? 'text-[#00D9FF] bg-[#1A1A1A] border border-[#00D9FF] shadow-glow-cyan'
                        : 'text-[#A0A0A0] hover:text-[#FFFFFF] bg-transparent border border-transparent'
                      }
                    `}
                  >
                    {/* Hover glow effect */}
                    {hoveredItem === item.href && !active && (
                      <motion.div
                        className="absolute inset-0 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Content */}
                    <span className="relative flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${active ? 'text-[#00D9FF]' : ''}`} />
                      <span className="hidden sm:inline text-sm font-medium">
                        {item.label}
                      </span>
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

