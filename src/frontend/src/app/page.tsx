"use client";

import { useEffect } from 'react';
import { StoreProvider } from '@/context/StoreContext';
import { ProductGrid } from '@/components/ProductGrid';
import inventory from '@/data/inventory.json';
import { LiveAssistant } from '@/components/LiveAssistant';
import { CheckoutView } from '@/components/CheckoutView';
import { useStore } from '@/context/StoreContext';

// Shim inventory for global access by the useAgentSocket hook (prototype hack)
if (typeof window !== 'undefined') {
  (window as any).__INVENTORY__ = inventory;
}

function AppContent() {
  const { state } = useStore();

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white selection:bg-indigo-500/30">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg border-b border-white/5 bg-black/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="font-bold text-white">A</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Astral AI Store
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10">
        <ProductGrid />
      </div>

      {/* Agent Overlay */}
      <LiveAssistant />
    </main>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
