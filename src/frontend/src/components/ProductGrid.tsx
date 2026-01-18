"use client";

import { useStore } from '@/context/StoreContext';
import { ProductCard } from './ProductCard';
import { motion } from 'framer-motion';

export function ProductGrid() {
    const { state } = useStore();
    const { filteredProducts, highlightedProductId } = state;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {state.filterCriteria ? `Results for "${state.filterCriteria}"` : "Featured Products"}
                    </h2>
                    <p className="text-zinc-400">
                        {filteredProducts.length} items available
                    </p>
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                    <p className="text-xl">No products found for your search.</p>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isHighlighted={product.id === highlightedProductId}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
}
