"use client";

import {
    Settings,
    Wifi,
    WifiOff,
    Database,
    CreditCard,
    RefreshCw,
    Server,
    CloudUpload,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { seedDatabase } from "@/lib/seed-db";

export default function SettingsPage() {
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedStatus, setSeedStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSeedDatabase = async () => {
        setIsSeeding(true);
        setSeedStatus("idle");
        try {
            await seedDatabase();
            setSeedStatus("success");
            setTimeout(() => setSeedStatus("idle"), 3000);
        } catch (error) {
            console.error(error);
            setSeedStatus("error");
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Settings className="w-8 h-8 text-primary" />
                    الإعدادات وحالة النظام
                </h1>
                <p className="text-gray-500 mt-1">مراقبة اتصال الخدمات وإعدادات النظام</p>
            </div>

            {/* System Status Grid */}
            <h2 className="text-xl font-bold text-gray-800">حالة الاتصال</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Firebase Status */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <Database className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                            <Wifi className="w-3 h-3" />
                            متصل
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">قاعدة البيانات</h3>
                    <p className="text-gray-400 text-sm mt-1">Firebase Firestore</p>
                    <p className="text-xs text-gray-300 mt-4">آخر مزامنة: منذ 2 دقيقة</p>
                </div>

                {/* Google Sheets Status */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <Server className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                            <Wifi className="w-3 h-3" />
                            متصل
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">مخزون الرياض</h3>
                    <p className="text-gray-400 text-sm mt-1">Google Sheets Integration</p>
                    <p className="text-xs text-gray-300 mt-4">آخر مزامنة: منذ 5 دقائق</p>
                </div>

                {/* Payment Gateway Status */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            جاري التحقق
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">بوابات الدفع</h3>
                    <p className="text-gray-400 text-sm mt-1">Moyasar / Stripe</p>
                    <p className="text-xs text-gray-300 mt-4">وضع الاختبار (Test Mode)</p>
                </div>
            </div>

            {/* Admin Actions */}
            <h2 className="text-xl font-bold text-gray-800 mt-8">إجراءات سريعة</h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <Button variant="outline" className="justify-start gap-3 h-12">
                        <RefreshCw className="w-4 h-4" />
                        <span>فرض مزامنة المخزون الآن</span>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleSeedDatabase}
                        disabled={isSeeding}
                        className={`justify-start gap-3 h-12 ${seedStatus === 'success' ? 'border-green-500 text-green-600 bg-green-50' : seedStatus === 'error' ? 'border-red-500 text-red-600 bg-red-50' : ''}`}
                    >
                        {isSeeding ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : seedStatus === 'success' ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : seedStatus === 'error' ? (
                            <AlertCircle className="w-4 h-4" />
                        ) : (
                            <CloudUpload className="w-4 h-4" />
                        )}
                        <span>
                            {isSeeding ? "جاري الرفع..." :
                                seedStatus === 'success' ? "تم الرفع بنجاح" :
                                    seedStatus === 'error' ? "خطأ في الاتصال (تحقق من .env)" :
                                        "رفع المنتجات لقاعدة البيانات"}
                        </span>
                    </Button>


                    <Button variant="outline" className="justify-start gap-3 h-12 text-red-500 hover:text-red-700 hover:bg-red-50">
                        <WifiOff className="w-4 h-4" />
                        <span>قطع الاتصال (وضع الاوفلاين)</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
