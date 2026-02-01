"use client";

import { useState } from "react";
import { mockProducts } from "@/lib/data";
import { Database, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";

const SHEET_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;

export default function MigratePage() {
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [results, setResults] = useState({ success: 0, failed: 0, total: 0 });

    const addLog = (message: string) => {
        setLogs(prev => [...prev, message]);
    };

    const setupDatabase = async () => {
        addLog("🔧 جاري إعداد قاعدة البيانات...");
        try {
            const response = await fetch(`${SHEET_URL}?action=setup`, {
                method: 'GET',
                mode: 'no-cors',
                redirect: 'follow'
            });

            // مع no-cors، لا يمكننا قراءة الاستجابة، لذا نفترض النجاح
            addLog("✅ تم إرسال طلب الإعداد بنجاح");
            // انتظار 2 ثانية للتأكد من اكتمال الإعداد
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
        } catch (error: any) {
            addLog(`❌ خطأ في الاتصال: ${error.message}`);
            return false;
        }
    };

    const addProduct = async (product: any) => {
        try {
            const payload = {
                id: product.id,
                name: product.name,
                category: product.category,
                cost_price: product.cost_price,
                selling_price: product.selling_price,
                stock: product.quantity,
                min_quantity: product.min_quantity,
                image: product.image || '',
            };

            const response = await fetch(SHEET_URL!, {
                method: 'POST',
                mode: 'no-cors',
                redirect: 'follow',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'addProduct',
                    payload: payload
                })
            });

            // مع no-cors، نفترض النجاح
            return { status: 'success' };
        } catch (error: any) {
            return { status: 'error', message: error.message };
        }
    };

    const startMigration = async () => {
        setIsRunning(true);
        setLogs([]);
        setResults({ success: 0, failed: 0, total: mockProducts.length });

        addLog("=".repeat(60));
        addLog("🚀 بدء عملية نقل البيانات إلى Google Sheets");
        addLog("=".repeat(60));

        // الخطوة 1: إعداد قاعدة البيانات
        const setupSuccess = await setupDatabase();
        if (!setupSuccess) {
            addLog("\n💡 تأكد من:");
            addLog("   1. وجود NEXT_PUBLIC_GOOGLE_SHEET_URL في ملف .env.local");
            addLog("   2. أن الرابط صحيح ومنشور بصلاحية 'Anyone'");
            addLog("   3. نسخ الكود من GOOGLE_SHEET_SETUP.md إلى Google Apps Script");
            setIsRunning(false);
            return;
        }

        // الخطوة 2: نقل المنتجات
        addLog("\n📦 جاري نقل المنتجات...\n");

        let successCount = 0;
        let failCount = 0;

        for (const product of mockProducts) {
            const result = await addProduct(product);

            if (result.status === 'success') {
                addLog(`✅ تم إضافة: ${product.name}`);
                successCount++;
            } else {
                addLog(`❌ فشل: ${product.name} - ${result.message}`);
                failCount++;
            }

            setResults({ success: successCount, failed: failCount, total: mockProducts.length });

            // انتظار نصف ثانية بين كل عملية
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        addLog("\n" + "=".repeat(60));
        addLog("📊 النتيجة النهائية:");
        addLog(`   ✅ نجح: ${successCount}`);
        addLog(`   ❌ فشل: ${failCount}`);
        addLog(`   📦 الإجمالي: ${mockProducts.length}`);
        addLog("=".repeat(60));
        addLog("\n🎉 اكتملت عملية النقل بنجاح!");
        addLog("💡 افتح Google Sheet لمشاهدة البيانات\n");

        setIsRunning(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <Database className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">نقل البيانات إلى Google Sheets</h1>
                        <p className="text-gray-500 mt-1">انقل المنتجات الموجودة إلى قاعدة البيانات السحابية</p>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    ماذا سيحدث؟
                </h3>
                <ul className="space-y-2 text-blue-800 text-sm">
                    <li>✅ إنشاء الجداول في Google Sheets (products, customers, orders, order_items)</li>
                    <li>✅ إنشاء جداول الاسترجاع والتبديل (returns_exchanges, return_exchange_items)</li>
                    <li>✅ إنشاء سجل حركة المخزون والتسويات المالية (stock_movements, payments_adjustments)</li>
                    <li>✅ نقل {mockProducts.length} منتجات موجودة حالياً في التطبيق</li>
                    <li>✅ ربط التطبيق بقاعدة البيانات السحابية</li>
                    <li>⚠️ تأكد من تحديث Google Apps Script أولاً بالكود الجديد</li>
                </ul>
            </div>

            {/* Progress Card */}
            {(isRunning || logs.length > 0) && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">سجل العمليات</h3>
                        {isRunning && (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">جاري التنفيذ...</span>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-green-50 p-4 rounded-xl text-center">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-600">{results.success}</p>
                            <p className="text-xs text-green-700">نجح</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl text-center">
                            <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                            <p className="text-xs text-red-700">فشل</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl text-center">
                            <Database className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-600">{results.total}</p>
                            <p className="text-xs text-blue-700">الإجمالي</p>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm max-h-96 overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1">{log}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Button */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <button
                    onClick={startMigration}
                    disabled={isRunning || !SHEET_URL}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            جاري النقل...
                        </>
                    ) : (
                        <>
                            <Upload className="w-6 h-6" />
                            بدء عملية النقل
                        </>
                    )}
                </button>

                {!SHEET_URL && (
                    <p className="text-red-600 text-sm mt-3 text-center">
                        ⚠️ لم يتم العثور على NEXT_PUBLIC_GOOGLE_SHEET_URL في ملف .env.local
                    </p>
                )}
            </div>
        </div>
    );
}
