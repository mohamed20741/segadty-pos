"use client";

import { useEffect, useState } from "react";
import { getBranchesFromSheet, addBranchToSheet } from "@/lib/google-sheets";
import { Branch } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Store,
    Plus,
    MapPin,
    Phone,
    Search,
    Loader2,
    MoreVertical,
    Activity,
    CheckCircle2
} from "lucide-react";

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [newBranch, setNewBranch] = useState<Partial<Branch>>({
        name: "",
        location: "",
        phone: "",
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        const data = await getBranchesFromSheet();
        if (data) setBranches(data);
        setIsLoading(false);
    };

    const handleAddBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await addBranchToSheet(newBranch);
        if (res.status === 'success') {
            setIsAddModalOpen(false);
            fetchData();
            setNewBranch({
                name: "",
                location: "",
                phone: "",
                is_active: true
            });
        }
    };

    const filteredBranches = branches.filter(branch =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Store className="w-8 h-8 text-primary" />
                        إدارة الفروع
                    </h1>
                    <p className="text-gray-500 mt-1">إضافة وتعديل بيانات الفروع التابعة للمؤسسة</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-12 px-6 gap-2 text-lg font-bold shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    إضافة فرع جديد
                </Button>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">فروع تعمل</p>
                        <p className="text-2xl font-bold text-gray-800">{branches.filter(b => b.is_active).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">إجمالي الفروع</p>
                        <p className="text-2xl font-bold text-gray-800">{branches.length}</p>
                    </div>
                </div>
            </div>

            {/* Table section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="بحث عن فرع..."
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
                                <th className="px-6 py-4">اسم الفرع</th>
                                <th className="px-6 py-4">الموقع</th>
                                <th className="px-6 py-4">رقم الهاتف</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mr-4" />
                                        <p className="mt-4 text-gray-500">جاري تحميل البيانات...</p>
                                    </td>
                                </tr>
                            ) : filteredBranches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Store className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-500">لا يوجد فروع مضافة حالياً</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBranches.map((branch) => (
                                    <tr key={branch.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800">{branch.name}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                {branch.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                {branch.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${branch.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-400'}`} />
                                                <span className="text-sm font-medium">{branch.is_active ? 'يعمل' : 'متوقف'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Branch Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <Store className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">إضافة فرع جديد</h2>
                            </div>

                            <form onSubmit={handleAddBranch} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">اسم الفرع</label>
                                    <Input
                                        required
                                        value={newBranch.name}
                                        onChange={e => setNewBranch(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="مثال: فرع الرياض - التخصصي"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">الموقع</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            required
                                            value={newBranch.location}
                                            onChange={e => setNewBranch(prev => ({ ...prev, location: e.target.value }))}
                                            placeholder="الرياض، حي العليا"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">رقم التواصل</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            required
                                            value={newBranch.phone}
                                            onChange={e => setNewBranch(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="011XXXXXXX"
                                            className="pl-10"
                                        />
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
        </div>
    );
}
