"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    Calendar,
    CreditCard,
    TrendingUp,
    Download,
    PieChart,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHEET_URL } from "@/lib/google-sheets";
import { cn } from "@/lib/utils";

interface ReportsData {
    totalSales: number;
    monthlySales: number;
    orderCount: number;
    dailySales: Record<string, number>;
    categorySales: Record<string, number>;
    topProducts: [string, number][];
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = async () => {
        if (!SHEET_URL) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${SHEET_URL}?action=getReportsData`);
            const json = await res.json();
            if (json.status === 'success') {
                setData(json.data);
            } else {
                setError(json.message || "Failed to fetch data");
            }
        } catch (e) {
            console.error(e);
            setError("حدث خطأ في الاتصال بالسحابة");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleExport = () => {
        if (!data) return;
        let csv = "\uFEFFالمنتج,الكمية المباعة\n";
        data.topProducts.forEach(([name, qty]) => {
            csv += `${name},${qty}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `تقرير_المبيعات_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <RefreshCw className="w-10 h-10 animate-spin text-primary" />
                <p className="text-gray-500 font-bold">جاري تحليل البيانات السحابية...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 p-10 rounded-3xl border border-red-100 text-center flex flex-col items-center gap-4">
                <BarChart3 className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-bold text-red-700">عذراً، فشل تحميل التقارير</h2>
                <p className="text-red-500">{error || "تأكد من وجود بيانات في قاعدة البيانات"}</p>
                <Button onClick={fetchReports} className="bg-red-600 hover:bg-red-700">إعادة المحاولة</Button>
            </div>
        );
    }

    // Chart Data Processing
    const days = Object.keys(data.dailySales).sort().slice(-7);
    const maxDaily = Math.max(...Object.values(data.dailySales), 100);
    const categories = Object.keys(data.categorySales);
    const maxCategory = Math.max(...Object.values(data.categorySales), 100);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-800 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <BarChart3 className="w-9 h-9 text-primary" />
                        </div>
                        مركز التحليلات الذكي
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">نظرة شاملة على أداء مبيعات سجادتي لهذا اليوم والشهر</p>
                </div>

                <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <Button variant="ghost" onClick={fetchReports} className="h-12 w-12 p-0 rounded-xl">
                        <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                    </Button>
                    <Button onClick={handleExport} className="h-12 px-6 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20">
                        <Download className="w-5 h-5" />
                        <span>تصدير Excel</span>
                    </Button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard
                    label="إجمالي مبيعات الشهر"
                    value={`${data.monthlySales.toLocaleString()} ر.س`}
                    icon={TrendingUp}
                    color="green"
                    trend="+15%"
                />
                <SummaryCard
                    label="إجمالي المبيعات (كلي)"
                    value={`${data.totalSales.toLocaleString()} ر.س`}
                    icon={CreditCard}
                    color="blue"
                />
                <SummaryCard
                    label="عدد الطلبات المنفذة"
                    value={data.orderCount.toString()}
                    icon={ArrowUpRight}
                    color="purple"
                />
                <SummaryCard
                    label="متوسط الفاتورة"
                    value={`${Math.round(data.totalSales / (data.orderCount || 1)).toLocaleString()} ر.س`}
                    icon={BarChart3}
                    color="orange"
                />
            </div>

            {/* Top Products & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Sales Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-gray-800">حركة المبيعات (آخر 7 أيام)</h3>
                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-400">تحديث تلقائي</div>
                    </div>
                    <div className="h-[300px] flex items-end justify-between gap-4">
                        {days.length > 0 ? days.map(day => (
                            <div key={day} className="flex-1 flex flex-col items-center gap-4 group">
                                <div className="relative w-full flex justify-center items-end h-full">
                                    <div
                                        className="w-full max-w-[40px] bg-primary/20 rounded-t-xl group-hover:bg-primary transition-all duration-500 relative"
                                        style={{ height: `${(data.dailySales[day] / maxDaily) * 100}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] py-1 px-2 rounded-lg font-bold whitespace-nowrap">
                                            {data.dailySales[day]} ر.س
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 rotate-45 lg:rotate-0">
                                    {new Date(day).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        )) : (
                            <div className="w-full flex items-center justify-center text-gray-400 italic">لا توجد بيانات حركة يومية بعد</div>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        الأكثر مبيعاً
                    </h3>
                    <div className="space-y-5">
                        {data.topProducts.map(([name, qty], i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-primary/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-primary border border-gray-100 shadow-sm">
                                        {i + 1}
                                    </div>
                                    <span className="font-bold text-gray-700 text-sm line-clamp-1">{name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-sans font-black text-primary">{qty}</span>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">المباع</p>
                                </div>
                            </div>
                        ))}
                        {data.topProducts.length === 0 && (
                            <p className="text-center py-10 text-gray-400 italic">لا توجد بيانات منتجات</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Sales */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <h3 className="text-xl font-black text-gray-800 mb-10 flex items-center gap-3">
                    <PieChart className="w-5 h-5 text-purple-500" />
                    المبيعات حسب التصنيف
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {categories.map(cat => (
                        <div key={cat} className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="font-black text-gray-700">{cat}</span>
                                <span className="font-sans font-bold text-gray-400 text-xs">{data.categorySales[cat].toLocaleString()} ر.س</span>
                            </div>
                            <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-[#5D4037] rounded-full transition-all duration-1000"
                                    style={{ width: `${(data.categorySales[cat] / (data.totalSales || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <div className="col-span-full py-10 text-center text-gray-400 italic">لا توجد مبيعات مصنفة بعد</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon, color, trend }: any) {
    const colors: any = {
        green: "bg-green-50 text-green-600",
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        orange: "bg-orange-50 text-orange-600"
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
                <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-transform", colors[color])}>
                    <Icon className="w-7 h-7" />
                </div>
                {trend && (
                    <span className="flex items-center gap-1 text-xs font-black text-green-500 bg-green-50 px-3 py-1.5 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-gray-400 text-sm font-bold mb-1">{label}</p>
                <h3 className="text-3xl font-black text-gray-800 font-sans tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
