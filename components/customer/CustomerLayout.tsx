'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Coins,
  User,
  LogOut,
  Menu,
  BookOpen,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/loans', label: 'My Loans', icon: Coins },
  { href: '/loan-products', label: 'Loan Products', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
];

interface CustomerLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function CustomerLayout({ children, title, subtitle }: CustomerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/loans') return pathname.startsWith('/loans');
    return pathname === href;
  };

  return (
    <div className="min-h-screen flex bg-[#F7F7F8]">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E8E8E8] flex flex-col
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Brand */}
        <div className="px-6 py-6 border-b border-[#E8E8E8]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center font-bold text-white text-lg shadow-md shadow-brand/20">
              RC
            </div>
            <div>
              <div className="font-extrabold text-text text-base leading-tight tracking-tight">Rapid</div>
              <div className="font-extrabold text-brand text-base leading-tight tracking-tight">Consultancy</div>
            </div>
          </div>
          {user && (
            <div className="mt-4 rounded-2xl bg-[#F7F7F8] px-3 py-2.5">
              <div className="text-xs text-[#888888]">Logged in as</div>
              <div className="text-sm font-semibold text-text truncate">{user.name}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors
                ${isActive(href)
                  ? 'bg-brand text-white shadow-sm shadow-brand/20'
                  : 'text-[#555555] hover:bg-[#F7F7F8] hover:text-text'}
              `}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
              {label}
              {isActive(href) && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E8E8]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-[#555555] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#E8E8E8] px-4 lg:px-8 py-4 flex items-center gap-4">
          <button
            className="lg:hidden p-1 rounded-xl text-[#555555] hover:bg-[#F7F7F8]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0">
            {title && <h1 className="text-lg font-bold text-text truncate">{title}</h1>}
            {subtitle && <p className="text-xs text-[#888888] mt-0.5 truncate">{subtitle}</p>}
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm rounded-2xl px-3 py-1.5 hover:bg-[#F7F7F8] transition-colors group"
            title="View Profile"
          >
            <div className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-brand/20 group-hover:bg-brand/90 transition-colors">
              {user?.name?.slice(0, 1).toUpperCase() ?? 'U'}
            </div>
            <span className="hidden lg:block font-medium text-text">{user?.name}</span>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
