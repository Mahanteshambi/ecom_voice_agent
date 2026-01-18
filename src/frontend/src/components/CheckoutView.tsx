"use client";

import { useStore } from '@/context/StoreContext';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function CheckoutView() {
    const { state, dispatch } = useStore();
    const [step, setStep] = useState<'cart' | 'address' | 'payment' | 'success'>('cart');

    const total = state.cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    if (state.cart.length === 0 && step === 'cart') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
                <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
                <button
                    onClick={() => dispatch({ type: 'NAVIGATE_HOME' })}
                    className="text-indigo-400 hover:text-indigo-300 underline"
                >
                    Go back to shopping
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 text-white">
            <button
                onClick={() => dispatch({ type: 'NAVIGATE_HOME' })}
                className="flex items-center text-zinc-400 hover:text-white mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Store
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Section */}
                <div className="lg:col-span-2">
                    <h1 className="text-3xl font-bold mb-6">Checkout</h1>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        {state.cart.map(item => (
                            <div key={item.id} className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0">
                                <img src={item.image} alt={item.name} className="w-20 h-20 object-contain bg-white/5 rounded-lg p-2" />
                                <div className="flex-1">
                                    <h3 className="font-bold">{item.name}</h3>
                                    <p className="text-sm text-zinc-400">{item.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono">${item.price}</p>
                                    <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                                </div>
                            </div>
                        ))}

                        <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                            <span className="text-zinc-400">Total</span>
                            <span className="text-2xl font-bold">${total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Mock Form */}
                    <div className="mt-8">
                        <h2 className="text-xl font-bold mb-4">Shipping Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="First Name" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <input type="text" placeholder="Last Name" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <input type="text" placeholder="Address" className="col-span-2 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 rounded-2xl p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                        <button className="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Pay ${total.toLocaleString()}
                        </button>
                        <p className="text-xs text-center text-zinc-400 mt-4">
                            Secure checkout powered by Astral Pay.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
