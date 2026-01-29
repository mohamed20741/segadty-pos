"use client";

import { useEffect, useState } from "react";
import { getUsersFromSheet, addUserToSheet, getBranchesFromSheet } from "@/lib/google-sheets";
import { User, Branch } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users as UsersIcon,
    Plus,
    Shield,
    UserCheck,
    Search,
    Loader2,
    Lock,
    Edit2,
    Trash2,
    RefreshCw
} from "lucide-react";

import { updateUserInSheet, deleteUserFromSheet } from "@/lib/google-sheets";

const VERSION = "1.2.0"; // للتأكد من تحديث النسخة لدى المستخدم

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [newUser, setNewUser] = useState<Partial<User>>({
        username: "",
        name: "",
        role: "cashier",
        password: "",
        branch_id: "",
        status: "active"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersData, branchesData] = await Promise.all([
                getUsersFromSheet(),
                getBranchesFromSheet()
            ]);
            console.log("Users Data Fetched:", usersData); // Debug log
            if (usersData) setUsers(usersData);
            if (branchesData) setBranches(branchesData);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await addUserToSheet(newUser);
        if (res.status === 'success') {
            setIsAddModalOpen(false);
            fetchData();
            setNewUser({
                username: "",
                name: "",
                role: "cashier",
                password: "",
                branch_id: "",
                status: "active"
            });
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        const res = await updateUserInSheet(editingUser);
        if (res.status === 'success') {
            setEditingUser(null);
            fetchData();
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
        const res = await deleteUserFromSheet(id);
        if (res.status === 'success') {
            fetchData();
        }
    };

    const toggleStatus = async (user: User) => {
        const currentActive = isUserActive(user.status);
        const newStatus = currentActive ? 'inactive' : 'active';
        await updateUserInSheet({ ...user, status: newStatus as any });
        fetchData();
    };

    const filteredUsers = users.filter(user =>
        (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    const isUserActive = (status: any) => {
        if (!status) return false;
        const s = status.toString().trim().toLowerCase();
        return s === 'active' || s === 'نشط' || s === '1' || s === 'true' || s === 'yes' || s === 'active ';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section with defensive checks */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <UsersIcon className="w-8 h-8 text-primary" />
                        إدارة المستخدمين والصلاحيات
                    </h1>
                    <p className="text-gray-500 mt-1">إضافة وإدارة موظفي الفروع وصلاحياتهم</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => fetchData()}
                        disabled={isLoading}
                        className="h-12 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-12 px-6 gap-2 text-lg font-bold shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        إضافة مستخدم جديد
                    </Button>
                </div>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">مستخدم نشط</p>
                        <p className="text-2xl font-bold text-gray-800">{users.filter(u => isUserActive(u.status)).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">مدراء النظام</p>
                        <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === 'admin').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">إجمالي المستخدمين</p>
                        <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                    </div>
                </div>
            </div>

            {/* Table section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="بحث عن اسم أو اسم مستخدم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10 h-11"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-sm font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">الاسم</th>
                                <th className="px-6 py-4">اسم المستخدم</th>
                                <th className="px-6 py-4">الدور</th>
                                <th className="px-6 py-4">الفرع</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            <p className="text-gray-500">جاري تحميل البيانات...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <UsersIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-500">لا يوجد مستخدمين مضافين حالياً</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800">{user.name}</td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">{user.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                                                user.role === 'manager' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-green-50 text-green-600'
                                                }`}>
                                                {user.role === 'admin' ? 'مدير نظام' :
                                                    user.role === 'manager' ? 'مدير فرع' : 'كاشير'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {branches.find(b => b.id === user.branch_id)?.name || 'كل الفروع'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(user)}
                                                className="flex items-center gap-2 group cursor-pointer"
                                            >
                                                <div className={`w-2 h-2 rounded-full transition-all group-hover:scale-125 ${isUserActive(user.status) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-400'}`} />
                                                <span className={`text-sm font-medium ${isUserActive(user.status) ? 'text-green-700' : 'text-red-600'}`}>
                                                    {isUserActive(user.status) ? 'نشط' : 'معطل'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">إضافة مستخدم جديد</h2>

                            <form onSubmit={handleAddUser} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">الاسم الكامل</label>
                                    <Input
                                        required
                                        value={newUser.name}
                                        onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="مثال: خالد العتيبي"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">اسم المستخدم</label>
                                    <Input
                                        required
                                        value={newUser.username}
                                        onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                                        placeholder="khaled_99"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">كلمة المرور</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            type="password"
                                            required
                                            value={newUser.password}
                                            onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="••••••••"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">الصلاحية</label>
                                        <select
                                            className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                            value={newUser.role}
                                            onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                                        >
                                            <option value="cashier">كاشير</option>
                                            <option value="manager">مدير فرع</option>
                                            <option value="admin">مدير نظام</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">الفرع</label>
                                        <select
                                            className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                            value={newUser.branch_id}
                                            onChange={e => setNewUser(prev => ({ ...prev, branch_id: e.target.value }))}
                                        >
                                            <option value="">كل الفروع</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 font-bold"
                                    >
                                        تأكيد الإضافة
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="h-12 px-6"
                                    >
                                        إلغاء
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">تعديل بيانات المستخدم</h2>

                            <form onSubmit={handleUpdateUser} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">الاسم الكامل</label>
                                    <Input
                                        required
                                        value={editingUser.name}
                                        onChange={e => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                                        placeholder="مثال: خالد العتيبي"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">اسم المستخدم</label>
                                    <Input
                                        required
                                        value={editingUser.username}
                                        onChange={e => setEditingUser(prev => prev ? ({ ...prev, username: e.target.value }) : null)}
                                        placeholder="khaled_99"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">كلمة المرور (اتركها فارغة إذا لم تكن تريد التغيير)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            type="password"
                                            value={editingUser.password || ""}
                                            onChange={e => setEditingUser(prev => prev ? ({ ...prev, password: e.target.value }) : null)}
                                            placeholder="••••••••"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">الصلاحية</label>
                                        <select
                                            className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                            value={editingUser.role}
                                            onChange={e => setEditingUser(prev => prev ? ({ ...prev, role: e.target.value as any }) : null)}
                                        >
                                            <option value="cashier">كاشير</option>
                                            <option value="manager">مدير فرع</option>
                                            <option value="admin">مدير نظام</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">الحالة</label>
                                        <select
                                            className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                            value={editingUser.status}
                                            onChange={e => setEditingUser(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                                        >
                                            <option value="active">نشط</option>
                                            <option value="inactive">معطل</option>
                                            <option value="blocked">محظور</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 font-bold bg-blue-600 hover:bg-blue-700"
                                    >
                                        حفظ التعديلات
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingUser(null)}
                                        className="h-12 px-6"
                                    >
                                        إلغاء
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            <div className="fixed bottom-4 left-4 text-[10px] text-gray-300 pointer-events-none">
                v{VERSION}
            </div>
        </div>
    );
}
