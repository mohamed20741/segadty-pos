"use client";

import {
    Settings,
    Wifi,
    Database,
    RefreshCw,
    Server,
    CloudUpload,
    CheckCircle2,
    AlertCircle,
    Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { seedDatabase } from "@/lib/seed-db";
import { testConnection } from "@/lib/google-sheets";

export default function SettingsPage() {
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedStatus, setSeedStatus] = useState<"idle" | "success" | "error">("idle");
    const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "disconnected">("checking");

    useEffect(() => {
        checkDb();
    }, []);

    const checkDb = async () => {
        setDbStatus("checking");
        const ok = await testConnection();
        setDbStatus(ok ? "connected" : "disconnected");
    };

    const handleSeedDatabase = async () => {
        if (!confirm("هل أنت متأكد من رفع البيانات التجريبية لقاعدة البيانات؟ سيتم إضافة منتجات جديدة.")) return;

        setIsSeeding(true);
        setSeedStatus("idle");
        try {
            await seedDatabase();
            setSeedStatus("success");
            setTimeout(() => setSeedStatus("idle"), 3000);
            checkDb(); // Refresh status
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Google Sheets Status */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className={dbStatus === "connected" ? "absolute top-0 left-0 w-1.5 h-full bg-green-500" : "absolute top-0 left-0 w-1.5 h-full bg-red-500"}></div>
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${dbStatus === "connected" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                            <Database className="w-6 h-6" />
                        </div>
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${dbStatus === "connected" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {dbStatus === "checking" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                            {dbStatus === "checking" ? "جاري التحقق" : dbStatus === "connected" ? "متصل" : "غير متصل"}
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">قاعدة بيانات جوجل</h3>
                    <p className="text-gray-400 text-sm mt-1">Google Sheets Integration (POS DB)</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={checkDb}
                        className="mt-4 h-8 gap-2 text-xs font-bold hover:bg-gray-100"
                    >
                        <RefreshCw className="w-3 h-3" />
                        تحديث الحالة
                    </Button>
                </div>

                {/* App Version Info */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary ring-inset"></div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <Store className="w-6 h-6" />
                        </div>
                        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                            النسخة 1.2.0
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">نظام سجادتي POS</h3>
                    <p className="text-gray-400 text-sm mt-1">فرع الرياض - الحمرا</p>
                    <p className="text-xs text-gray-300 mt-4 italic">بيئة التشغيل: إنتاج (Production)</p>
                </div>
            </div>

            {/* Admin Actions */}
            <h2 className="text-xl font-bold text-gray-800 mt-8">إجراءات المزامنة والرفع</h2>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-700">مزامنة البيانات</h4>
                        <p className="text-sm text-gray-500">رفع المنتجات من ملف البيانات المحلي إلى شيت جوجل المتصل حالياً.</p>
                        <Button
                            onClick={handleSeedDatabase}
                            disabled={isSeeding}
                            className={`w-full justify-center gap-3 h-14 text-lg font-bold transition-all shadow-lg ${seedStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                                    seedStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : ''
                                }`}
                        >
                            {isSeeding ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : seedStatus === 'success' ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : seedStatus === 'error' ? (
                                <AlertCircle className="w-5 h-5" />
                            ) : (
                                <CloudUpload className="w-5 h-5" />
                            )}
                            <span>
                                {isSeeding ? "جاري الرفع..." :
                                    seedStatus === 'success' ? "تم الرفع بنجاح" :
                                        seedStatus === 'error' ? "خطأ في الاتصال" :
                                            "رفع المنتجات للبداية"}
                            </span>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-700">دليل الاستخدام</h4>
                        <p className="text-sm text-gray-500">تأكد دائماً أن رابط Google Sheets URL مضاف بشكل صحيح في إعدادات Vercel.</p>
                        <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-500 font-mono break-all">
                            ENDPOINT: {process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || "لم يتم ضبط الرابط بعد"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
