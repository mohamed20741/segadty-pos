"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User as UserIcon, Lock, Eye, EyeOff, Globe, Phone, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginUser as apiLogin } from "@/lib/google-sheets";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiLogin(formData);

            if (response.status === 'success') {
                login(response.data);
            } else {
                setError(response.message || "فشل تسجيل الدخول. يرجى التحقق من البيانات.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-surface relative overflow-hidden">
            {/* Decorative Islamic Pattern Background (CSS-only approximation or simple gradient) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(#8B4513 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}>
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-[450px] p-8 md:p-12 bg-white shadow-2xl rounded-3xl border border-white/50 backdrop-blur-md animate-in fade-in zoom-in duration-500">

                {/* Header */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="h-20 w-20 bg-gradient-to-br from-primary to-secondary rounded-2xl rotate-3 flex items-center justify-center mb-6 shadow-xl relative group">
                        <div className="absolute inset-0 bg-white opacity-20 rounded-2xl group-hover:opacity-10 transition-opacity"></div>
                        {/* Simple Icon Representation */}
                        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-primary mb-2 tracking-tight">Segadty POS</h1>
                    <p className="text-gray-500 font-medium">بوابة دخول الموظفين</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 rounded-lg flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 mr-1">اسم المستخدم</label>
                        <Input
                            startIcon={<UserIcon className="w-5 h-5" />}
                            placeholder="user@segadty.com"
                            className="bg-gray-50 border-gray-200 focus:bg-white h-12"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 mr-1">كلمة المرور</label>
                        <Input
                            type={showPassword ? "text" : "password"}
                            startIcon={<Lock className="w-5 h-5" />}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            endIcon={
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-primary transition-colors focus:outline-none">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            }
                            placeholder="••••••••"
                            className="bg-gray-50 border-gray-200 focus:bg-white h-12"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end">
                        <a href="#" className="text-sm text-primary hover:text-secondary font-semibold transition-colors">
                            نسيت كلمة المرور؟
                        </a>
                    </div>

                    <Button
                        type="submit"
                        className="w-full text-lg bg-gradient-to-r from-primary to-[#A0522D] hover:from-[#703810] hover:to-[#8B4513] shadow-lg shadow-primary/30 transition-all duration-300 h-14 rounded-xl"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                جاري التحقق...
                            </span>
                        ) : "تسجيل الدخول الآمن"}
                    </Button>
                </form>

                {/* Footer */}
                <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between text-gray-400 text-sm">
                    <button className="flex items-center gap-2 hover:text-primary transition-colors group">
                        <div className="p-1.5 rounded-full bg-gray-50 group-hover:bg-primary/10 transition-colors">
                            <Globe className="w-4 h-4" />
                        </div>
                        <span>English</span>
                    </button>

                    <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-help">
                        <Phone className="w-3 h-3" />
                        <span>الدعم الفني</span>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-300">Segadty POS v1.0.0</p>
                </div>
            </div>
        </div>
    );
}
