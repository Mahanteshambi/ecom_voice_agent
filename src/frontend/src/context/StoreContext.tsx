"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, Action, Product } from '@/types';
import inventory from '@/data/inventory.json';

const initialState: AppState = {
    products: inventory as Product[],
    filteredProducts: inventory as Product[],
    highlightedProductId: null,
    cart: [],
    isCheckout: false,
    filterCriteria: null,
};

function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_PRODUCTS':
            return { ...state, products: action.payload, filteredProducts: action.payload };

        case 'FILTER_PRODUCTS': {
            console.log("DEBUG: Reducer processing FILTER_PRODUCTS", action.payload); // ADDED
            // Normalize: "apple_headphones" -> "apple headphones"
            const rawCriteria = action.payload.toLowerCase().replace(/_/g, ' ');
            const terms = rawCriteria.split(' ').filter(t => t.length > 0);

            if (terms.length === 0 || rawCriteria === 'all') {
                console.log("DEBUG: Filter reset to all products"); // ADDED
                return { ...state, filteredProducts: state.products, filterCriteria: null };
            }

            const filtered = state.products.filter(p => {
                // Check if ALL terms match the product (AND logic)
                return terms.every(term => {
                    const match = p.category.toLowerCase().includes(term) ||
                        p.name.toLowerCase().includes(term) ||
                        p.visual_tags.some(tag => tag.toLowerCase().includes(term)) ||
                        JSON.stringify(p.specs).toLowerCase().includes(term);
                    return match;
                });
            });
            console.log(`DEBUG: Filtered ${state.products.length} down to ${filtered.length} items`); // ADDED

            return { ...state, filteredProducts: filtered, filterCriteria: rawCriteria };
        }

        case 'HIGHLIGHT_PRODUCT':
            return { ...state, highlightedProductId: action.payload };

        case 'ADD_TO_CART': {
            const existingItem = state.cart.find(item => item.id === action.payload.id);
            let newCart;
            if (existingItem) {
                newCart = state.cart.map(item =>
                    item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                newCart = [...state.cart, { ...action.payload, quantity: 1 }];
            }
            return { ...state, cart: newCart };
        }

        case 'NAVIGATE_CHECKOUT':
            return { ...state, isCheckout: true };

        case 'NAVIGATE_HOME':
            return { ...state, isCheckout: false };

        default:
            return state;
    }
}

const StoreContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Initialize with inventory if not set (though initialState handles it)
    // useEffect(() => {
    //   dispatch({ type: 'SET_PRODUCTS', payload: inventory as Product[] });
    // }, []);

    return (
        <StoreContext.Provider value={{ state, dispatch }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}
