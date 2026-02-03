"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Customer } from "@/types";
import { SAUDI_CITIES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Printer, CheckCircle, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
    const { cart, total, subtotal, tax, clearCart } = useCart();
    const [step, setStep] = useState<"form" | "success">("form");
    const [isProcessing, setIsProcessing] = useState(false);

    const [customer, setCustomer] = useState<Customer>({
        name: "",
        phone: "",
        city: "الرياض",
        type: "individual",
        address: ""
    });

    const { user } = useAuth();
    const [lastInvoiceNumber, setLastInvoiceNumber] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;

        try {
            const { createOrderInSheet } = await import("@/lib/google-sheets");
            const orderData = {
                customer: {
                    name: customer.name,
                    phone: customer.phone,
                    city: customer.city,
                    type: customer.type
                },
                items: cart.map(item => ({
                    id: item.id,
                    product_id: item.id,
                    name: item.name,
                    quantity: item.cartQuantity,
                    price: item.selling_price
                })),
                subtotal: subtotal,
                tax: tax,
                total: total,
                payment_method: paymentMethod,
                invoiceNumber: invoiceNum,
                branch_id: user?.branch_id || '',
                created_by: user?.username || ''
            };

            await createOrderInSheet(orderData);
            setLastInvoiceNumber(invoiceNum);
            setStep("success");
        } catch (error) {
            console.error("Failed to sync order:", error);
            setLastInvoiceNumber(invoiceNum);
            setStep("success");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleNewOrder = () => {
        clearCart();
        setStep("form");
        setCustomer({ name: "", phone: "", city: "الرياض", type: "individual", address: "" });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {step === "form" ? (
                    <div className="p-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800">بيانات العميل والفاتورة</h2>
                            <p className="text-gray-500">أكمل البيانات التالية لإصدار الفاتورة</p>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">اسم العميل <span className="text-red-500">*</span></label>
                                    <Input
                                        name="name"
                                        value={customer.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="الاسم ثلاثي"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">رقم الجوال <span className="text-red-500">*</span></label>
                                    <Input
                                        name="phone"
                                        value={customer.phone}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="05xxxxxxxx"
                                        type="tel"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">المدينة</label>
                                    <select
                                        name="city"
                                        value={customer.city}
                                        onChange={handleInputChange}
                                        className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    >
                                        {SAUDI_CITIES.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">نوع العميل</label>
                                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setCustomer(prev => ({ ...prev, type: "individual" }))}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${customer.type === 'individual' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            فرد
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCustomer(prev => ({ ...prev, type: "company" }))}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${customer.type === 'company' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            شركة
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700">طريقة الدفع</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("cash")}
                                        className={`flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <span className="font-bold">نقداً (Cash)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("card")}
                                        className={`flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <span className="font-bold">شبكة (Card)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-2xl space-y-3 border border-gray-100">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>المجموع الفرعي</span>
                                    <span>{subtotal.toLocaleString()} ر.س</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>ضريبة القيمة المضافة (15%)</span>
                                    <span>{tax.toLocaleString()} ر.س</span>
                                </div>
                                <div className="h-px bg-gray-200 my-2"></div>
                                <div className="flex justify-between font-bold text-gray-800 text-xl">
                                    <span>الإجمالي النهائي</span>
                                    <span className="text-primary">{total.toLocaleString()} ر.س</span>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full h-14 text-lg font-bold"
                            >
                                {isProcessing ? "جاري إصدار الفاتورة..." : "تأكيد وإصدار الفاتورة"}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[500px]">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in spin-in-12 duration-500">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>

                        <h2 className="text-3xl font-bold text-gray-800 mb-2">تم إصدار الفاتورة بنجاح!</h2>
                        <p className="text-gray-500 mb-8">رقم الفاتورة: <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">{lastInvoiceNumber}</span></p>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            <Button variant="outline" onClick={handlePrint} className="h-12 gap-2">
                                <Printer className="w-4 h-4" />
                                طباعة
                            </Button>
                            <Button variant="outline" onClick={handlePrint} className="h-12 gap-2">
                                <FileText className="w-4 h-4" />
                                حفظ PDF
                            </Button>
                        </div>

                        <Button onClick={handleNewOrder} className="mt-6 w-full max-w-sm h-12">
                            بدء طلب جديد
                        </Button>
                    </div>
                )}

                {/* Professional Printable Invoice (VIP Design) */}
                <div id="printable-invoice-wrapper" className="hidden print:block">
                    <div id="printable-invoice" className="p-8 bg-white text-black font-sans dir-rtl" style={{ direction: 'rtl', color: 'black' }}>
                        {/* Header */}
                        <div className="text-center border-b-2 border-black pb-6 mb-8">
                            <h1 className="text-4xl font-bold mb-1" style={{ color: 'black' }}>سجادة صلاتي</h1>
                            <p className="text-sm font-bold tracking-widest" style={{ color: 'black' }}>SEGADTY POS</p>
                            <p className="text-xs mt-2" style={{ color: 'black' }}>الفرع: {user?.branch_id || 'الفرع الرئيسي'}</p>
                        </div>

                        {/* Customer & Info */}
                        <div className="flex justify-between text-sm mb-8">
                            <div className="space-y-1">
                                <p className="font-bold">رقم الفاتورة: <span className="font-mono">{lastInvoiceNumber}</span></p>
                                <p>التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
                                <p>الوقت: {new Date().toLocaleTimeString('ar-SA')}</p>
                            </div>
                            <div className="text-left space-y-1">
                                <p className="font-bold">العميل: {customer.name}</p>
                                <p>طريقة الدفع: {paymentMethod === 'cash' ? 'نقداً' : 'شبكة'}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full mb-8 border-collapse">
                            <thead>
                                <tr className="border-y border-black text-xs font-bold">
                                    <th className="py-2 text-right">المنتج</th>
                                    <th className="py-2 text-center">الكمية</th>
                                    <th className="py-2 text-center">السعر</th>
                                    <th className="py-2 text-left">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item) => (
                                    <tr key={item.id} className="text-sm border-b border-gray-100">
                                        <td className="py-3 font-bold">{item.name}</td>
                                        <td className="py-3 text-center">{item.cartQuantity}</td>
                                        <td className="py-3 text-center">{item.selling_price.toLocaleString()}</td>
                                        <td className="py-3 text-left font-bold">{(item.cartQuantity * item.selling_price).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Summary */}
                        <div className="flex justify-end mb-8">
                            <div className="w-48 space-y-1 text-sm border-t border-black pt-2">
                                <div className="flex justify-between">
                                    <span>المجموع الفرعي:</span>
                                    <span>{subtotal.toLocaleString()} ر.س</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span>ضريبة (15%):</span>
                                    <span>{tax.toLocaleString()} ر.س</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-dashed border-gray-300">
                                    <span>الإجمالي:</span>
                                    <span>{total.toLocaleString()} ريال</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-8 border-t border-black">
                            <p className="text-xs mb-2">الكاشير: {user?.name || user?.username}</p>
                            <p className="text-sm font-bold">شكراً لزيارتكم!</p>
                            <div className="mt-4 border border-black inline-block px-4 py-1 text-[10px] font-bold">
                                ORIGINAL RECEIPT - فاتورة أصلية
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    /* Reset everything */
                    html, body {
                        background-color: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Hide all UI elements */
                    body > *:not(#printable-invoice-wrapper) {
                        display: none !important;
                    }

                    /* Important: ensure the wrapper is shown from the top */
                    #printable-invoice-wrapper {
                        display: block !important;
                        visibility: visible !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                    }

                    #printable-invoice {
                        display: block !important;
                        visibility: visible !important;
                        width: 100% !important;
                        max-width: 800px;
                        margin: 0 auto !important;
                    }

                    /* Ensure text is actually BLACK */
                    #printable-invoice * {
                        color: black !important;
                        border-color: black !important;
                    }

                    @page {
                        size: auto;
                        margin: 1cm;
                    }
                }
            `}</style>
        </div>
    );
}
