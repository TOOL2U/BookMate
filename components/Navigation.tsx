'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Upload, Inbox, BarChart3, Settings, Wallet, Zap } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { scrollY } = useScroll();

  // Navbar background opacity increases on scroll
  const navOpacity = useTransform(scrollY, [0, 100], [0.8, 0.95]);
  const navBlur = useTransform(scrollY, [0, 100], [12, 20]);

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
    <motion.nav
      style={{
        backdropFilter: useTransform(navBlur, (v) => `blur(${v}px)`),
      }}
      className="sticky top-0 z-50 border-b border-border-card bg-bg-app/80 backdrop-blur-xl"
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between md:justify-between items-center h-16">
          {/* Logo/Title - Hidden on mobile, visible on desktop */}
          <Link href="/dashboard" className="hidden md:flex items-center gap-3 group relative">
            {/* Logo icon */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="relative p-2 bg-bg-card border border-border-card rounded-lg">
                <Zap className="w-5 h-5 text-accent group-hover:text-accent-purple transition-colors duration-300" />
              </div>
            </motion.div>

            {/* Title */}
            <div className="relative">
              <span className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors duration-300">
                BookMate
              </span>
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
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className={`
                      relative px-4 py-2 rounded-xl transition-all duration-300
                      ${active
                        ? 'text-accent shadow-[0_0_16px_rgba(0,217,255,0.4)]'
                        : 'text-text-secondary hover:text-text-primary'
                      }
                    `}
                  >
                    {/* Hover background */}
                    {hoveredItem === item.href && !active && (
                      <motion.div
                        className="absolute inset-0 bg-bg-card rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Content */}
                    <span className="relative flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${active ? 'text-accent' : ''}`} />
                      <span className="hidden sm:inline text-sm font-medium">
                        {item.label}
                      </span>
                    </span>

                    {/* Active indicator - cyan underline */}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

    </motion.nav>
  );
}
