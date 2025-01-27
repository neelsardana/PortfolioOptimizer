import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quantum Portfolio Intelligence',
  description: 'Advanced machine learning algorithms working in harmony to predict market movements and optimize your investment strategy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#111111] text-white antialiased`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
