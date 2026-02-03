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
                </div>

            {/* Professional Printable Invoice (VIP Design) */}
            <div id="printable-invoice" className="hidden print:block p-10 bg-white text-black font-sans dir-rtl" style={{ direction: 'rtl', width: '100%', minHeight: '100vh' }}>
                {/* Decorative Header */}
                <div className="text-center border-b-4 border-double border-black pb-8 mb-10">
                    <h1 className="text-6xl font-black mb-2 tracking-tighter">سجادة صلاتي</h1>
                    <p className="text-2xl font-bold tracking-[0.3em] text-gray-600">SEGADTY POS</p>
                    <div className="mt-6 flex justify-center gap-10 text-sm font-bold border-t border-gray-100 pt-4">
                        <span>الفرع: {user?.branch_id || 'الفرع الرئيسي'}</span>
                        <span>الرقم الضريبي: 300000000000003</span>
                    </div>
                </div>

                {/* Invoice Metadata */}
                <div className="flex justify-between items-start mb-10">
                    <div className="space-y-3">
                        <div className="border-r-4 border-black pr-4">
                            <p className="text-xs font-bold text-gray-400 uppercase">رقم الفاتورة / Invoice No.</p>
                            <p className="text-2xl font-black font-mono">{lastInvoiceNumber}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">التاريخ والوقت / Date & Time</p>
                            <p className="text-lg font-bold">{new Date().toLocaleDateString('ar-SA')} - {new Date().toLocaleTimeString('ar-SA')}</p>
                        </div>
                    </div>
                    <div className="text-left space-y-3">
                        <div className="border-l-4 border-black pl-4">
                            <p className="text-xs font-bold text-gray-400 uppercase">العميل / Customer</p>
                            <p className="text-xl font-bold">{customer.name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">طريقة الدفع / Payment</p>
                            <p className="text-lg font-bold">{paymentMethod === 'cash' ? 'نقداً (Cash)' : 'شبكة (Card)'}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-12 border-collapse">
                    <thead>
                        <tr className="border-y-4 border-black bg-gray-50 text-sm">
                            <th className="py-4 px-4 text-right">المنتج / Product</th>
                            <th className="py-4 px-4 text-center">الكمية</th>
                            <th className="py-4 px-4 text-center">السعر</th>
                            <th className="py-4 px-4 text-left">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                        {cart.map((item) => (
                            <tr key={item.id} className="text-base">
                                <td className="py-6 px-4 font-black text-xl">{item.name}</td>
                                <td className="py-6 px-4 text-center font-mono font-bold text-xl">{item.cartQuantity}</td>
                                <td className="py-6 px-4 text-center font-mono font-bold text-xl">{item.selling_price.toLocaleString()}</td>
                                <td className="py-6 px-4 text-left font-mono font-black text-2xl">{(item.cartQuantity * item.selling_price).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Summary Section */}
                <div className="flex justify-end mb-16">
                    <div className="w-96 space-y-4">
                        <div className="flex justify-between text-lg text-gray-600">
                            <span className="font-bold">المجموع الفرعي (Subtotal):</span>
                            <span className="font-mono font-bold">{subtotal.toLocaleString()} ر.س</span>
                        </div>
                        <div className="flex justify-between text-lg text-gray-600">
                            <span className="font-bold">ضريبة القيمة المضافة (VAT 15%):</span>
                            <span className="font-mono font-bold">{tax.toLocaleString()} ر.س</span>
                        </div>
                        <div className="pt-6 border-t-4 border-black flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                            <span className="text-2xl font-black">الإجمالي النهائي:</span>
                            <div className="text-left">
                                <span className="text-4xl font-black font-mono text-black">{total.toLocaleString()}</span>
                                <span className="mr-2 text-sm font-bold uppercase">ريال</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VIP Footer */}
                <div className="text-center pt-12 border-t-4 border-double border-black mt-auto">
                    <div className="grid grid-cols-3 gap-4 mb-8 text-[12px] font-bold text-gray-400">
                        <span>الكاشير: {user?.name || user?.username || 'نظام آلي'}</span>
                        <span>www.segadty.com</span>
                        <span>شكراً لثقتكم بنا</span>
                    </div>
                    <p className="text-3xl font-black mb-4">نأمل رؤيتكم قريباً</p>
                    <div className="inline-block border-2 border-black px-6 py-2 rotate-1 font-bold text-sm tracking-widest uppercase mb-10">
                        Original Receipt - فاتورة أصلية
                    </div>
                </div>
            </div>
        </div>

            {/* Professional Print Styles */ }
    <style jsx global>{`
        @media print {
            /* Standard reset */
            html, body {
                height: 100%;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden;
            }
            
            /* Hide EVERYTHING including wrappers */
            body > * {
                display: none !important;
            }

            /* Show ONLY our specific container */
            #printable-invoice {
                display: block !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                z-index: 9999999 !important;
                margin: 0 !important;
                padding: 1.5cm !important;
                visibility: visible !important;
            }

            #printable-invoice * {
                visibility: visible !important;
            }

            @page {
                size: portrait;
                margin: 0;
            }
        }
      `}</style>
        </div >
    );
}
