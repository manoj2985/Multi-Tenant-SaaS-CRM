import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function MainLayout({ children, healthData, isConnected }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header healthData={healthData} isConnected={isConnected} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
