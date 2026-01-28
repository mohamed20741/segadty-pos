"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, Receipt } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"; // We might need to create this or use simple overflow
import { useState } from "react";
import { CheckoutModal } from "./CheckoutModal";

export function CartSidebar() {
    const { cart, removeFromCart, updateQuantity, clearCart, subtotal, tax, total, itemCount } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    if (cart.length === 0) {
        return (
            <div className="h-full bg-white border-r border-gray-100 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">السلة فارغة</h3>
                <p className="text-gray-500 text-sm mt-2">اختر منتجات من القائمة لإضافتها هنا</p>
            </div>
        );
    }

    return (
        <>
            <div className="h-full bg-white border-r border-gray-100 flex flex-col shadow-xl z-20 w-96 max-w-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-gray-800">السلة الحالية</h2>
                        <span className="bg-primary text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
                            {itemCount}
                        </span>
                    </div>
                    <button
                        onClick={clearCart}
                        className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" />
                        تفريغ
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map((item) => (
                        <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 group hover:border-primary/20 transition-colors">
                            {/* Small Image Placeholder */}
                            <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-xs text-secondary shrink-0">
                                {item.name.charAt(0)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                                <p className="text-primary text-sm font-bold mt-1">
                                    {(item.selling_price * item.cartQuantity).toLocaleString()} ر.س
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-1 py-1 shadow-sm">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm font-bold w-4 text-center">{item.cartQuantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer / Calculations */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>المجموع الفرعي</span>
                            <span className="font-medium">{subtotal.toLocaleString()} ر.س</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>الضريبة (15%)</span>
                            <span className="font-medium">{tax.toLocaleString()} ر.س</span>
                        </div>
                        <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center">
                            <span className="font-bold text-gray-800 text-lg">الإجمالي</span>
                            <span className="font-bold text-primary text-xl">{total.toLocaleString()} ر.س</span>
                        </div>
                    </div>

                    <Button
                        className="w-full gap-2 h-12 text-lg shadow-lg shadow-primary/20"
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        <Receipt className="w-5 h-5" />
                        <span>إتمام الطلب</span>
                    </Button>
                </div>
            </div>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
            />
        </>
    );
}
