"use client";

import { useState, useEffect } from "react";
import { mockProducts } from "@/lib/data";
import { getProductsFromSheet } from "@/lib/google-sheets";
import { ProductCard } from "@/components/pos/ProductCard";
import { CartSidebar } from "@/components/pos/CartSidebar";
import { CartProvider, useCart } from "@/context/CartContext";
import { Search, Filter, Loader2, ShoppingBasket, X, MoreHorizontal, RotateCcw } from "lucide-react";
import Link from "next/link";

function POSContent() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [products, setProducts] = useState(mockProducts);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

    const { itemCount, total } = useCart();

    useEffect(() => {
        async function fetchProducts() {
            const sheetProducts = await getProductsFromSheet();
            if (sheetProducts && sheetProducts.length > 0) {
                setProducts(sheetProducts);
            }
            setIsLoading(false);
        }
        fetchProducts();
    }, []);

    const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] md:h-[calc(100vh-112px)] gap-6 overflow-hidden bg-gray-50/50 -m-4 md:-m-8 p-4 md:p-8">

            {/* Left Side: Product Grid */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header/Filters Bar */}
                <div className="mb-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-primary" />
                            <input
                                type="text"
                                placeholder="ابحث باسم المنتج أو الباركود..."
                                className="w-full pl-6 pr-12 py-3.5 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-primary shadow-sm bg-white transition-all text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Link
                            href="/returns"
                            className="flex items-center gap-2 px-4 md:px-6 h-12 md:h-14 bg-amber-600/10 text-amber-700 rounded-2xl font-bold hover:bg-amber-600/20 transition-all border border-amber-600/20 shadow-sm whitespace-nowrap"
                        >
                            <RotateCcw className="w-5 h-5" />
                            <span className="text-sm md:text-base">مرتجع / تبديل</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm border ${selectedCategory === cat
                                    ? "bg-primary text-white border-primary shadow-primary/20 scale-105"
                                    : "bg-white text-gray-600 border-gray-100 hover:border-primary/30 hover:bg-primary/5"
                                    }`}
                            >
                                {cat === "all" ? "🛍️ الكل" : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-1 pb-24 md:pb-4 scrollbar-thin scrollbar-thumb-gray-200">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShoppingBasket className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                            <p className="font-bold text-gray-500 animate-pulse">جاري جلب المنتجات...</p>
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic">
                            <Filter className="w-16 h-16 mb-4 opacity-5 translate-y-2" />
                            <p className="text-xl font-bold opacity-30">لا توجد منتجات تطابق بحثك</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Cart Sidebar (Fixed on Desktop) */}
            <div className="hidden lg:block w-[400px] h-full shrink-0">
                <div className="h-full sticky top-0 bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
                    <CartSidebar />
                </div>
            </div>

            {/* Mobile Floating Cart Button */}
            <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40">
                <button
                    onClick={() => setIsMobileCartOpen(true)}
                    className="w-full bg-[#3E2723] text-white h-16 rounded-2xl shadow-2xl shadow-brown-900/40 flex items-center justify-between px-6 active:scale-95 transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <ShoppingBasket className="w-7 h-7" />
                            {itemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-secondary text-primary font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#3E2723]">
                                    {itemCount}
                                </span>
                            )}
                        </div>
                        <span className="font-bold text-lg">عرض سلة الشراء</span>
                    </div>
                    <span className="font-black text-xl text-secondary">{total.toLocaleString()} ر.س</span>
                </button>
            </div>

            {/* Mobile Cart Slider */}
            {isMobileCartOpen && (
                <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileCartOpen(false)}></div>
                    <div className="absolute bottom-0 left-0 right-0 top-12 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-xl text-gray-800">سلة الشراء</h3>
                                <span className="bg-gray-100 px-2 py-0.5 rounded-lg text-sm text-gray-500">{itemCount} قطع</span>
                            </div>
                            <button
                                onClick={() => setIsMobileCartOpen(false)}
                                className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-800"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <CartSidebar />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function POSPage() {
    return (
        <CartProvider>
            <POSContent />
        </CartProvider>
    );
}
