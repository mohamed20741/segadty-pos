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
        // 1. Prepare the content
        const invoiceHTML = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>Invoice #${lastInvoiceNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
                    body {
                        font-family: 'Cairo', sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: white;
                        color: black;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                        border: 1px solid #eee;
                        padding: 40px;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .title {
                        font-size: 32px;
                        font-weight: 900;
                        margin: 0;
                        color: #000;
                    }
                    .subtitle {
                        font-size: 14px;
                        letter-spacing: 4px;
                        font-weight: bold;
                        margin: 5px 0 0;
                        color: #333;
                        display: block;
                    }
                    .meta-grid {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                    }
                    .meta-col {
                        flex: 1;
                    }
                    .meta-row {
                        margin-bottom: 8px;
                        font-size: 14px;
                    }
                    .label {
                        font-weight: bold;
                        color: #555;
                        width: 100px;
                        display: inline-block;
                    }
                    .value {
                        font-weight: bold;
                        font-family: monospace;
                        font-size: 16px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th {
                        background: #f9fafb;
                        padding: 12px;
                        text-align: inherit;
                        border-top: 2px solid #000;
                        border-bottom: 2px solid #000;
                        font-weight: 800;
                        font-size: 14px;
                    }
                    td {
                        padding: 12px;
                        border-bottom: 1px solid #eee;
                        font-size: 14px;
                    }
                    .summary {
                        display: flex;
                        justify-content: flex-end;
                    }
                    .summary-box {
                        width: 300px;
                        border-top: 2px solid #000;
                        padding-top: 10px;
                    }
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                        font-size: 14px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px dashed #ccc;
                        font-weight: 900;
                        font-size: 18px;
                    }
                    .footer {
                        margin-top: 50px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #eee;
                        padding-top: 20px;
                    }
                    @media print {
                        .no-print { display: none; }
                        body { background: white; }
                        @page { margin: 0; size: auto; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="header">
                        <h1 class="title">سجادة صلاتي</h1>
                        <span class="subtitle">SEGADTY POS</span>
                        <p style="margin-top: 10px; font-size: 12px; font-weight: bold;">
                            الفرع: ${user?.branch_id || 'الفرع الرئيسي'}
                        </p>
                    </div>

                    <div class="meta-grid">
                        <div class="meta-col">
                            <div class="meta-row"><span class="label">رقم الفاتورة:</span> <span class="value">${lastInvoiceNumber}</span></div>
                            <div class="meta-row"><span class="label">التاريخ:</span> <span>${new Date().toLocaleDateString('ar-SA')}</span></div>
                            <div class="meta-row"><span class="label">الوقت:</span> <span>${new Date().toLocaleTimeString('ar-SA')}</span></div>
                        </div>
                        <div class="meta-col" style="text-align: left;">
                            <div class="meta-row"><span class="value">${customer.name}</span> <span class="label" style="text-align: right;">:العميل</span> </div>
                            <div class="meta-row"><span>${paymentMethod === 'cash' ? 'نقداً (Cash)' : 'شبكة (Card)'}</span> <span class="label" style="text-align: right;">:الدفع</span></div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: right;">المنتج</th>
                                <th style="text-align: center;">الكمية</th>
                                <th style="text-align: center;">السعر</th>
                                <th style="text-align: left;">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cart.map(item => `
                                <tr>
                                    <td style="font-weight: bold;">${item.name}</td>
                                    <td style="text-align: center; font-family: monospace;">${item.cartQuantity}</td>
                                    <td style="text-align: center; font-family: monospace;">${item.selling_price.toLocaleString()}</td>
                                    <td style="text-align: left; font-family: monospace; font-weight: bold;">${(item.cartQuantity * item.selling_price).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="summary">
                        <div class="summary-box">
                            <div class="summary-row">
                                <span>المجموع الفرعي:</span>
                                <span style="font-family: monospace;">${subtotal.toLocaleString()}</span>
                            </div>
                            <div class="summary-row">
                                <span>الضريبة (15%):</span>
                                <span style="font-family: monospace;">${tax.toLocaleString()}</span>
                            </div>
                            <div class="total-row">
                                <span>الإجمالي النهائي:</span>
                                <div>
                                    <span style="font-family: monospace;">${total.toLocaleString()}</span>
                                    <span style="font-size: 12px;"> ريال</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>الكاشير: ${user?.name || user?.username || 'نظام آلي'}</p>
                        <p style="font-weight: bold; margin: 10px 0;">شكراً لزيارتكم! نأمل رؤيتكم قريباً</p>
                        <p>www.segadty.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // 2. Create invisible iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // 3. Write content
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(invoiceHTML);
            doc.close();
        }

        // 4. Print with delay to ensure styles load
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
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
            </div>
        </div>
    );
}
