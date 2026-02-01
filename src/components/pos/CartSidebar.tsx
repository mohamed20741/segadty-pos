"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, Receipt, Trash, ArrowRight } from "lucide-react";
import { useState } from "react";
import { CheckoutModal } from "./CheckoutModal";
import { cn } from "@/lib/utils";

export function CartSidebar() {
    const { cart, removeFromCart, updateQuantity, clearCart, subtotal, tax, total, itemCount } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    if (cart.length === 0) {
        return (
            <div className="h-full bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 relative">
                    <ShoppingCart className="w-10 h-10 text-gray-200" />
                    <div className="absolute top-0 right-0 w-4 h-4 bg-gray-100 rounded-full animate-ping"></div>
                </div>
                <h3 className="font-black text-gray-800 text-xl mb-2">السلة فارغة حالياً</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[200px]">
                    قم بإضافة المنتجات من القائمة لبدء عملية بيع جديدة
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="h-full bg-white flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-800">قائمة الطلب</h2>
                            <p className="text-xs text-gray-400 font-medium">{itemCount} من العناصر المختارة</p>
                        </div>
                    </div>
                    <button
                        onClick={clearCart}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                        title="تفريغ السلة"
                    >
                        <Trash className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {cart.map((item) => (
                        <div
                            key={item.id}
                            className="flex gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 group hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
                        >
                            {/* Small Image Placeholder */}
                            <div className="w-16 h-16 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-xl font-black text-primary/20 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                {item.name.charAt(0)}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.selling_price.toLocaleString()} ر.س للقطعة</p>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 px-1 py-1 shadow-sm">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-red-50 hover:text-red-500 rounded-md text-gray-400 transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-sm font-black w-6 text-center text-gray-700">{item.cartQuantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-green-50 hover:text-green-500 rounded-md text-gray-400 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-primary font-black text-sm">
                                        {(item.selling_price * item.cartQuantity).toLocaleString()} <span className="text-[10px]">ر.س</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors self-start p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer / Calculations */}
                <div className="p-8 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-gray-500 text-sm">
                            <span className="font-medium">المجموع الفرعي</span>
                            <span className="font-bold text-gray-700">{subtotal.toLocaleString()} ر.س</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-500 text-sm">
                            <span className="font-medium">ضريبة القيمة المضافة (15%)</span>
                            <span className="font-bold text-gray-700">{tax.toLocaleString()} ر.س</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4"></div>
                        <div className="flex justify-between items-center h-10">
                            <span className="font-black text-gray-800 text-lg">الإجمالي النهائي</span>
                            <div className="text-left">
                                <span className="font-black text-primary text-3xl tabular-nums">{total.toLocaleString()}</span>
                                <span className="text-xs font-bold text-primary mr-1">ر.س</span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="w-full h-16 bg-[#3E2723] hover:bg-[#2D1B19] text-white rounded-2xl font-black text-lg shadow-2xl shadow-brown-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group px-6"
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        <span>إتمام عملية الدفع</span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-[-4px] transition-transform" />
                    </button>
                </div>
            </div>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
            />
        </>
    );
}
