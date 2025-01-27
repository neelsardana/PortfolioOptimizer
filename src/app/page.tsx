'use client';

import Link from 'next/link';
import FloatingBackground from './components/FloatingBackground';

export default function Home() {
  return (
    <main className="min-h-screen">
      <FloatingBackground />

      <section className="min-h-screen flex items-center px-16 relative">
        <div className="max-w-3xl z-10">
          <h1 className="text-6xl font-medium tracking-tight leading-none mb-6">
            Rethinking The Science of Portfolio Intelligence
          </h1>
          <p className="text-lg text-white/80 max-w-2xl leading-relaxed mb-8">
            Advanced machine learning algorithms working in harmony to predict market movements 
            and optimize your investment strategy. Welcome to the future of wealth management.
          </p>
          <Link 
            href="/optimize" 
            className="inline-flex items-center px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            Get Started
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
