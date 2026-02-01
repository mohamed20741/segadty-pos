"use client";

import { useState } from "react";
import { Search, RotateCcw, ArrowLeftRight, Printer, AlertCircle, CheckCircle2, Loader2, User, Phone, Calendar, Hash, Tag, Package, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchInvoice, getInvoiceDetails, processReturnExchange, getProductsFromSheet } from "@/lib/google-sheets";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types";

interface Invoice {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    status: string;
    created_at: string;
}

interface InvoiceItem {
    id: string;
    product_id: string;
    sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    vat: number;
}

export default function ReturnsPage() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<{ order: Invoice, items: InvoiceItem[] } | null>(null);
    const [step, setStep] = useState<"search" | "details" | "process" | "success">("search");
    const [operationType, setOperationType] = useState<"RETURN" | "EXCHANGE">("RETURN");

    // Process State
    const [itemsToReturn, setItemsToReturn] = useState<Record<string, number>>({});
    const [newItems, setNewItems] = useState<{ product: Product, qty: number }[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [operationResult, setOperationResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await searchInvoice(searchQuery);
            if (res.status === 'success') {
                setSearchResults(res.data);
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("حدث خطأ أثناء البحث");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectInvoice = async (invoiceId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await getInvoiceDetails(invoiceId);
            if (res.status === 'success') {
                setSelectedInvoice(res.data);
                setStep("details");
                // Initialize items to return (none by default)
                const initialReturns: Record<string, number> = {};
                res.data.items.forEach((item: InvoiceItem) => {
                    initialReturns[item.id] = 0;
                });
                setItemsToReturn(initialReturns);
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("حدث خطأ أثناء تحميل تفاصيل الفاتورة");
        } finally {
            setIsLoading(false);
        }
    };

    const startReturn = () => {
        setOperationType("RETURN");
        setStep("process");
    };

    const startExchange = async () => {
        setOperationType("EXCHANGE");
        setStep("process");
        // Pre-load products for exchange
        if (availableProducts.length === 0) {
            const prods = await getProductsFromSheet();
            if (prods) setAvailableProducts(prods);
        }
    };

    const handleUpdateReturnQty = (itemId: string, max: number, val: number) => {
        setItemsToReturn(prev => ({
            ...prev,
            [itemId]: Math.max(0, Math.min(max, val))
        }));
    };

    const addNewItem = (product: Product) => {
        setNewItems(prev => [...prev, { product, qty: 1 }]);
    };

    const removeNewItem = (index: number) => {
        setNewItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateNewItemQty = (index: number, val: number) => {
        setNewItems(prev => prev.map((item, i) => i === index ? { ...item, qty: Math.max(1, val) } : item));
    };

    // Calculations
    const returnedSubtotal = selectedInvoice?.items.reduce((acc, item) => {
        const qty = itemsToReturn[item.id] || 0;
        return acc + (qty * item.unit_price);
    }, 0) || 0;

    const newSubtotal = newItems.reduce((acc, item) => {
        return acc + (item.qty * item.product.selling_price);
    }, 0);

    const diff = newSubtotal - returnedSubtotal;
    const vatAdjustment = diff * 0.15;
    const totalDiff = diff + vatAdjustment;

    const handleProcess = async () => {
        if (!selectedInvoice) return;

        const returnedItems = selectedInvoice.items
            .filter(item => itemsToReturn[item.id] > 0)
            .map(item => ({
                sku: item.product_id, // We use product_id as SKU in GS
                qty: itemsToReturn[item.id],
                type: 'RETURNED',
                reason: 'Customer Request'
            }));

        if (returnedItems.length === 0) {
            alert("يرجى اختيار منتج واحد على الأقل للإرجاع");
            return;
        }

        setIsProcessing(true);
        try {
            const items = [...returnedItems];
            if (operationType === 'EXCHANGE') {
                newItems.forEach(ni => {
                    items.push({
                        sku: ni.product.id,
                        qty: ni.qty,
                        type: 'NEW',
                        reason: 'Exchange'
                    });
                });
            }

            const payload = {
                invoice_id: selectedInvoice.order.id,
                operation_type: operationType,
                total_amount: Math.abs(totalDiff),
                vat_adjustment: vatAdjustment,
                items,
                created_by: user?.username,
                payment: {
                    amount: Math.abs(totalDiff),
                    method: 'cash', // Default
                    direction: totalDiff > 0 ? 'COLLECT' : 'REFUND'
                }
            };

            const res = await processReturnExchange(payload);
            if (res.status === 'success') {
                setOperationResult({ ...payload, id: res.operationId });
                setStep("success");
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("حدث خطأ أثناء تنفيذ العملية");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#3E2723]">المرتجعات والتبديل</h1>
                    <p className="text-[#8D6E63] mt-1 font-medium">إدارة عمليات استرجاع واستبدال الفواتير</p>
                </div>
                {step !== "search" && (
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (step === 'success') {
                                setStep('search');
                                setSelectedInvoice(null);
                                setSearchResults([]);
                            } else if (step === 'process') {
                                setStep('details');
                            } else {
                                setStep('search');
                            }
                        }}
                        className="gap-2 border-[#D7CCC8] text-[#5D4037] hover:bg-[#EFEBE9]"
                    >
                        <Search className="w-4 h-4" />
                        العودة للبحث
                    </Button>
                )}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-3xl shadow-xl shadow-brown-500/5 border border-brown-100 overflow-hidden min-h-[500px]">

                {/* 1. Search Step */}
                {step === "search" && (
                    <div className="p-12 text-center max-w-2xl mx-auto space-y-8">
                        <div className="w-20 h-20 bg-brown-50 rounded-full flex items-center justify-center mx-auto">
                            <RotateCcw className="w-10 h-10 text-[#3E2723]" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-800">ابحث عن الفاتورة</h2>
                            <p className="text-gray-500">أدخل رقم الفاتورة، اسم العميل، أو رقم الجوال للبدء</p>
                        </div>

                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    className="h-14 pr-12 text-lg rounded-2xl border-gray-200 focus:ring-primary/20"
                                    placeholder="بحث بـ رقم الفاتورة، الاسم، أو الجوال..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="h-14 px-8 text-lg rounded-2xl" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "بحث"}
                            </Button>
                        </form>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-bold">{error}</span>
                            </div>
                        )}

                        {searchResults.length > 0 && (
                            <div className="grid grid-cols-1 gap-4 text-right mt-12">
                                {searchResults.map((inv) => (
                                    <button
                                        key={inv.id}
                                        onClick={() => handleSelectInvoice(inv.id)}
                                        className="group p-6 rounded-2xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-between"
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Hash className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-gray-800">{inv.invoice_number}</h3>
                                                <p className="text-sm text-gray-500">{inv.customer_name} • {inv.customer_phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-primary font-bold text-lg">{inv.total_amount.toLocaleString()} ر.س</p>
                                            <p className="text-xs text-gray-400 font-mono">{new Date(inv.created_at).toLocaleDateString('ar-SA')}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Details Step */}
                {step === "details" && selectedInvoice && (
                    <div className="p-8 space-y-8 animate-in slide-in-from-left-4">
                        {/* Invoice Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-500 mb-1">
                                    <Hash className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">رقم الفاتورة</span>
                                </div>
                                <p className="text-xl font-bold text-[#3E2723]">{selectedInvoice.order.invoice_number}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-500 mb-1">
                                    <User className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">العميل</span>
                                </div>
                                <p className="text-xl font-bold text-[#3E2723]">{selectedInvoice.order.customer_name}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-500 mb-1">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">الجوال</span>
                                </div>
                                <p className="text-xl font-bold text-[#3E2723]">{selectedInvoice.order.customer_phone}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-500 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">التاريخ</span>
                                </div>
                                <p className="text-xl font-bold text-[#3E2723]">{new Date(selectedInvoice.order.created_at).toLocaleDateString('ar-SA')}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-gray-100 rounded-3xl overflow-hidden">
                            <table className="w-full text-right">
                                <thead className="bg-[#3E2723] text-white">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">المنتج</th>
                                        <th className="px-6 py-4 font-bold">الكمية الأصلية</th>
                                        <th className="px-6 py-4 font-bold">سعر الوحدة</th>
                                        <th className="px-6 py-4 font-bold">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedInvoice.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{item.product_name}</p>
                                                        <p className="text-xs text-gray-400 font-mono">SKU: {item.product_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-700">{item.quantity}</td>
                                            <td className="px-6 py-4 font-bold text-gray-700">{item.unit_price} ر.س</td>
                                            <td className="px-6 py-4 font-bold text-primary">{item.subtotal} ر.س</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                            <Button
                                onClick={startReturn}
                                className="flex-1 h-16 rounded-2xl text-lg gap-4 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/10"
                            >
                                <RotateCcw className="w-6 h-6" />
                                عمل استرجاع (Return)
                            </Button>
                            <Button
                                onClick={startExchange}
                                className="flex-1 h-16 rounded-2xl text-lg gap-4 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/10"
                            >
                                <ArrowLeftRight className="w-6 h-6" />
                                عمل استبدال (Exchange)
                            </Button>
                        </div>
                    </div>
                )}

                {/* 3. Process Step */}
                {step === "process" && selectedInvoice && (
                    <div className="p-8 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", operationType === 'RETURN' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600')}>
                                {operationType === 'RETURN' ? <RotateCcw className="w-6 h-6" /> : <ArrowLeftRight className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{operationType === 'RETURN' ? 'عملية استرجاع منتجات' : 'عملية استبدال منتجات'}</h3>
                                <p className="text-gray-500">اختر الكميات والمنتجات بدقة</p>
                            </div>
                        </div>

                        {/* Returned Items Section */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-primary" />
                                تحديد المنتجات المرتجعة
                            </h4>
                            <div className="border border-gray-100 rounded-3xl overflow-hidden">
                                <table className="w-full text-right">
                                    <thead className="bg-[#EFEBE9] text-[#5D4037]">
                                        <tr>
                                            <th className="px-6 py-4">المنتج</th>
                                            <th className="px-6 py-4">الكمية المتاحة</th>
                                            <th className="px-6 py-4">الكمية المراد إرجاعها</th>
                                            <th className="px-6 py-4">القيمة المرجعة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedInvoice.items.map((item) => (
                                            <tr key={item.id} className={cn("transition-colors", itemsToReturn[item.id] > 0 ? 'bg-red-50/30' : '')}>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-800">{item.product_name}</p>
                                                </td>
                                                <td className="px-6 py-4 font-bold">{item.quantity}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleUpdateReturnQty(item.id, item.quantity, itemsToReturn[item.id] - 1)}
                                                            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-12 text-center font-bold text-lg">{itemsToReturn[item.id]}</span>
                                                        <button
                                                            onClick={() => handleUpdateReturnQty(item.id, item.quantity, itemsToReturn[item.id] + 1)}
                                                            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-red-600">
                                                    {(itemsToReturn[item.id] * item.unit_price).toLocaleString()} ر.س
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Exchange Part */}
                        {operationType === 'EXCHANGE' && (
                            <div className="space-y-6 pt-8 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-amber-600" />
                                        إضافة المنتجات الجديدة (البديلة)
                                    </h4>

                                    <div className="relative w-72">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <select
                                            className="w-full h-10 pr-10 rounded-xl border border-gray-100 bg-gray-50 text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                                            onChange={(e) => {
                                                const p = availableProducts.find(ap => ap.id === e.target.value);
                                                if (p) addNewItem(p);
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">بحث عن منتج بديل...</option>
                                            {availableProducts.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.selling_price} ر.س)</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {newItems.length > 0 ? (
                                    <div className="border border-amber-100 bg-amber-50/10 rounded-3xl overflow-hidden">
                                        <table className="w-full text-right">
                                            <thead>
                                                <tr className="bg-amber-100/50 text-amber-800">
                                                    <th className="px-6 py-4">المنتج البديل</th>
                                                    <th className="px-6 py-4 text-center">الكمية</th>
                                                    <th className="px-6 py-4">السعر</th>
                                                    <th className="px-6 py-4">الإجمالي</th>
                                                    <th className="px-6 py-4"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-amber-100">
                                                {newItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-6 py-4 font-bold">{item.product.name}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <button onClick={() => updateNewItemQty(idx, item.qty - 1)} className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center">-</button>
                                                                <span className="font-bold">{item.qty}</span>
                                                                <button onClick={() => updateNewItemQty(idx, item.qty + 1)} className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">+</button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{item.product.selling_price} ر.س</td>
                                                        <td className="px-6 py-4 font-bold text-amber-600">{item.qty * item.product.selling_price} ر.س</td>
                                                        <td className="px-6 py-4">
                                                            <button onClick={() => removeNewItem(idx)} className="text-red-500 hover:text-red-700">
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                        <p className="text-gray-400 font-medium">لم يتم إضافة منتجات بديلة بعد</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Summary for Processing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                                <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">الملخص المالي</h5>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">قيمة المرتجع</span>
                                    <span className="font-bold text-red-600">-{returnedSubtotal.toLocaleString()} ر.س</span>
                                </div>
                                {operationType === 'EXCHANGE' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">قيمة المنتجات الجديدة</span>
                                        <span className="font-bold text-green-600">+{newSubtotal.toLocaleString()} ر.س</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">تسوية الضريبة (15%)</span>
                                    <span className="font-bold text-gray-800">{vatAdjustment.toLocaleString()} ر.س</span>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-xl">
                                    <span className="font-bold text-gray-800">{totalDiff > 0 ? "المبلغ المراد تحصيله" : "المبلغ المراد استرجاعه"}</span>
                                    <span className={cn("font-black", totalDiff > 0 ? 'text-amber-600' : 'text-primary')}>
                                        {Math.abs(totalDiff).toLocaleString()} ر.س
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col justify-end gap-4 pb-4">
                                <Button
                                    onClick={handleProcess}
                                    disabled={isProcessing || returnedSubtotal === 0}
                                    className={cn("h-16 rounded-2xl text-xl font-bold gap-3 shadow-lg", operationType === 'RETURN' ? 'bg-primary hover:bg-primary/95 shadow-primary/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20')}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            جاري تنفيذ العملية...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-6 h-6" />
                                            {operationType === 'RETURN' ? 'تأكيد عملية الاسترجاع' : 'تأكيد عملية الاستبدال'}
                                        </>
                                    )}
                                </Button>
                                <p className="text-center text-xs text-gray-400">* بمجرد التأكيد، لا يمكن التراجع عن هذه العملية</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Success Step */}
                {step === "success" && operationResult && (
                    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[500px] animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-800 mb-2">تمت العملية بنجاح!</h2>
                        <p className="text-gray-500 text-lg mb-8">تم تحديث المخزون والحسابات المالية للفاتورة {selectedInvoice?.order.invoice_number}</p>

                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 w-full max-w-lg mb-12 space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                                <span className="text-gray-500">نوع العملية</span>
                                <span className="font-bold px-3 py-1 bg-white rounded-lg border border-gray-200">{operationType === 'RETURN' ? "استرجاع" : "استبدال"}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                                <span className="text-gray-500">المبلغ الإجمالي</span>
                                <span className="font-bold text-2xl text-[#3E2723]">{operationResult.total_amount.toLocaleString()} ر.س</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">طريقة التسوية</span>
                                <span className="font-bold text-primary">{operationResult.payment.direction === 'REFUND' ? "استرجاع نقدي للعميل" : "تحصيل نقدي من العميل"}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                            <Button onClick={handlePrint} className="flex-1 h-14 rounded-2xl gap-3 bg-gray-800 hover:bg-gray-900">
                                <Printer className="w-5 h-5" />
                                طباعة سند {operationType === 'RETURN' ? "إرجاع" : "تبديل"}
                            </Button>
                            <Button variant="outline" onClick={() => {
                                setStep("search");
                                setSelectedInvoice(null);
                                setSearchResults([]);
                                setItemsToReturn({});
                                setNewItems([]);
                                setOperationResult(null);
                            }} className="flex-1 h-14 rounded-2xl border-gray-200">
                                البدء من جديد
                            </Button>
                        </div>

                        {/* Thermal Print Hidden content - for Receipt */}
                        <div className="hidden">
                            <div id="thermal-receipt" className="receipt-container text-right p-4 font-mono w-[80mm] bg-white">
                                <h1 className="text-center text-xl font-bold uppercase mb-2">سجـادتي - Segadty</h1>
                                <p className="text-center text-sm border-b pb-2 mb-2">المرسلات، الرياض، المملكة العربية السعودية</p>

                                <div className="text-sm space-y-1 mb-4">
                                    <div className="flex justify-between">
                                        <span>رقم السند:</span>
                                        <span>{operationResult.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>نوع العملية:</span>
                                        <span className="font-bold">{operationType === 'RETURN' ? "إرجاع" : "تبديل"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>الفاتورة الأصلية:</span>
                                        <span>{selectedInvoice?.order.invoice_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>التاريخ:</span>
                                        <span>{new Date().toLocaleString('ar-SA')}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1">
                                        <span>العميل:</span>
                                        <span>{selectedInvoice?.order.customer_name}</span>
                                    </div>
                                </div>

                                <div className="border-t border-b py-2 mb-4">
                                    <div className="grid grid-cols-4 font-bold text-xs mb-1">
                                        <span className="col-span-2">الصنف</span>
                                        <span className="text-center">الكمية</span>
                                        <span className="text-left">السعر</span>
                                    </div>
                                    {operationResult.items.map((item: any, i: number) => (
                                        <div key={i} className="grid grid-cols-4 text-xs mb-1">
                                            <span className="col-span-2">{item.sku}</span>
                                            <span className="text-center">{item.qty} {item.type === 'RETURNED' ? '(-)' : '(+)'}</span>
                                            <span className="text-left">{item.price_difference || '---'}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1 font-bold">
                                    <div className="flex justify-between">
                                        <span>ضريبة القيمة المضافة (15%):</span>
                                        <span>{operationResult.vat_adjustment.toLocaleString()} ر.س</span>
                                    </div>
                                    <div className="flex justify-between text-lg border-t pt-2 mt-2">
                                        <span>الإجمالي:</span>
                                        <span>{operationResult.total_amount.toLocaleString()} ر.س</span>
                                    </div>
                                </div>

                                <div className="text-center mt-8 pt-4 border-t border-dashed">
                                    <p className="text-xs">شكراً لتعاملكم معنا</p>
                                    <p className="text-xs">Segadty POS</p>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* Print Styling */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #thermal-receipt, #thermal-receipt * {
                        visibility: visible;
                    }
                    #thermal-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm;
                    }
                }
                
                .receipt-container {
                    direction: rtl;
                    color: black;
                }
            `}</style>
        </div>
    );
}

// Utility for conditional class joining
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
