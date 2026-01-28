"use client";

import { useState, useEffect } from "react";
import { Database, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { SHEET_URL } from "@/lib/google-sheets"; // Wait, I need to check if it's exported
import { Button } from "@/components/ui/button";

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        if (!SHEET_URL) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${SHEET_URL}?action=getLogs`);
            const json = await res.json();
            if (json.status === 'success') {
                setLogs(json.data.reverse()); // Latest first
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Database className="w-8 h-8 text-primary" />
                        سجل العمليات (Logs)
                    </h1>
                    <p className="text-gray-500 mt-1">تتبع عمليات الإضافة، التعديل، والحذف في النظام</p>
                </div>
                <Button onClick={fetchLogs} variant="outline" className="gap-2">
                    <RefreshCw className={isLoading ? "animate-spin" : ""} />
                    تحديث
                </Button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase">
                                <th className="py-4 px-6">الوقت</th>
                                <th className="py-4 px-6">النوع</th>
                                <th className="py-4 px-6">الكيان</th>
                                <th className="py-4 px-6">المعرف</th>
                                <th className="py-4 px-6">التفاصيل</th>
                                <th className="py-4 px-6">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.map((log, i) => (
                                <tr key={i} className="text-sm">
                                    <td className="py-4 px-6 text-gray-400 flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.action === 'DELETE' ? 'bg-red-50 text-red-600' :
                                            log.action === 'UPDATE' ? 'bg-blue-50 text-blue-600' :
                                                'bg-green-50 text-green-600'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-bold">{log.entity}</td>
                                    <td className="py-4 px-6 font-mono text-xs">{log.entity_id}</td>
                                    <td className="py-4 px-6 max-w-xs truncate">{log.details}</td>
                                    <td className="py-4 px-6">
                                        {log.status === 'success' ?
                                            <span className="text-green-500 font-bold">نجاح</span> :
                                            <span className="text-red-500 font-bold text-xs flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                فشل
                                            </span>
                                        }
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
