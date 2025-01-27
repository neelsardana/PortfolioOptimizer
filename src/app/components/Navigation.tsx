'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const getLinkClassName = (path: string) => {
    const isActive = pathname === path;
    return `text-sm ${
      isActive 
        ? 'text-white font-medium' 
        : 'text-white/70 hover:text-white transition-colors'
    }`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111111]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-emerald-500"
            >
              <path 
                d="M12 4L4 8L12 12L20 8L12 4Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M4 16L12 20L20 16" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M4 12L12 16L20 12" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <Link href="/" className="text-lg font-medium tracking-tight">
              quantum
            </Link>
          </div>

          <div className="flex items-center space-x-12">
            <div className="flex items-center space-x-8">
              <Link href="/overview" className={getLinkClassName('/overview')}>
                Overview
              </Link>
              <Link href="/insights" className={getLinkClassName('/insights')}>
                Insights
              </Link>
              <Link href="/analytics" className={getLinkClassName('/analytics')}>
                Analytics
              </Link>
              <Link href="/about" className={getLinkClassName('/about')}>
                About
              </Link>
            </div>
            <Link 
              href="/contact" 
              className="text-sm px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 