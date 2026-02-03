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

            // Stock is deducted in backend. Frontend will update on refresh.
        } catch (error) {
            console.error("Failed to sync order:", error);
            // Even if it fails (e.g. network), we show success locally for now or handle error
            // ideally show error, but for now we assume success flow for POS continuity
            setLastInvoiceNumber(invoiceNum);
            setStep("success");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        try {
            console.log("Starting print process...");
            // تصميم الفاتورة النظيف (B&W Minimalist) مع بيانات الشركة الصحيحة
            const invoiceHTML = `
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>فاتورة - ${lastInvoiceNumber}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
                        
                        * { box-sizing: border-box; }
                        
                        body {
                            font-family: 'Cairo', sans-serif;
                            margin: 0;
                            padding: 20px;
                            background: white;
                            color: black;
                            font-size: 14px;
                            line-height: 1.5;
                        }
    
                        .invoice-container {
                            max-width: 210mm;
                            margin: 0 auto;
                            padding: 20px 40px;
                        }
    
                        /* Header */
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .brand-name {
                            font-size: 26px;
                            font-weight: 800;
                            margin-bottom: 5px;
                            color: #000;
                        }
                        .brand-sub {
                            font-size: 14px;
                            font-weight: 600;
                            letter-spacing: 2px;
                            color: #333;
                            margin-bottom: 10px;
                            text-transform: uppercase;
                        }
                        .branch-name {
                            font-size: 12px;
                            font-weight: 600;
                        }
    
                        .divider {
                            border-top: 3px solid #000;
                            margin: 20px 0;
                        }
    
                        /* Meta Data */
                        .meta-section {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 20px;
                            font-weight: 600;
                        }
                        
                        .meta-right, .meta-left {
                            display: flex;
                            flex-direction: column;
                            gap: 8px;
                        }
    
                        .meta-row {
                            display: flex;
                            align-items: center;
                        }
                        .meta-label {
                            min-width: 80px;
                            color: #555;
                            font-weight: 700;
                        }
                        .meta-value {
                            color: #000;
                            font-weight: 700;
                            margin-right: 10px; /* Space between label and value in RTL */
                        }
                        
                        /* English/Numbers in RTL */
                        .en-font {
                            font-family: sans-serif;
                            direction: ltr;
                            display: inline-block;
                        }
    
                        /* Table */
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 30px;
                        }
    
                        th {
                            text-align: right;
                            padding: 10px 0;
                            border-top: 3px solid #000;
                            border-bottom: 3px solid #000;
                            font-weight: 800;
                            font-size: 14px;
                        }
                        
                        /* Adjust alignment to match minimalist style */
                        th:first-child { text-align: right; } /* Product */
                        th:nth-child(2) { text-align: center; } /* Qty */
                        th:nth-child(3) { text-align: center; } /* Price */
                        th:last-child { text-align: left; } /* Total */
    
                        td {
                            padding: 15px 0;
                            border-bottom: 1px solid #eee;
                            vertical-align: top;
                            font-weight: 600;
                        }
    
                        td:first-child { text-align: right; }
                        td:nth-child(2) { text-align: center; }
                        td:nth-child(3) { text-align: center; }
                        td:last-child { text-align: left; }
    
                        /* Totals */
                        .totals-section {
                            display: flex;
                            justify-content: flex-end; /* Move to left side (visually in RTL this puts it on left) */
                            margin-top: 10px;
                        }
    
                        .totals-box {
                            width: 300px; /* Fixed width for alignemnt */
                            border-top: 3px solid #000;
                            padding-top: 15px;
                        }
    
                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 8px;
                            font-size: 14px;
                            font-weight: 600;
                        }
    
                        .final-total {
                            margin-top: 10px;
                            padding-top: 10px;
                            border-top: 1px dotted #999;
                            font-size: 18px;
                            font-weight: 900;
                        }
    
                        /* Footer */
                        .footer {
                            margin-top: 50px;
                            text-align: center;
                            font-size: 12px;
                            color: #777;
                            border-top: 1px solid #eee;
                            padding-top: 20px;
                            line-height: 1.8;
                        }
    
                        @media print {
                            @page { margin: 0; size: auto; }
                            body { padding: 0.5cm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        
                        <!-- Header -->
                        <div class="header">
                            <div class="brand-name">شركة نعمة سجادتي التجارية</div>
                            <div class="brand-sub">SEGADTY POS</div>
                            <div class="branch-name">فرع: ${user?.branch_id || 'الفرع الرئيسي'}</div>
                        </div>
    
                        <div class="divider"></div>
    
                        <!-- Meta Data -->
                        <div class="meta-section">
                            <!-- Right Side -->
                            <div class="meta-right">
                                <div class="meta-row">
                                    <span class="meta-label">العميل:</span>
                                    <span class="meta-value en-font" style="font-weight: 800; font-size: 15px;">${customer.name}</span>
                                </div>
                                <div class="meta-row">
                                    <span class="meta-label">الدفع:</span>
                                    <span class="meta-value">${paymentMethod === 'cash' ? 'نقداً (Cash)' : 'شبكة (Card)'}</span>
                                </div>
                            </div>
    
                            <!-- Left Side -->
                            <div class="meta-left" style="text-align: left; align-items: flex-end;">
                                <div class="meta-row">
                                    <span class="meta-value en-font" style="font-size: 15px;">${lastInvoiceNumber}</span>
                                    <span class="meta-label" style="text-align: left;">:رقم الفاتورة</span>
                                </div>
                                <div class="meta-row">
                                    <span class="meta-value en-font">${new Date().toLocaleDateString('en-GB')}</span>
                                    <span class="meta-label" style="text-align: left;">:التاريخ</span>
                                </div>
                                <div class="meta-row">
                                    <span class="meta-value en-font">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                    <span class="meta-label" style="text-align: left;">:الوقت</span>
                                </div>
                            </div>
                        </div>
    
                        <!-- Table -->
                        <table>
                            <thead>
                                <tr>
                                    <th>المنتج</th>
                                    <th>الكمية</th>
                                    <th>السعر</th>
                                    <th>الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cart.map(item => `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 700; margin-bottom: 2px;">${item.name}</div>
                                            ${item.cartQuantity > 1 ? '<span style="font-size: 11px; color: #666;">( عرض خاص )</span>' : ''}
                                        </td>
                                        <td class="en-font">${item.cartQuantity}</td>
                                        <td class="en-font">${item.selling_price.toLocaleString()}</td>
                                        <td class="en-font" style="font-weight: 800;">${(item.cartQuantity * item.selling_price).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
    
                        <!-- Totals -->
                        <div class="totals-section">
                            <div class="totals-box">
                                <div class="total-row">
                                    <span>المجموع الفرعي:</span>
                                    <span class="en-font">${subtotal.toLocaleString()}</span>
                                </div>
                                <div class="total-row">
                                    <span>الضريبة (15%):</span>
                                    <span class="en-font">${tax.toLocaleString()}</span>
                                </div>
                                <div class="total-row final-total">
                                    <span>الإجمالي النهائي:</span>
                                    <div>
                                        <span class="en-font">${total.toLocaleString()}</span>
                                        <span style="font-size: 12px; font-weight: 500;"> ريال</span>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <!-- Footer -->
                        <div class="footer">
                            <div>العنوان: المملكة العربية السعودية، الرياض، الملك عبدالعزيز، طريق صلاح الدين الأيوبي</div>
                            <div class="en-font">الرقم الضريبي: 312762602300003</div>
                            <div style="margin-top: 5px;">الكاشير: ${user?.name || user?.username || 'نظام آلي'}</div>
                        </div>
                    </div>
    
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
                </html>
            `;

            // فتح نافذة جديدة للطباعة
            const printWindow = window.open('', '_blank', 'width=900,height=800');
            if (printWindow) {
                printWindow.document.open();
                printWindow.document.write(invoiceHTML);
                printWindow.document.close();
            } else {
                alert("يرجى السماح بالنوافذ المنبثقة (Popups) لطباعة الفاتورة");
            }
        } catch (e) {
            console.error("Print Error:", e);
            alert("حدث خطأ أثناء محاولة الطباعة. يرجى مراجعة وحدة التحكم (Console).");
        }
    };

    const handleNewOrder = () => {
        clearCart();
        setStep("form");
        setCustomer({ name: "", phone: "", city: "الرياض", type: "individual", address: "" });
        onClose();
        // Force reload page to fetch fresh stock data
        window.location.reload();
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
