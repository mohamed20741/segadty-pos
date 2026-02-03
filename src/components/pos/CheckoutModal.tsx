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
                        padding: 0;
                        background: white;
                        color: black;
                        font-size: 13px;
                    }

                    .invoice-page {
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 20px;
                        border-top: 12px solid #8B0000; /* شريط أحمر علوي */
                    }

                    /* Header */
                    .header-section {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-top: 20px;
                        position: relative;
                    }

                    .company-name {
                        color: #000;
                        font-size: 22px;
                        font-weight: 800;
                        margin-bottom: 5px;
                    }

                    .invoice-type {
                        font-size: 14px;
                        font-weight: 700;
                        margin-bottom: 15px;
                    }

                    /* Simulated Barcode on Right */
                    .barcode {
                        position: absolute;
                        top: 0;
                        right: 0;
                        text-align: center;
                    }
                    .barcode-bars {
                        height: 40px;
                        width: 140px;
                        background: repeating-linear-gradient(
                            90deg,
                            #000 0px,
                            #000 2px,
                            transparent 2px,
                            transparent 4px
                        );
                    }
                    .barcode-text {
                        font-family: monospace;
                        font-size: 12px;
                        letter-spacing: 2px;
                    }

                    /* Customer & Invoice Details */
                    .details-grid {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 25px;
                        align-items: flex-start;
                    }

                    .details-right {
                        text-align: right;
                        flex: 1;
                    }

                    .details-left {
                        text-align: left;
                        flex: 1;
                    }

                    .info-row {
                        margin-bottom: 5px;
                    }
                    .info-label {
                        font-weight: 700;
                        color: #333;
                    }
                    .info-value {
                        font-weight: 600;
                        margin-right: 5px;
                    }

                    /* Table */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 25px;
                    }

                    th {
                        color: #8B0000;
                        font-weight: 800;
                        padding: 8px 5px;
                        border-bottom: 1px solid #ddd;
                        text-align: center;
                    }
                    th:first-child { text-align: right; } /* ID */
                    th:nth-child(2) { text-align: right; width: 40%; } /* Name */

                    td {
                        padding: 10px 5px;
                        border-bottom: 1px solid #eee;
                        text-align: center;
                        vertical-align: middle;
                        font-weight: 600;
                    }
                    td:first-child { text-align: right; }
                    td:nth-child(2) { text-align: right; }

                    /* Totals */
                    .totals-wrapper {
                        display: flex;
                        justify-content: flex-end;
                    }
                    
                    .totals-box {
                        width: 300px;
                    }

                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                        padding: 5px 0;
                    }

                    .total-row.final {
                        border-top: 2px solid #8B0000;
                        color: #8B0000;
                        font-weight: 800;
                        font-size: 16px;
                    }

                    /* Footer */
                    .footer {
                        margin-top: 40px;
                        padding-top: 15px;
                        border-top: 1px solid #ddd;
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #555;
                        font-weight: 600;
                    }
                    
                    .footer-right div { margin-bottom: 4px; }
                    .footer-left { text-align: left; }

                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        @page { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-page">
                    <div class="header-section">
                        <!-- Barcode (Top Right visually in RTL) -->
                        <div class="barcode">
                            <div class="barcode-text" style="text-align: center; margin-bottom: 2px;">فاتورة ضريبية مبسطة</div>
                            <div class="barcode-bars"></div>
                            <div class="barcode-text">${lastInvoiceNumber}</div>
                        </div>

                        <div style="margin-top: 20px;">
                            <div class="company-name">شركة نعمة سجادتي التجارية</div>
                            <!-- <div style="font-size: 12px; font-weight: 600;">Segadty Trading Co.</div> -->
                        </div>
                    </div>

                    <div class="details-grid">
                        <div class="details-right">
                            <div class="info-row">
                                <span class="info-label">رقم الفاتورة:</span>
                                <span class="info-value" style="font-family: monospace;">#${lastInvoiceNumber}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">تاريخ الطلب:</span>
                                <span class="info-value" dir="ltr">${new Date().toLocaleDateString('en-GB')} | ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">حالة الطلب:</span>
                                <span class="info-value">جديد</span>
                            </div>
                            <br>
                            <div class="info-row">
                                <span class="info-label">اسم العميل:</span>
                                <span class="info-value">${customer.name}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">رقم الجوال:</span>
                                <span class="info-value" dir="ltr">${customer.phone}</span>
                            </div>
                        </div>

                        <div class="details-left">
                            <div class="info-row">
                                <span class="info-value">استلام من الفرع</span> <span class="info-label">:طريقة الشحن</span>
                            </div>
                             <div class="info-row">
                                <span class="info-value">${user?.branch_id || 'الفرع الرئيسي'}</span> <span class="info-label">:عنوان الفرع</span>
                            </div>
                            <br>
                            <div class="info-row">
                                <span class="info-value">${paymentMethod === 'cash' ? 'نقداً' : 'بطاقة مدى / ائتمان'}</span> <span class="info-label">:طريقة الدفع</span>
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 5%">#</th>
                                <th>اسم المنتج / رمز المنتج</th>
                                <th>الكمية</th>
                                <th>السعر<br><span style="font-size:10px">(شامل الضريبة)</span></th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cart.map((item, index) => {
            const itemTotal = item.cartQuantity * item.selling_price;
            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>
                                        <div>${item.name}</div>
                                        <div style="font-size: 10px; color: #666; margin-top: 2px;">R-${item.id.substring(0, 6).toUpperCase()}</div>
                                    </td>
                                    <td>${item.cartQuantity}</td>
                                    <td>SAR ${item.selling_price.toFixed(2)}</td>
                                    <td>SAR ${itemTotal.toFixed(2)}</td>
                                </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>

                    <div class="totals-wrapper">
                        <div class="totals-box">
                             <div style="color: #00008B; font-weight: bold; margin-bottom: 10px; text-align: right;">تفاصيل الأسعار</div>
                             
                             <div class="total-row">
                                 <span>المجموع غير شامل الضريبة</span>
                                 <span>SAR ${(total / 1.15).toFixed(2)}</span>
                             </div>
                             <div class="total-row">
                                 <span>ضريبة القيمة المضافة (15%)</span>
                                 <span>SAR ${(total - (total / 1.15)).toFixed(2)}</span>
                             </div>
                             <div class="total-row final">
                                 <span>المجموع الكلي</span>
                                 <span>SAR ${total.toFixed(2)}</span>
                             </div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="footer-right">
                            <div>عنوان التاجر: السعودية، الرياض، الملك عبدالعزيز، طريق صلاح الدين الأيوبي</div>
                            <div>تم اصدار الفاتورة من نظام Segadty POS</div>
                        </div>
                        <div class="footer-left">
                           <div>الرقم الضريبي: 312762602300003</div>
                        </div>
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

        const printWindow = window.open('', '_blank', 'width=900,height=800');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(invoiceHTML);
            printWindow.document.close();
        } else {
            alert("يرجى السماح بالنوافذ المنبثقة للطباعة");
        }
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
