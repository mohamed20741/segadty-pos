"use client";

import { useState } from "react";
import { mockProducts } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Filter,
    Plus,
    Package,
    AlertTriangle,
    MoreHorizontal,
    Edit,
    Trash,
    ArrowUpDown
} from "lucide-react";
import { Product } from "@/types";

export default function InventoryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStock, setFilterStock] = useState("all"); // all, low, out

    // Derived state
    const categories = ["all", ...Array.from(new Set(mockProducts.map(p => p.category)))];

    const filteredProducts = mockProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = filterCategory === "all" || product.category === filterCategory;

        let matchesStock = true;
        if (filterStock === "low") {
            matchesStock = product.quantity <= product.min_quantity && product.quantity > 0;
        } else if (filterStock === "out") {
            matchesStock = product.quantity === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
    });

    // Calculate stats
    const totalItems = mockProducts.length;
    const lowStockItems = mockProducts.filter(p => p.quantity <= p.min_quantity).length;
    const totalValue = mockProducts.reduce((acc, curr) => acc + (curr.cost_price * curr.quantity), 0);

    const getStockStatus = (product: Product) => {
        if (product.quantity === 0) return { label: "نفد الكمية", color: "bg-red-100 text-red-700 border-red-200" };
        if (product.quantity <= product.min_quantity) return { label: "منخفض", color: "bg-orange-100 text-orange-700 border-orange-200" };
        return { label: "متوفر", color: "bg-green-100 text-green-700 border-green-200" };
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Package className="w-8 h-8 text-primary" />
                        إدارة المخزون
                    </h1>
                    <p className="text-gray-500 mt-1">عرض وتحديث المنتجات ومتابعة الكميات</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold">تنبيهات المخزون</p>
                            <p className="font-bold text-gray-800">{lowStockItems} منتجات</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold">قيمة المخزون</p>
                            <p className="font-bold text-gray-800">{totalValue.toLocaleString()} ر.س</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="flex flex-1 w-full gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="بحث باسم المنتج، الرقم التسلسلي..."
                            className="pl-4 pr-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="h-12 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat === 'all' ? 'كل التصنيفات' : cat}</option>
                        ))}
                    </select>

                    <select
                        className="h-12 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        value={filterStock}
                        onChange={(e) => setFilterStock(e.target.value)}
                    >
                        <option value="all">كل الحالات</option>
                        <option value="low">مخزون منخفض</option>
                        <option value="out">نفد الكمية</option>
                    </select>
                </div>

                <Button className="w-full lg:w-auto gap-2">
                    <Plus className="w-5 h-5" />
                    منتج جديد
                </Button>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                                <th className="py-4 px-6 font-medium">المنتج</th>
                                <th className="py-4 px-6 font-medium">التصنيف</th>
                                <th className="py-4 px-6 font-medium">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
                                        السعر
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="py-4 px-6 font-medium">الكمية</th>
                                <th className="py-4 px-6 font-medium">الحالة</th>
                                <th className="py-4 px-6 font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map((product) => {
                                const status = getStockStatus(product);
                                return (
                                    <tr key={product.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {product.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{product.name}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{product.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 text-sm">{product.selling_price} ر.س</span>
                                                <span className="text-xs text-gray-400">ت: {product.cost_price} ر.س</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`font-bold text-sm ${product.quantity <= product.min_quantity ? 'text-red-500' : 'text-gray-800'}`}>
                                                {product.quantity}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                        <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>لا توجد نتائج مطابقة للبحث</p>
                        <button
                            onClick={() => { setSearchQuery(""); setFilterCategory("all"); setFilterStock("all"); }}
                            className="text-primary text-sm font-bold mt-2 hover:underline"
                        >
                            إعادة تعيين الفلاتر
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
