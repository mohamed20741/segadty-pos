"use client";

import {
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    ArrowUpRight,
    TrendingUp,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const stats = [
        {
            label: "إجمالي المبيعات اليوم",
            value: "12,450 ر.س",
            subValue: "+15% عن الأمس",
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-100",
            trend: "up"
        },
        {
            label: "عدد الطلبات",
            value: "45",
            subValue: "+5 طلبات جديدة",
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-100",
            trend: "up"
        },
        {
            label: "منتجات منخفضة المخزون",
            value: "12",
            subValue: "يرجى إعادة الطلب",
            icon: AlertTriangle,
            color: "text-orange-600",
            bg: "bg-orange-100",
            trend: "down"
        },
        {
            label: "العملاء الجدد",
            value: "8",
            subValue: "+2 عن الأسبوع الماضي",
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-100",
            trend: "up"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
                    <p className="text-gray-500 mt-1">أهلاً بك، إليك ملخص أداء فرع الحمرا اليوم</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <span>آخر تحديث:</span>
                    <span className="font-bold text-gray-800">27 يناير 2026 - 05:30 م</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-xl", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                                stat.trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            )}>
                                {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                <span>{stat.trend === "up" ? "ارتفاع" : "تنبيه"}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                            <p className="text-xs text-gray-400 mt-2 font-medium">{stat.subValue}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Mockup */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart Area (Placeholder) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">تحليل المبيعات</h3>
                        <select className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1 font-medium text-gray-600 focus:ring-0">
                            <option>هذا الأسبوع</option>
                            <option>هذا الشهر</option>
                        </select>
                    </div>
                    <div className="h-[300px] flex items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">مساحة الرسم البياني (Chart.js / Recharts)</p>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">أحدث الطلبات</h3>
                        <button className="text-primary text-sm font-bold hover:underline">عرض الكل</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div key={item} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                                        #{1000 + item}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">أحمد محمد</p>
                                        <p className="text-xs text-gray-500">2 سجادة صلاة فاخرة</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-primary">450 ر.س</p>
                                    <p className="text-[10px] text-gray-400">منذ 5 د</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
