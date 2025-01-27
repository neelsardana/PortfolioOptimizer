'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InvestmentForm from '../components/InvestmentForm';
import Navigation from '../components/Navigation';
import FloatingBackground from '../components/FloatingBackground';

type PortfolioData = {
  allocation: {
    [key: string]: {
      amount: number;
      percentage: number;
      expectedReturn: number;
      volatility: number;
    };
  };
  metrics: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
};

export default function OptimizePage() {
  const router = useRouter();

  const handleOptimize = (data: PortfolioData) => {
    localStorage.setItem('portfolioData', JSON.stringify(data));
    router.push('/overview');
  };

  return (
    <main className="min-h-screen bg-[#111111]">
      <Navigation />
      <FloatingBackground />

      <div className="w-full pt-32 pb-16">
        <div className="text-center mb-16 px-4">
          <h1 className="text-6xl font-medium tracking-tight mb-6">
            Optimize Your Portfolio
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Let our advanced AI algorithms create a personalized investment strategy 
            tailored to your goals and risk tolerance.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto px-4">
          <InvestmentForm onOptimize={handleOptimize} />
        </div>
      </div>
    </main>
  );
} 