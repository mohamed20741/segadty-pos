"use client";

import { Bell, Search } from "lucide-react";

export function Header() {
    return (
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/90">
            <div className="flex items-center gap-6 flex-1">
                <div className="hidden md:flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <h2 className="text-sm font-bold text-primary">فرع الحمرا</h2>
                </div>

                <div className="hidden lg:block w-96 relative group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        placeholder="بحث عن منتج، فاتورة، أو عميل..."
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative p-2.5 rounded-full hover:bg-gray-100/80 transition-colors text-gray-500 hover:text-primary">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-1 ring-red-500/20" />
                </button>

                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                <div className="flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="text-left hidden md:block leading-tight">
                        <p className="text-sm font-bold text-gray-800">محمد علي</p>
                        <p className="text-xs text-secondary font-medium">مدير المعرض</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#5D4037] flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 ring-2 ring-white">
                        MA
                    </div>
                </div>
            </div>
        </header>
    );
}
