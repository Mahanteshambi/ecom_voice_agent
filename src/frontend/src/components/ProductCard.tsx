"use client";

import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Plus, Star } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

interface ProductCardProps {
    product: Product;
    isHighlighted: boolean;
}

export function ProductCard({ product, isHighlighted }: ProductCardProps) {
    const { dispatch } = useStore();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
                opacity: 1,
                scale: isHighlighted ? 1.05 : 1,
                borderColor: isHighlighted ? '#10b981' : 'transparent',
                boxShadow: isHighlighted ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none'
            }}
            transition={{ duration: 0.3 }}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm",
                isHighlighted && "bg-white/10 ring-2 ring-emerald-500"
            )}
        >
            <div className="aspect-[4/3] w-full overflow-hidden bg-white/5 p-6 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-110"
                />
                {isHighlighted && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                        Recommended
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-6">
                <div className="mb-4">
                    <p className="text-sm font-medium text-indigo-400 mb-1 capitalize">
                        {product.category}
                    </p>
                    <h3 className="text-xl font-bold text-white leading-tight">
                        {product.name}
                    </h3>
                </div>

                <div className="mb-6 space-y-2 text-sm text-zinc-400">
                    {Object.entries(product.specs).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0 last:pb-0">
                            <span className="capitalize opacity-70">{key}:</span>
                            <span className="font-medium text-zinc-200 truncate ml-2 max-w-[60%] text-right">{Array.isArray(value) ? value.join(', ') : value}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex flex-col">
                        <span className="text-sm text-zinc-500">Price</span>
                        <span className="text-2xl font-bold text-white">${product.price.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'ADD_TO_CART', payload: product })}
                        className="flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                        aria-label="Add to cart"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
