export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    specs: Record<string, string | string[]>;
    visual_tags: string[];
    image: string;
    description: string;
}

export type AgentActionType = 'FILTER' | 'HIGHLIGHT' | 'NAVIGATE' | 'ADD_TO_CART';

export interface CartItem extends Product {
    quantity: number;
}

export interface AppState {
    products: Product[];
    filteredProducts: Product[];
    highlightedProductId: string | null;
    cart: CartItem[];
    isCheckout: boolean;
    filterCriteria: string | null; // e.g., 'laptops', 'cameras', or specific search term
}

export type Action =
    | { type: 'SET_PRODUCTS'; payload: Product[] }
    | { type: 'FILTER_PRODUCTS'; payload: string } // category or search term
    | { type: 'HIGHLIGHT_PRODUCT'; payload: string | null } // product ID
    | { type: 'ADD_TO_CART'; payload: Product }
    | { type: 'NAVIGATE_CHECKOUT' }
    | { type: 'NAVIGATE_HOME' };
