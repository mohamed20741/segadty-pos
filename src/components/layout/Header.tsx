"use client";

import { Bell, Search, Database, CheckCircle, XCircle, Loader2, RefreshCw, LogOut, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { testConnection } from "@/lib/google-sheets";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

function DbStatusButton() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleCheck = async () => {
        setStatus("loading");
        const isOk = await testConnection();
        setStatus(isOk ? "success" : "error");

        // Reset to idle after some time
        setTimeout(() => setStatus("idle"), 3000);
    };

    return (
        <button
            onClick={handleCheck}
            disabled={status === "loading"}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-bold text-xs",
                status === "idle" && "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
                status === "loading" && "bg-blue-50 text-blue-600 border-blue-200",
                status === "success" && "bg-green-50 text-green-600 border-green-200 shadow-[0_0_10px_rgba(34,197,94,0.2)]",
                status === "error" && "bg-red-50 text-red-600 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            )}
        >
            {status === "idle" && (
                <>
                    <Database className="w-3.5 h-3.5" />
                    <span>اتصال السحابة</span>
                    <RefreshCw className="w-3 h-3 text-gray-400 group-hover:rotate-180 transition-transform" />
                </>
            )}
            {status === "loading" && (
                <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التوصيل...</span>
                </>
            )}
            {status === "success" && (
                <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>متصل بنجاح</span>
                </>
            )}
            {status === "error" && (
                <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>خطأ في الاتصال</span>
                </>
            )}
        </button>
    );
}

export function Header() {
    const { user, logout } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);

    // Generate initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/90">
            <div className="flex items-center gap-6 flex-1">
                <div className="hidden md:flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <h2 className="text-sm font-bold text-primary">فرع الحمرا</h2>
                </div>

                <DbStatusButton />

                <div className="hidden lg:block w-96 relative group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        placeholder="بحث عن منتج، فاتورة، أو عميل..."
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={cn(
                            "relative p-2.5 rounded-full transition-all duration-300",
                            showNotifications ? "bg-primary/10 text-primary" : "hover:bg-gray-100/80 text-gray-500 hover:text-primary"
                        )}
                    >
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    </button>

                    {showNotifications && (
                        <div className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
                            <div className="px-6 pb-3 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-800">التنبيهات</h3>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">3 جديدة</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {[
                                    { title: "طلب جديد", desc: "تم تسجيل طلب جديد برقم #INV-102", time: "منذ دقيقتين", color: "text-blue-600 bg-blue-50" },
                                    { title: "نقص في المخزون", desc: "سجادة صلاة ملكي اقتربت من الانتهاء", time: "منذ ساعة", color: "text-red-600 bg-red-50" },
                                    { title: "تهيئة النظام", desc: "تم تحديث صلاحيات المستخدمين بنجاح", time: "منذ 3 ساعات", color: "text-green-600 bg-green-50" },
                                ].map((item, i) => (
                                    <div key={i} className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50/50 last:border-0">
                                        <div className="flex gap-3">
                                            <div className={cn("w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs", item.color)}>
                                                {item.title[0]}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-800">{item.title}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{item.desc}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{item.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 pt-3 mt-1 text-center">
                                <button className="text-xs font-bold text-primary hover:underline">عرض كل التنبيهات</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                <div className="flex items-center gap-3 p-1 rounded-xl">
                    <div className="text-right hidden md:block leading-tight">
                        <p className="text-sm font-bold text-gray-800">{user?.name || "جاري التحميل..."}</p>
                        <p className="text-xs text-secondary font-medium">
                            {user?.role === 'admin' ? 'مدير النظام' : user?.role === 'manager' ? 'مدير المعرض' : 'كاشير'}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#5D4037] flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 ring-2 ring-white overflow-hidden">
                        {user?.name ? getInitials(user.name) : <UserIcon className="w-5 h-5" />}
                    </div>

                    <button
                        onClick={logout}
                        title="تسجيل الخروج"
                        className="mr-2 p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all hover:rotate-12"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
