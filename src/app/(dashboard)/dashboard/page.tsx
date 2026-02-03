"use client";

import {
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    ArrowUpRight,
    TrendingUp,
    AlertTriangle,
    Loader2,
    RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getReportsData, getProductsFromSheet } from "@/lib/google-sheets";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [cashierPerformance, setCashierPerformance] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const { getCashierPerformance, getReportsData, getProductsFromSheet } = await import("@/lib/google-sheets");

            // Only admins see all branches by default
            const branchId = user?.role === 'admin' ? undefined : user?.branch_id;

            const [reports, products, cashierData] = await Promise.all([
                getReportsData(branchId, dateRange.start, dateRange.end),
                getProductsFromSheet(),
                getCashierPerformance(branchId, dateRange.start, dateRange.end)
            ]);

            if (reports) setData(reports);
            if (products) {
                const lowStock = products.filter(p => Number(p.quantity) <= (p.min_quantity || 5)).length;
                setLowStockCount(lowStock);
            }
            if (cashierData) setCashierPerformance(cashierData);
        } catch (error) {
            console.error("Dashboard data load error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const stats = [
        {
            label: "إجمالي المبيعات",
            value: data ? `${Number(data.totalSales).toLocaleString()} ر.س` : "0 ر.س",
            subValue: "مبيعات تراكمية",
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-100",
            trend: "up"
        },
        {
            label: "مبيعات الشهر الحالي",
            value: data ? `${Number(data.monthlySales).toLocaleString()} ر.س` : "0 ر.س",
            subValue: "منذ بداية الشهر",
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-theme-blue/10",
            trend: "up"
        },
        {
            label: "عدد الطلبات",
            value: data ? data.orderCount : "0",
            subValue: "إجمالي العمليات",
            icon: ShoppingCart,
            color: "text-purple-600",
            bg: "bg-purple-100",
            trend: "up"
        },
        {
            label: "منتجات منخفضة المخزون",
            value: lowStockCount,
            subValue: "تتطلب انتباه",
            icon: AlertTriangle,
            color: "text-orange-600",
            bg: "bg-orange-100",
            trend: lowStockCount > 0 ? "down" : "up"
        }
    ];

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-500">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="font-bold text-lg">جاري تحميل لوحة التحكم...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 md:px-0">

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">لوحة التحكم</h1>
                    <p className="text-gray-500 mt-1">أهلاً بك، إليك ملخص حي لأداء النظام</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                        <input
                            type="date"
                            className="bg-transparent px-3 py-1.5 text-xs font-bold text-gray-600 outline-none"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="self-center px-1 text-gray-300">|</span>
                        <input
                            type="date"
                            className="bg-transparent px-3 py-1.5 text-xs font-bold text-gray-600 outline-none"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span>آخر تحديث:</span>
                        <span className="font-bold text-gray-800">{new Date().toLocaleString('ar-SA')}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500", stat.bg)}>
                                <stat.icon className={cn("w-7 h-7", stat.color)} />
                            </div>
                            <div className={cn("flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
                                stat.trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            )}>
                                {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                <span>{stat.trend === "up" ? "نشط" : "انتباه"}</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-tight">{stat.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 tabular-nums leading-none mb-2">{stat.value}</h3>
                            <p className="text-[10px] text-gray-500 font-bold opacity-60 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                {stat.subValue}
                            </p>
                        </div>
                        {/* Decorative background element */}
                        <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700", stat.bg)}></div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    href="/pos"
                    className="flex items-center gap-4 p-6 bg-[#3E2723] rounded-[2rem] text-white hover:bg-[#2D1B19] transition-all group shadow-xl shadow-brown-900/10"
                >
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-7 h-7 text-secondary" />
                    </div>
                    <div>
                        <h3 className="font-black text-xl">نقطة البيع</h3>
                        <p className="text-xs text-secondary/70">بدء عملية بيع جديدة</p>
                    </div>
                </Link>

                <Link
                    href="/returns"
                    className="flex items-center gap-4 p-6 bg-amber-600 rounded-[2rem] text-white hover:bg-amber-700 transition-all group shadow-xl shadow-amber-900/10"
                >
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <RotateCcw className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-xl">المرتجعات والتبديل</h3>
                        <p className="text-xs text-white/70">إرجاع أو استبدال فاتورة</p>
                    </div>
                </Link>

                <Link
                    href="/inventory"
                    className="flex items-center gap-4 p-6 bg-white rounded-[2rem] border border-gray-100 hover:border-primary/20 transition-all group shadow-sm hover:shadow-xl hover:shadow-primary/5"
                >
                    <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Package className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-gray-800">المخزون</h3>
                        <p className="text-xs text-gray-400">إدارة المنتجات والكميات</p>
                    </div>
                </Link>
            </div>

            {/* Activity and Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product Sales Analysis */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">توزيع المبيعات</h3>
                            <p className="text-sm text-gray-400">حسب فئات المنتجات</p>
                        </div>
                        <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                            <ArrowUpRight className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {data && Object.entries(data.categorySales || {}).map(([cat, amount]: any, i) => (
                            <div key={cat} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-700">{cat}</span>
                                    <span className="text-primary">{Number(amount).toLocaleString()} ر.س</span>
                                </div>
                                <div className="h-3 bg-gray-50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${Math.min(100, (amount / data.totalSales) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {(!data || Object.keys(data.categorySales || {}).length === 0) && (
                            <div className="h-48 flex items-center justify-center text-gray-300 italic border-2 border-dashed border-gray-100 rounded-3xl">
                                لا توجد بيانات مبيعات حتى الآن
                            </div>
                        )}
                    </div>
                </div>

                {/* Cashier Performance Analysis */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">مبيعات الكاشير</h3>
                            <p className="text-sm text-gray-400">تحليل الأداء حسب الموظف</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {cashierPerformance.length > 0 ? cashierPerformance.sort((a, b) => b.totalSales - a.totalSales).map((cashier: any, i: number) => (
                            <div key={cashier.username} className="p-4 bg-gray-50/50 rounded-3xl border border-transparent hover:border-blue-100 hover:bg-blue-50/20 transition-all flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center font-bold text-blue-500">
                                        {cashier.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-800">{cashier.name}</p>
                                        <p className="text-[10px] text-gray-400">{cashier.orderCount} عملية بيع</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black text-blue-600">{Number(cashier.totalSales).toLocaleString()} ر.س</p>
                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${Math.min(100, (cashier.totalSales / (data?.totalSales || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center py-20 text-gray-300 italic">
                                <Users className="w-12 h-12 mb-4 opacity-10" />
                                <p>لا توجد مبيعات مسجلة</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">آخر العمليات المنفذة</h3>
                        <p className="text-sm text-gray-400">تابع المبيعات المباشرة وحالة الطلبات</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="py-4 px-6">رقم الفاتورة</th>
                                <th className="py-4 px-6 font-sans">المبلغ</th>
                                <th className="py-4 px-6">الحالة</th>
                                <th className="py-4 px-6">التاريخ</th>
                                <th className="py-4 px-6">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {[
                                { id: "#INV-2051", amount: 450, status: "completed", date: "منذ 5 دقائق" },
                                { id: "#INV-2050", amount: 1250, status: "completed", date: "منذ ساعة" },
                                { id: "#INV-2049", amount: 890, status: "returned", date: "منذ ساعتين" },
                            ].map((row, i) => (
                                <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-5 px-6 font-bold text-gray-800">{row.id}</td>
                                    <td className="py-5 px-6 font-sans font-black text-gray-900">{row.amount} ر.س</td>
                                    <td className="py-5 px-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                            row.status === 'completed' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                        )}>
                                            {row.status === 'completed' ? "مكتمل" : "مرتجع"}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 text-xs text-gray-400">{row.date}</td>
                                    <td className="py-5 px-6">
                                        <Link
                                            href="/returns"
                                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            استبدال/مرتجع
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
