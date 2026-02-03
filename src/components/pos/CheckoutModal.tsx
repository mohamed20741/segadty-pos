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
        // إنشاء محتوى الفاتورة بناءً على التصميم المرفق في الصورة
        const invoiceHTML = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>فاتورة ضريبية مبسطة - ${lastInvoiceNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
                    
                    * { box-sizing: border-box; }
                    
                    body {
                        font-family: 'Cairo', sans-serif;
                        margin: 0;
                        padding: 0;
                        background: white;
                        color: black;
                        font-size: 12px;
                    }

                    .invoice-page {
                        max-width: 210mm; /* A4 Width */
                        margin: 0 auto;
                        padding: 20px;
                        border-top: 10px solid #8B0000; /* Dark Red Border matching image */
                    }

                    .header-section {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 30px;
                        padding-top: 20px;
                    }

                    .qr-placeholder {
                        width: 100px;
                        height: 100px;
                        border: 2px solid #000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #f0f0f0;
                        font-weight: bold;
                        font-size: 10px;
                    }

                    .company-info {
                        text-align: center;
                        flex: 1;
                    }

                    .company-name {
                        font-size: 18px;
                        font-weight: 800;
                        margin-bottom: 5px;
                    }

                    .barcode-section {
                        text-align: left;
                    }

                    .barcode-placeholder {
                        width: 150px;
                        height: 50px;
                        background: #000; /* Simulated Barcode */
                        margin-bottom: 5px;
                        border-radius: 2px;
                        background-image: linear-gradient(90deg, #000 50%, transparent 50%);
                        background-size: 4px 100%;
                    }

                    .invoice-details-grid {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                    }

                    .right-details, .left-details {
                        flex: 1;
                    }

                    .detail-row {
                        margin-bottom: 4px;
                        display: flex;
                        align-items: baseline;
                    }

                    .label {
                        font-weight: 700;
                        margin-left: 5px;
                        width: 100px;
                    }

                    .value {
                        font-weight: 600;
                    }

                    /* Table Design matching image */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 11px;
                    }

                    th {
                        color: #8B0000; /* Red headers */
                        font-weight: 800;
                        padding: 8px;
                        text-align: center;
                        border-bottom: 1px solid #ddd;
                        background-color: #fcfcfc;
                    }

                    td {
                        padding: 10px 8px;
                        text-align: center;
                        border-bottom: 1px solid #eee;
                        vertical-align: middle;
                    }

                    .product-name {
                        text-align: right;
                        font-weight: 700;
                        color: #000;
                    }

                    /* Totals Section */
                    .totals-section {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 20px;
                        border-top: 2px solid #eee;
                        padding-top: 20px;
                    }

                    .totals-box {
                        width: 350px;
                        margin-right: auto; /* Align to left */
                    }

                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        padding: 4px 0;
                    }

                    .total-row.final {
                        border-top: 2px solid #8B0000;
                        color: #8B0000;
                        font-weight: 900;
                        font-size: 16px;
                        padding-top: 10px;
                        margin-top: 10px;
                    }

                    .footer {
                        margin-top: 50px;
                        border-top: 1px solid #ddd;
                        padding-top: 10px;
                        display: flex;
                        justify-content: space-between;
                        font-size: 10px;
                        color: #555;
                    }

                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-page">
                    
                    <!-- Header with QR and Barcode layout -->
                    <div class="header-section">
                        <div class="qr-placeholder">
                            QR Code
                        </div>
                        
                        <div class="company-info">
                            <div class="company-name">سجادة صلاتي للتجارة</div>
                            <div>Segadty Trading Co.</div>
                            <div style="font-weight: bold; margin-top: 10px;">فاتورة ضريبية مبسطة</div>
                        </div>

                        <div class="barcode-section">
                            <div class="barcode-placeholder"></div>
                            <div style="text-align: center; font-family: monospace;">${lastInvoiceNumber}</div>
                        </div>
                    </div>

                    <!-- Details Grid -->
                    <div class="invoice-details-grid">
                        <div class="right-details">
                            <div class="detail-row"><span class="label">رقم الفاتورة:</span> <span class="value">${lastInvoiceNumber}</span></div>
                            <div class="detail-row"><span class="label">تاريخ الطلب:</span> <span class="value">${new Date().toLocaleDateString('en-GB')} | ${new Date().toLocaleTimeString('en-US')}</span></div>
                            <div class="detail-row"><span class="label">حالة الطلب:</span> <span class="value">مدفوع</span></div>
                            <br>
                            <div class="detail-row"><span class="label">اسم العميل:</span> <span class="value">${customer.name}</span></div>
                            <div class="detail-row"><span class="label">رقم الجوال:</span> <span class="value" dir="ltr">${customer.phone}</span></div>
                        </div>

                        <div class="left-details" style="text-align: left;">
                            <div class="detail-row" style="justify-content: flex-end;"><span class="value">${paymentMethod === 'cash' ? 'نقداً' : 'بطاقة مدى / ائتمان'}</span> <span class="label" style="text-align: right;">:طريقة الدفع</span></div>
                            <div class="detail-row" style="justify-content: flex-end;"><span class="value">${user?.branch_id || 'الفرع الرئيسي'}</span> <span class="label" style="text-align: right;">:الفرع</span></div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 5%">#</th>
                                <th style="width: 40%; text-align: right;">وصف المنتج / Product Name</th>
                                <th>الكمية<br>Qty</th>
                                <th>السعر<br>Price</th>
                                <th>الضريبة (15%)<br>VAT</th>
                                <th>المجموع<br>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cart.map((item, index) => {
            const priceBeforeTax = item.selling_price / 1.15;
            const itemTax = item.selling_price - priceBeforeTax;
            const itemTotal = item.cartQuantity * item.selling_price;

            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td class="product-name">
                                        <div>${item.name}</div>
                                        <div style="font-size: 9px; color: #666;">SKU: ${item.id.substring(0, 6)}</div>
                                    </td>
                                    <td>${item.cartQuantity}</td>
                                    <td>${priceBeforeTax.toFixed(2)}</td>
                                    <td>${itemTax.toFixed(2)}</td>
                                    <td style="font-weight: bold;">${itemTotal.toFixed(2)} SAR</td>
                                </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>

                    <!-- Totals Section -->
                    <div class="totals-section">
                        <div style="flex: 1;">
                            <!-- Empty Space or Notes -->
                        </div>
                        <div class="totals-box">
                             <div style="color: #8B0000; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">تفاصيل السعر</div>
                             
                             <div class="total-row">
                                 <span>المجموع غير شامل الضريبة</span>
                                 <span>${(total / 1.15).toFixed(2)} SAR</span>
                             </div>
                             <div class="total-row">
                                 <span>ضريبة القيمة المضافة (15%)</span>
                                 <span>${(total - (total / 1.15)).toFixed(2)} SAR</span>
                             </div>
                             <div class="total-row final">
                                 <span>المجموع الكلي</span>
                                 <span>${total.toFixed(2)} SAR</span>
                             </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="footer">
                        <div>عنوان التاجر: المملكة العربية السعودية</div>
                        <div>الرقم الضريبي: 300000000000003</div>
                        <div>تم إصدار الفاتورة من نظام Segadty POS</div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        // Optional: window.close() after print if desired, but blocking it is safer for user to see
                    }
                </script>
            </body>
            </html>
        `;

        // فتح نافذة جديدة للطباعة (الحل الأضمن)
        const printWindow = window.open('', '_blank', 'width=900,height=800');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(invoiceHTML);
            printWindow.document.close();
        } else {
            alert("يرجى السماح بالنوافذ المنبثقة (Popups) لطباعة الفاتورة");
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
