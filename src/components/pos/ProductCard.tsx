"use client";

import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { Plus, ShoppingBasket, Info } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const isOutOfStock = product.quantity <= 0;
    const isLowStock = !isOutOfStock && product.quantity <= (product.min_quantity || 5);

    return (
        <div className={cn(
            "bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden group flex flex-col h-full relative",
            isOutOfStock && "opacity-75 grayscale-[0.5]"
        )}>
            {/* Image Section */}
            <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                {product.image ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-primary/10">
                        <ShoppingBasket className="w-16 h-16" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-primary shadow-sm border border-white/20 uppercase tracking-widest">
                        {product.category}
                    </div>
                    {isLowStock && (
                        <div className="bg-amber-500 px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-sm border border-white/20 animate-pulse">
                            مخزون منخفض
                        </div>
                    )}
                    {isOutOfStock && (
                        <div className="bg-red-500 px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-sm border border-white/20">
                            نفذت الكمية
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-gray-800 line-clamp-1 group-hover:text-primary transition-colors text-lg">{product.name}</h3>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 min-h-[32px] mb-4 leading-relaxed">{product.description || "سجادة فاخرة بجودة عالية وتصميم عصري"}</p>

                <div className="mt-auto flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold mb-0.5">السعر</p>
                        <span className="text-2xl font-black text-primary tabular-nums">
                            {product.selling_price.toLocaleString()} <span className="text-sm font-bold">ر.س</span>
                        </span>
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-400 font-bold mb-0.5">المخزون</p>
                        <span className={cn(
                            "text-sm font-black px-2 py-1 rounded-lg",
                            isOutOfStock ? "text-red-500 bg-red-50" : isLowStock ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50"
                        )}>
                            {product.quantity} قطعة
                        </span>
                    </div>
                </div>

                <button
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={cn(
                        "w-full mt-6 h-12 rounded-2xl gap-2 font-black transition-all flex items-center justify-center group/btn active:scale-95 shadow-lg",
                        isOutOfStock
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-surface hover:bg-primary text-primary hover:text-white border-2 border-primary/20 hover:border-primary shadow-primary/5 hover:shadow-primary/20"
                    )}
                >
                    {isOutOfStock ? (
                        <span>غير متوفر</span>
                    ) : (
                        <>
                            <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                            <span>إضافة للسلة</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
