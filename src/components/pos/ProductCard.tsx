"use client";

import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Image from "next/image";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col h-full">
            <div className="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                {product.image ? (
                    <div className="relative w-full h-full">
                        {/* Normally we would use Image from next/image, but for now with mock paths we might get errors if files don't exist.
                   Using a fallback div for safety if image fails or path is mock */}
                        <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center text-secondary/30 font-bold text-4xl">
                            {product.name.charAt(0)}
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-secondary/5 flex items-center justify-center text-secondary/20">
                        <span className="text-4xl">🕌</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-primary shadow-sm">
                    {product.category}
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-3">{product.description || "لا يوجد وصف"}</p>

                <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                        {product.selling_price} <span className="text-xs font-medium">ر.س</span>
                    </span>
                    <span className="text-xs text-secondary font-medium bg-secondary/10 px-2 py-1 rounded-full">
                        متاح: {product.quantity}
                    </span>
                </div>

                <Button
                    onClick={() => addToCart(product)}
                    className="w-full mt-4 gap-2 bg-surface hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-transparent transition-all"
                    size="sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة للسلة</span>
                </Button>
            </div>
        </div>
    );
}
