"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, CartItem } from "@/types";

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    subtotal: number;
    tax: number;
    total: number;
    itemCount: number;
    discount: { type: 'amount' | 'percent', value: number };
    setDiscount: (discount: { type: 'amount' | 'percent', value: number }) => void;
    subtotalRaw: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("segadty_pos_cart");
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error("Failed to parse cart from localStorage", error);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("segadty_pos_cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                // Check if we have enough stock
                if (existing.cartQuantity >= product.quantity) {
                    alert(`عذراً، المخزون المتوفر من ${product.name} هو ${product.quantity} فقط`);
                    return prev;
                }
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            }

            if (product.quantity <= 0) {
                alert(`عذراً، هذا المنتج غير متوفر في المخزون حالياً`);
                return prev;
            }

            return [...prev, { ...product, cartQuantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart((prev) =>
            prev.map((item) => {
                if (item.id === productId) {
                    if (quantity > item.quantity) {
                        alert(`عذراً، المخزون المتوفر هو ${item.quantity} فقط`);
                        return item;
                    }
                    return { ...item, cartQuantity: quantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const [discount, setDiscount] = useState<{ type: 'amount' | 'percent', value: number }>({ type: 'amount', value: 0 });

    // Calculations (Assumes Tax Inclusive Prices)
    const subtotalRaw = cart.reduce(
        (acc, item) => acc + item.selling_price * item.cartQuantity,
        0
    );

    let discountAmount = 0;
    if (discount.type === 'amount') {
        discountAmount = discount.value;
    } else {
        discountAmount = subtotalRaw * (discount.value / 100);
    }

    // Ensure discount doesn't exceed total
    if (discountAmount > subtotalRaw) discountAmount = subtotalRaw;

    const total = subtotalRaw - discountAmount;
    const subtotal = total / 1.15; // Price before tax
    const tax = total - subtotal;   // The tax amount

    // Original subtotal (for display if needed)
    // const grossTotal = subtotalRaw;

    const itemCount = cart.reduce((acc, item) => acc + item.cartQuantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                subtotal, // This is now Net Subtotal (excl tax)
                tax,
                total,    // This is Net Total (inc tax)
                itemCount,
                discount,
                setDiscount,
                subtotalRaw // Gross Total before discount
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
