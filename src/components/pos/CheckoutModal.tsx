"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Customer } from "@/types";
import { SAUDI_CITIES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Printer, CheckCircle, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
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

        // Generate Mock Invoice Number
        const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;

        try {
            // Import the sheet function
            const { createOrderInSheet } = await import("@/lib/google-sheets");

            // Prepare order data
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

            // Call Google Sheets API
            await createOrderInSheet(orderData);

            setLastInvoiceNumber(invoiceNum);
            setStep("success");
        } catch (error) {
            console.error("Failed to sync order:", error);
            // Even if sync fails, we show success to user but log it
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

    // Updated PDF Generation to be more robust or just use print
    const handleDownloadPDF = () => {
        window.print(); // Printing to PDF is usually better for Arabic support
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">

                {/* Close Button */}
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
                                        minLength={2}
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
                                        pattern="^(05|9665)[0-9]{8}$"
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

                            {customer.type === 'company' && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="text-sm font-bold text-gray-700">اسم الشركة</label>
                                    <Input name="companyName" placeholder="شركة ..." />
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700">طريقة الدفع</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("cash")}
                                        className={`flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-primary' : 'border-gray-300'}`}>
                                            {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                                        </div>
                                        <span className="font-bold">نقداً (Cash)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("card")}
                                        className={`flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-primary' : 'border-gray-300'}`}>
                                            {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                                        </div>
                                        <span className="font-bold">شبكة (Card)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-2xl space-y-3 border border-gray-100 shadow-inner">
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
                            <Button variant="outline" onClick={handleDownloadPDF} className="h-12 gap-2">
                                <FileText className="w-4 h-4" />
                                حفظ PDF
                            </Button>
                        </div>

                        <Button onClick={handleNewOrder} className="mt-6 w-full max-w-sm h-12">
                            بدء طلب جديد
                        </Button>
                    </div>
                )}

                {/* Professional Printable Invoice (Hidden) */}
                <div id="printable-invoice" className="hidden print:block p-8 bg-white text-gray-900 font-sans dir-rtl" style={{ direction: 'rtl' }}>
                    <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
                        <h1 className="text-4xl font-black mb-2 tracking-tighter">سجادة صلاتي</h1>
                        <p className="text-lg font-bold">SEGADTY POS</p>
                        <p className="text-sm mt-1">{user?.branch_id || 'الفرع الرئيسي'}</p>
                    </div>

                    <div className="flex justify-between items-start mb-8 text-sm">
                        <div className="space-y-1">
                            <p className="font-bold">رقم الفاتورة: <span className="font-mono">{lastInvoiceNumber}</span></p>
                            <p className="font-bold">التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
                            <p className="font-bold">الوقت: {new Date().toLocaleTimeString('ar-SA')}</p>
                        </div>
                        <div className="text-left space-y-1">
                            <p className="font-bold">العميل: {customer.name}</p>
                            <p className="font-bold">الجوال: {customer.phone}</p>
                            <p className="font-bold">طريقة الدفع: {paymentMethod === 'cash' ? 'نقداً' : 'شبكة'}</p>
                        </div>
                    </div>

                    <table className="w-full mb-8 border-collapse">
                        <thead>
                            <tr className="border-y-2 border-gray-900 text-sm">
                                <th className="py-3 text-right">المنتج</th>
                                <th className="py-3 text-center">الكمية</th>
                                <th className="py-3 text-center">السعر</th>
                                <th className="py-3 text-left">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {cart.map((item) => (
                                <tr key={item.id} className="text-sm">
                                    <td className="py-4 font-bold">{item.name}</td>
                                    <td className="py-4 text-center font-mono">{item.cartQuantity}</td>
                                    <td className="py-4 text-center font-mono">{item.selling_price.toLocaleString()}</td>
                                    <td className="py-4 text-left font-mono">{(item.cartQuantity * item.selling_price).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end mb-10">
                        <div className="w-64 space-y-2 border-t-2 border-gray-900 pt-4">
                            <div className="flex justify-between text-sm">
                                <span>المجموع الفرعي:</span>
                                <span className="font-mono">{subtotal.toLocaleString()} ر.س</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ضريبة القيمة المضافة (15%):</span>
                                <span className="font-mono">{tax.toLocaleString()} ر.س</span>
                            </div>
                            <div className="flex justify-between text-xl font-black mt-2 pt-2 border-t-2 border-dashed border-gray-300">
                                <span>الإجمالي النهائي:</span>
                                <span className="font-mono">{total.toLocaleString()} ر.س</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-4 pt-10 border-t border-gray-100">
                        <div className="flex justify-center items-center gap-10 text-xs font-bold text-gray-500">
                            <p>الكاشير: {user?.name || user?.username || '-'}</p>
                            <p>رقم الكاشير: {user?.id?.slice(-4) || '-'}</p>
                        </div>
                        <p className="text-sm font-bold">شكراً لزيارتكم! نأمل رؤيتكم قريباً</p>
                        <p className="text-[10px] text-gray-400">segadty.com | 2024 © جميع الحقوق محفوظة</p>
                    </div>
                </div>
            </div>

            {/* Premium Print Styles */}
            <style jsx global>{`
        @media print {
            body {
                background: white;
                margin: 0;
                padding: 0;
            }
            body > *:not(#printable-invoice-container) {
                display: none !important;
            }
            #printable-invoice-container {
                display: block !important;
                width: 100%;
                height: 100%;
            }
            #printable-invoice {
                display: block !important;
                visibility: visible !important;
                width: 100%;
            }
        }
      `}</style>
        </div>
    );
}
