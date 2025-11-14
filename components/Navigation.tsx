'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Upload, Inbox, BarChart3, Settings, Sparkles, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import LogoBM from './LogoBM';

export default function Navigation() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { scrollY } = useScroll();

  // Navbar background opacity increases on scroll
  const navBlur = useTransform(scrollY, [0, 100], [12, 20]);

  // Fetch current user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.user?.email || null);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    fetchUser();
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Base navigation items
  const baseNavItems = [
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/inbox', label: 'Activity', icon: Inbox },
    { href: '/pnl', label: 'P&L', icon: BarChart3 },
    { href: '/balance', label: 'Balance', icon: Wallet },
  ];

  // Add Admin button only for admin@siamoon.com
  const navItems = userEmail === 'admin@siamoon.com'
    ? [...baseNavItems, { href: '/admin/accounts/new', label: 'Admin', icon: Settings }]
    : baseNavItems;

  return (
    <motion.nav
      style={{
        backdropFilter: useTransform(navBlur, (v) => `blur(${v}px)`),
      }}
      className="sticky top-0 z-50 border-b border-border bg-black/75 backdrop-blur-xl"
    >
      {/* Subtle yellow accent line at top */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow/20 to-transparent"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{ backgroundSize: '200% 100%' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between md:justify-between items-center h-14">
          {/* Logo/Title - Hidden on mobile, visible on desktop */}
          <Link href="/upload" className="hidden md:flex items-center gap-3 group relative">
            {/* Subtle hover glow */}
            <motion.div
              className="absolute inset-0 bg-yellow/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{ transform: 'scale(1.5)' }}
            />

            {/* BM Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <LogoBM size={32} />
            </motion.div>

            {/* Title - Bebas Neue font */}
            <div className="relative">
              <motion.span
                className="text-xl font-bebasNeue tracking-wide text-yellow uppercase"
              >
                BookMate
              </motion.span>
            </div>
          </Link>

          {/* Navigation Links - Centered on mobile, right-aligned on desktop */}
          <div className="flex gap-1 mx-auto md:mx-0">
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
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`
                      relative px-3 py-2 rounded-xl transition-all duration-200
                      ${active
                        ? 'text-yellow bg-yellow/10 shadow-glow-sm'
                        : 'text-muted hover:text-fg hover:bg-yellow/5 hover:shadow-glow-sm'
                      }
                    `}
                  >
                    {/* Subtle glow on hover */}
                    {hoveredItem === item.href && !active && (
                      <motion.div
                        className="absolute inset-0 bg-yellow/5 rounded-xl shadow-glow-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}

                    {/* Content */}
                    <span className="relative flex items-center gap-2 font-aileron">
                      <Icon className={`w-4 h-4 icon ${active ? 'text-yellow' : ''}`} strokeWidth={2} />
                      <span className="hidden sm:inline text-sm font-medium">
                        {item.label}
                      </span>
                    </span>

                    {/* Active indicator - yellow underline */}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-yellow/60 rounded-full shadow-glow-sm"
                        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                      />
                    )}

                    {/* Yellow glow on hover for active item */}
                    {hoveredItem === item.href && active && (
                      <motion.div
                        className="absolute inset-0 shadow-glow rounded-xl pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </motion.nav>
  );
}

