"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Filter,
    Plus,
    Package,
    AlertTriangle,
    Edit,
    Trash,
    ArrowUpDown,
    FileDown,
    FileUp,
    RefreshCw,
    X,
    CheckCircle,
    LayoutGrid,
    Truck
} from "lucide-react";
import { Product } from "@/types";
import {
    getProductsFromSheet,
    addProductToSheet,
    updateProductInSheet,
    bulkAddProductsToSheet,
    deleteProductFromSheet
} from "@/lib/google-sheets";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "feeding">("list");

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        const data = await getProductsFromSheet();
        if (data) setProducts(data);
        setIsLoading(false);
    };

    const handleDeleteProduct = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف المنتج "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;

        setIsSaving(true);
        try {
            await deleteProductFromSheet(id);
            await fetchProducts();
            alert("تم حذف المنتج بنجاح");
        } catch (error) {
            console.error("Delete failed:", error);
            alert("فشل حذف المنتج");
        } finally {
            setIsSaving(false);
        }
    };

    const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || product.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const lowStockItems = products.filter(p => (Number(p.quantity) || 0) <= (Number(p.min_quantity) || 5)).length;
    const totalValue = products.reduce((acc, curr) => acc + (Number(curr.cost_price) * (Number(curr.quantity) || 0)), 0);

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (currentProduct.id) {
                await updateProductInSheet(currentProduct);
            } else {
                await addProductToSheet(currentProduct);
            }
            await fetchProducts();
            setIsEditModalOpen(false);
            setCurrentProduct({});
        } catch (error) {
            console.error("Failed to save product:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadTemplate = () => {
        // إضافة UTF-8 BOM لضمان دعم اللغة العربية في Excel
        const headers = "\uFEFFid,name,category,cost_price,selling_price,quantity,min_quantity\n";
        const example = "P001,سجادة صلاة فاخرة,سجاد,150,250,100,10\n";
        const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "نموذج_رفع_المنتجات.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csvText = event.target?.result as string;
            // تنظيف أي BOM قد يتواجد في الملف المرفوع ومعالجة نهايات السطور
            const cleanText = csvText.replace(/^\uFEFF/, "");
            const lines = cleanText.split(/\r?\n/);
            const dataRows = lines.slice(1).filter(line => line.trim() !== "");

            const newProducts = dataRows.map(line => {
                const cols = line.split(',');
                if (cols.length < 5) return null;
                return {
                    id: cols[0]?.trim(),
                    name: cols[1]?.trim(),
                    category: cols[2]?.trim(),
                    cost_price: Number(cols[3]) || 0,
                    selling_price: Number(cols[4]) || 0,
                    quantity: Number(cols[5]) || 0,
                    min_quantity: Number(cols[6]) || 5
                };
            }).filter(p => p !== null) as Product[];

            if (newProducts.length === 0) {
                alert("تعذر قراءة البيانات من الملف. يرجى التأكد من الصيغة.");
                return;
            }

            setIsSaving(true);
            try {
                await bulkAddProductsToSheet(newProducts);
                await fetchProducts();
                setIsSaving(false);
                alert(`تم رفع وتحديث ${newProducts.length} منتج بنجاح!`);
            } catch (error) {
                alert("حدث خطأ أثناء رفع البيانات.");
                setIsSaving(false);
            }
        };
        reader.readAsText(file, "UTF-8");
    };

    const getStockStatus = (p: Product) => {
        const q = Number(p.quantity) || 0;
        const m = Number(p.min_quantity) || 5;
        if (q === 0) return { label: "نفد الكمية", color: "bg-red-100 text-red-700 border-red-200" };
        if (q <= m) return { label: "منخفض", color: "bg-orange-100 text-orange-700 border-orange-200" };
        return { label: "متوفر", color: "bg-green-100 text-green-700 border-green-200" };
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Package className="w-9 h-9 text-primary" />
                        إدارة المخزون والعمليات
                    </h1>
                    <p className="text-gray-500 mt-1">تتبع المنتجات، تحديث الكميات، ومعالجة التوريد</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all", viewMode === 'list' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:bg-gray-50")}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        قائمة المخزون
                    </button>
                    <button
                        onClick={() => setViewMode("feeding")}
                        className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all", viewMode === 'feeding' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:bg-gray-50")}
                    >
                        <Truck className="w-4 h-4" />
                        قائمة التغذية (التوريد)
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Package className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold">إجمالي المنتجات</p>
                        <p className="text-2xl font-black text-gray-800">{products.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold">تنبيهات انخفاض</p>
                        <p className="text-2xl font-black text-gray-800">{lowStockItems} منتجات</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <RefreshCw className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold">قيمة المخزون</p>
                        <p className="text-2xl font-black text-gray-800 font-sans">{totalValue.toLocaleString()} ر.س</p>
                    </div>
                </div>
            </div>

            {viewMode === "list" ? (
                <>
                    {/* Controls */}
                    <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center sticky top-4 z-20">
                        <div className="relative flex-1 w-full translate-y-0">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="ابحث عن اسم المنتج أو الباركود..."
                                className="pl-4 pr-12 h-13 rounded-2xl border-gray-200 focus:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <select
                                className="h-13 px-5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-600 focus:ring-2 focus:ring-primary outline-none min-w-[140px]"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat === 'all' ? 'جميع التصنيفات' : cat}</option>
                                ))}
                            </select>

                            <Button onClick={() => { setCurrentProduct({}); setIsEditModalOpen(true); }} className="h-13 px-6 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20 flex-1 lg:flex-none">
                                <Plus className="w-5 h-5" />
                                إضافة منتج
                            </Button>

                            <Button variant="outline" onClick={fetchProducts} className="h-13 w-13 p-0 rounded-2xl text-gray-400 hover:text-primary">
                                <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <RefreshCw className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-gray-500 font-bold">جاري تحميل بيانات السحابة...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                            <th className="py-5 px-8">المنتج</th>
                                            <th className="py-5 px-8">التصنيف</th>
                                            <th className="py-5 px-8 text-center text-primary">السعر النهائي</th>
                                            <th className="py-5 px-8 text-center">المخزون</th>
                                            <th className="py-5 px-8">الحالة</th>
                                            <th className="py-5 px-8 text-left">التحكم</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredProducts.map((p) => {
                                            const status = getStockStatus(p);
                                            return (
                                                <tr key={p.id} className="group hover:bg-primary/[0.02] transition-colors">
                                                    <td className="py-6 px-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center font-bold text-gray-400 shadow-inner group-hover:from-primary/10 group-hover:to-primary/5 transition-colors">
                                                                {p.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-gray-800 text-base">{p.name}</p>
                                                                <p className="text-xs text-gray-400 font-mono tracking-tighter">SKU: {p.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-8">
                                                        <span className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                                            {p.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <div className="flex flex-col">
                                                            <span className="font-sans font-black text-primary text-lg">{p.selling_price} <span className="text-xs">ر.س</span></span>
                                                            <span className="text-[10px] text-gray-400 font-bold">التكلفة: {p.cost_price}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <span className={cn("text-lg font-sans font-black", (Number(p.quantity) || 0) <= (Number(p.min_quantity) || 5) ? "text-red-500" : "text-gray-800")}>
                                                            {p.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-8">
                                                        <span className={cn("px-4 py-1.5 rounded-full text-[11px] font-black border tracking-wide", status.color)}>
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-8 text-left">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => { setCurrentProduct(p); setIsEditModalOpen(true); }}
                                                                className="p-3 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                            >
                                                                <Trash className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Inventory Feeding Section */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col items-center text-center gap-6 group hover:translate-y-[-4px] transition-all">
                        <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <FileDown className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-800">تنزيل النموذج التيمبلت</h3>
                            <p className="text-gray-500 mt-2 leading-relaxed">قم بتنزيل ملف الـ CSV وتعبئته بالمنتجات الجديدة أو تحديث الكميات الحالية ثم ارفعه للنظام.</p>
                        </div>
                        <Button variant="outline" onClick={handleDownloadTemplate} className="w-full h-16 rounded-[1.5rem] text-lg font-black gap-3 border-2 border-primary/20 text-primary">
                            <FileDown className="w-6 h-6" />
                            تنزيل الملف (Template)
                        </Button>
                    </div>

                    <div className="bg-gradient-to-br from-primary to-[#5D4037] p-10 rounded-[3rem] shadow-2xl text-white flex flex-col items-center text-center gap-6 group hover:translate-y-[-4px] transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileUp className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">رفع وتحديث البيانات</h3>
                            <p className="text-white/70 mt-2 leading-relaxed">اختر الملف الذي قمت بتعبئته وسيتم تحديث المخزون وإضافة المنتجات الجديدة تلقائياً في السحابة.</p>
                        </div>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSaving}
                            className="w-full h-16 rounded-[1.5rem] bg-secondary hover:bg-secondary/90 text-primary text-xl font-black gap-3 shadow-xl"
                        >
                            {isSaving ? <RefreshCw className="animate-spin w-6 h-6" /> : <FileUp className="w-6 h-6" />}
                            {isSaving ? "جاري المعالجة..." : "رفع الملف والبدء (Upload)"}
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleUploadTemplate}
                            accept=".csv"
                            className="hidden"
                        />
                        <div className="flex items-center gap-2 text-xs font-bold text-white/50 bg-black/10 px-4 py-2 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            يدعم تنسيق CSV فقط
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Add Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative border border-white/20">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-800">{currentProduct.id ? "تعديل المنتج" : "منتج جديد"}</h2>
                                    <p className="text-gray-500 mt-1">تأكد من دقة الأسعار والكميات قبل الحفظ</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-3 rounded-2xl hover:bg-gray-100 text-gray-400 transition-colors">
                                    <X className="w-7 h-7" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProduct} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-gray-700 mr-2">اسم المنتج</label>
                                    <Input
                                        required
                                        value={currentProduct.name || ""}
                                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-lg font-bold"
                                        placeholder="مثال: سجادة صلاة فاخرة"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 mr-2">التصنيف</label>
                                        <Input
                                            required
                                            value={currentProduct.category || ""}
                                            onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                            className="h-14 rounded-2xl border-gray-100 bg-gray-50/50"
                                            placeholder="سجاد، بخور..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 mr-2">الباركود (ID)</label>
                                        <Input
                                            required
                                            disabled={!!currentProduct.id}
                                            value={currentProduct.id || ""}
                                            onChange={e => setCurrentProduct({ ...currentProduct, id: e.target.value })}
                                            className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-mono"
                                            placeholder="P001"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 mr-2 text-primary">سعر البيع</label>
                                        <Input
                                            type="number"
                                            required
                                            value={currentProduct.selling_price || ""}
                                            onChange={e => setCurrentProduct({ ...currentProduct, selling_price: Number(e.target.value) })}
                                            className="h-14 rounded-2xl border-primary/10 bg-primary/5 font-sans font-black text-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 mr-2">سعر التكلفة</label>
                                        <Input
                                            type="number"
                                            required
                                            value={currentProduct.cost_price || ""}
                                            onChange={e => setCurrentProduct({ ...currentProduct, cost_price: Number(e.target.value) })}
                                            className="h-14 rounded-2xl border-gray-100 bg-gray-50/50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pb-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 mr-2">الكمية المتوفرة</label>
                                        <Input
                                            type="number"
                                            required
                                            value={currentProduct.quantity || ""}
                                            onChange={e => setCurrentProduct({ ...currentProduct, quantity: Number(e.target.value) })}
                                            className="h-14 rounded-2xl border-gray-100 bg-gray-50/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 mr-2">تنبيه عند كمية</label>
                                        <Input
                                            type="number"
                                            required
                                            value={currentProduct.min_quantity || 5}
                                            onChange={e => setCurrentProduct({ ...currentProduct, min_quantity: Number(e.target.value) })}
                                            className="h-14 rounded-2xl border-gray-100 bg-gray-50/50"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full h-18 text-xl font-black rounded-[1.5rem] shadow-2xl shadow-primary/30 gap-3"
                                >
                                    {isSaving ? <RefreshCw className="animate-spin" /> : <CheckCircle className="w-7 h-7" />}
                                    {isSaving ? "جاري المعالجة..." : "حفظ بيانات المنتج"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
