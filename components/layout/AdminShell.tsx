'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Settings,
  Inbox,
  Menu,
  X,
  Shield
} from 'lucide-react';

interface AdminShellProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'P&L', href: '/pnl', icon: TrendingUp },
  { name: 'Balances', href: '/balance', icon: Wallet },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin', href: '/admin', icon: Shield },
];

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-app via-bg-card to-bg-app">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-purple/5 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64
        bg-gradient-to-b from-bg-card to-bg-app
        border-r border-border-card
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo / Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-blue flex items-center justify-center shadow-[0_0_20px_rgba(0,217,255,0.3)]">
              <span className="text-text-primary font-bold text-sm">BM</span>
            </div>
            <div>
              <h1 className="text-text-primary font-semibold text-sm">BookMate</h1>
              <p className="text-text-secondary text-xs">Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-accent/50 to-accent-blue text-text-primary shadow-[0_0_20px_rgba(0,217,255,0.3)]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-app/60'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-card">
          <div className="text-xs text-text-secondary">
            <p>Desktop Analytics Console</p>
            <p className="mt-1 text-text-tertiary">Use mobile app for data entry</p>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64 relative z-10">
        {/* Mobile menu button - floating */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-3 bg-[#0A0A0A] backdrop-blur-sm border border-border-card rounded-lg text-text-secondary hover:text-text-primary shadow-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page content - Full width with responsive padding */}
        <main className="p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

