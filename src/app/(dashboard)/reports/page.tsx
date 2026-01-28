"use client";

import {
    BarChart3,
    Calendar,
    CreditCard,
    TrendingUp,
    Download,
    PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        التقارير والإحصائيات
                    </h1>
                    <p className="text-gray-500 mt-1">تحليل أداء المبيعات والمخزون</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>يناير 2026</span>
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        <span>تصدير Excel</span>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">إجمالي المبيعات (شهري)</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">45,250 ر.س</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">85 فاتورة</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">متوسط قيمة السلة</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">532 ر.س</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <PieChart className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">المنتج الأكثر مبيعاً</p>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">سجاد صلاة فاخر مخطط</h3>
                    <p className="text-xs text-gray-400 mt-1">تم بيع 150 قطعة</p>
                </div>
            </div>

            {/* Charts Area Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">المبيعات اليومية</h3>
                    <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400">رسم بياني للمبيعات (Bar Chart Placeholder)</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">المبيعات حسب التصنيف</h3>
                    <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400">رسم بياني دائري (Pie Chart Placeholder)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
