"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BarChart3,
    Settings,
    Users,
    LogOut,
    Store,
    Database,
    RotateCcw
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

const menuItems = [
    { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
    { href: "/pos", label: "نقطة البيع", icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    { href: "/returns", label: "المرتجعات والتبديل", icon: RotateCcw, roles: ['admin', 'manager', 'cashier'] },
    { href: "/inventory", label: "المخزون", icon: Package, roles: ['admin', 'manager'] },
    { href: "/reports", label: "التقارير", icon: BarChart3, roles: ['admin', 'manager'] },
    { href: "/branches", label: "الفروع", icon: Store, roles: ['admin'] },
    { href: "/users", label: "المستخدمين", icon: Users, roles: ['admin'] },
    { href: "/admin/logs", label: "سجل العمليات", icon: Database, roles: ['admin'] },
    { href: "/admin/migrate", label: "نقل البيانات", icon: Database, roles: ['admin'] },
    { href: "/settings", label: "الإعدادات", icon: Settings, roles: ['admin', 'manager'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const filteredMenuItems = menuItems.filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <aside className={cn(
            "hidden md:flex flex-col w-72 text-foreground border-l border-border h-screen shadow-2xl transition-all",
            "bg-card"
        )}>
            <div className="p-8 flex items-center gap-4 border-b border-border bg-muted/30">
                <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
                    <Store className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-wide font-sans">Segadty</h1>
                    <p className="text-xs text-muted-foreground font-medium">نظام نقاط البيع</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {filteredMenuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-[-4px]"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                            <span className="font-bold tracking-wide">{item.label}</span>

                            {isActive && (
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary-foreground shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border bg-muted/30">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">تسجيل الخروج</span>
                </button>
            </div>
        </aside>
    );
}
