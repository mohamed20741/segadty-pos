"use client";

import { useCart } from "@/context/CartContext";
import { Trash2, Plus, Minus, ShoppingCart, Trash, ArrowRight, Tag } from "lucide-react";
import { useState } from "react";
import { CheckoutModal } from "./CheckoutModal";
import { Input } from "@/components/ui/input";

export function CartSidebar() {
    const {
        cart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        total,
        itemCount,
        discount,
        setDiscount,
        subtotalRaw
    } = useCart();
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
        <div className="h-full flex flex-col bg-white shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {cart.map((item) => (
                    <div
                        key={item.id}
                        className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300 group"
                    >
                        {/* Small Image Placeholder */}
                        <div className="w-14 h-14 bg-gray-50 rounded-xl border border-gray-50 flex items-center justify-center text-lg font-black text-primary/20 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            {item.name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-800 line-clamp-1 text-sm group-hover:text-primary transition-colors">{item.name}</h4>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-end justify-between mt-2">
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-100 px-1 py-0.5 shadow-sm">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-white hover:text-red-500 rounded text-gray-400 transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm font-black w-6 text-center text-gray-700">{item.cartQuantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-white hover:text-green-500 rounded text-gray-400 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-primary font-black text-sm">
                                        {(item.selling_price * item.cartQuantity).toLocaleString()} <span className="text-[10px]">ر.س</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Calculations */}
            <div className="p-5 bg-gray-50 border-t border-gray-200">
                {/* Discount Section */}
                <div className="mb-4 bg-white p-3 rounded-xl border border-dashed border-gray-300">
                    <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-bold">
                        <Tag className="w-3 h-3" />
                        <span>إضافة خصم</span>
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="h-9 rounded-lg border border-gray-200 text-sm bg-gray-50 px-2 focus:outline-none focus:border-primary"
                            value={discount.type}
                            onChange={(e) => setDiscount({ ...discount, type: e.target.value as 'amount' | 'percent' })}
                        >
                            <option value="amount">مبلغ (ر.س)</option>
                            <option value="percent">نسبة (%)</option>
                        </select>
                        <Input
                            type="number"
                            className="h-9 text-sm text-left font-bold"
                            placeholder="0"
                            value={discount.value || ''}
                            onChange={(e) => setDiscount({ ...discount, value: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-gray-500 text-sm">
                        <span className="font-medium">المجموع (شامل الضريبة)</span>
                        <span className="font-bold text-gray-700">{subtotalRaw.toLocaleString()} ر.س</span>
                    </div>
                    {discount.value > 0 && (
                        <div className="flex justify-between items-center text-red-500 text-sm font-bold animate-in slide-in-from-right-2">
                            <span className="font-medium">الخصم</span>
                            <span>- {(subtotalRaw - total).toLocaleString()} ر.س</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-gray-500 text-sm">
                        <span className="font-medium">الضريبة (15%)</span>
                        <span className="font-bold text-gray-700">{tax.toLocaleString()} ر.س</span>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-gray-800 text-white p-4 rounded-xl mb-4">
                    <span className="font-bold text-sm">الإجمالي النهائي</span>
                    <span className="font-black text-2xl">{total.toLocaleString()} <span className="text-xs font-normal opacity-70">ر.س</span></span>
                </div>

                <button
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    onClick={() => setIsCheckoutOpen(true)}
                >
                    <span>الدفع وإصدار الفاتورة</span>
                    <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
            />
        </div>
    );
}
