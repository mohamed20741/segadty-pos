"use client";

import { useState, useEffect } from "react";
import { mockProducts } from "@/lib/data";
import { getProductsFromSheet } from "@/lib/google-sheets";
import { ProductCard } from "@/components/pos/ProductCard";
import { CartSidebar } from "@/components/pos/CartSidebar";
import { CartProvider } from "@/context/CartContext";
import { Search, Filter, Loader2 } from "lucide-react";

export default function POSPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [products, setProducts] = useState(mockProducts);
    const [isLoading, setIsLoading] = useState(true);

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
        <CartProvider>
            <div className="flex h-[calc(100vh-theme(spacing.20))] md:h-[calc(100vh-theme(spacing.28))] gap-6 overflow-hidden">

                {/* Left Side: Product Grid */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Filters Bar */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="بحث عن منتج..."
                                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedCategory === cat
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    {cat === "all" ? "الكل" : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto pr-2 pb-20 md:pb-0">
                        {isLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p>جاري تحميل المنتجات من المخزون...</p>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                <Filter className="w-12 h-12 mb-2 opacity-20" />
                                <p>لا توجد منتجات تطابق بحثك</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Cart Sidebar (Fixed on Desktop, Hidden/Toggle on Mobile - Simplified here for split view logic) */}
                <div className="hidden lg:block w-96 h-full sticky top-0">
                    <CartSidebar />
                </div>
            </div>
        </CartProvider>
    );
}
