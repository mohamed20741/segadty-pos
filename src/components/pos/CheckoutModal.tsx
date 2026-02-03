"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { Customer, Branch } from "@/types";
import { SAUDI_CITIES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Printer, CheckCircle, FileText, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getBranchesFromSheet } from "@/lib/google-sheets";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
    const { cart, total, subtotalRaw, tax, clearCart, discount } = useCart();
    const [step, setStep] = useState<"form" | "success">("form");
    const [isProcessing, setIsProcessing] = useState(false);
    const [branchName, setBranchName] = useState("");
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);

    const [customer, setCustomer] = useState<Customer>({
        name: "",
        phone: "",
        city: "الرياض",
        type: "individual",
        address: ""
    });

    const { user } = useAuth();
    const [lastInvoiceNumber, setLastInvoiceNumber] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("نقداً (Cash)");

    useEffect(() => {
        async function fetchBranchName() {
            if (user?.branch_id) {
                const branches = await getBranchesFromSheet();
                if (branches) {
                    const branch = branches.find((b: Branch) => b.id === user.branch_id);
                    if (branch) setBranchName(branch.name);
                }
            }
        }

        // Load payment methods
        const savedMethods = localStorage.getItem('segadty_payment_methods');
        if (savedMethods) {
            const methods = JSON.parse(savedMethods);
            setAvailablePaymentMethods(methods);
            // Set default
            const defaultMethod = methods.find((m: any) => m.isDefault);
            if (defaultMethod) setPaymentMethod(defaultMethod.name);
        } else {
            // Fallback defaults
            setAvailablePaymentMethods([
                { id: 'cash', name: 'نقداً (Cash)' },
                { id: 'card', name: 'شبكة (Card)' }
            ]);
            setPaymentMethod('نقداً (Cash)');
        }

        if (isOpen) fetchBranchName();
    }, [isOpen, user?.branch_id]);

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
                subtotal: subtotalRaw, // Send gross subtotal
                discount: discount.value > 0 ? discount : null,
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
        try {
            // Calculate discount amount for display
            let discountAmount = 0;
            if (discount.type === 'amount') {
                discountAmount = discount.value;
            } else {
                discountAmount = subtotalRaw * (discount.value / 100);
            }
            if (discountAmount > subtotalRaw) discountAmount = subtotalRaw;


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
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }
    
                        .company-info {
                            text-align: center;
                        }
    
                        .company-name {
                            color: #000;
                            font-size: 24px;
                            font-weight: 800;
                            margin-bottom: 5px;
                        }
                        
                        .company-sub {
                             font-size: 14px;
                             font-weight: 600;
                             margin-bottom: 10px;
                        }
                        
                        .invoice-title {
                             font-weight: 700;
                             font-size: 16px;
                             margin-top: 10px;
                        }
    
                        /* Details Grid */
                        .details-grid {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 25px;
                            align-items: flex-start;
                            margin-top: 20px;
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
                            margin-bottom: 6px;
                            display: flex;
                            align-items: center;
                        }
                        .info-label {
                            font-weight: 800;
                            color: #000;
                            min-width: 90px;
                        }
                        .info-value {
                            font-weight: 600;
                            margin-right: 5px;
                            font-size: 14px;
                        }
                        
                        /* Left side Alignment */
                        .details-left .info-row {
                            justify-content: flex-end;
                        }
                        .details-left .info-label {
                            text-align: right;
                            margin-right: 0;
                            margin-left: 10px;
                        }
                        .details-left .info-value {
                            margin-right: 0;
                        }
    
                        /* Table */
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 25px;
                            margin-top: 20px;
                        }
    
                        th {
                            color: #8B0000;
                            font-weight: 800;
                            padding: 10px 5px;
                            border-bottom: 1px solid #ddd;
                            text-align: center;
                            background-color: #fafafa;
                            font-size: 12px;
                        }
                        th:first-child { text-align: right; }
                        th:nth-child(2) { text-align: right; width: 40%; }
    
                        td {
                            padding: 12px 5px;
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
                            margin-top: 20px;
                        }
                        
                        .totals-box {
                            width: 350px;
                        }
                        
                        .totals-header {
                            color: #8B0000; 
                            font-weight: 800; 
                            margin-bottom: 15px; 
                            text-align: right;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 5px;
                        }
    
                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 8px;
                            padding: 5px 0;
                            font-size: 14px;
                        }
    
                        .total-row.final {
                            border-top: 3px solid #8B0000;
                            color: #8B0000;
                            font-weight: 800;
                            font-size: 18px;
                            margin-top: 10px;
                            padding-top: 10px;
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
                            <div class="company-info">
                                <div class="company-name">شركة نخبة سجادتي التجارية</div>
                                <div class="invoice-title">فاتورة ضريبية مبسطة</div>
                            </div>
                        </div>
    
                        <div class="details-grid">
                            <div class="details-right">
                                <div class="info-row">
                                    <span class="info-label">طريقة الدفع:</span>
                                    <span class="info-value">${paymentMethod}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">الفرع:</span>
                                    <span class="info-value">${branchName || user?.branch_id || 'الفرع الرئيسي'}</span>
                                </div>
                            </div>
    
                            <div class="details-left">
                                <div class="info-row">
                                    <span class="info-value" style="font-family: monospace;">${lastInvoiceNumber}</span> <span class="info-label">:رقم الفاتورة</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-value" dir="ltr">${new Date().toLocaleDateString('en-GB')} | ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span> <span class="info-label">:تاريخ الطلب</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-value">مدفوع</span> <span class="info-label">:حالة الطلب</span>
                                </div>
                                <br>
                                <div class="info-row">
                                    <span class="info-value">${customer.name}</span> <span class="info-label">:اسم العميل</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-value" dir="ltr">${customer.phone}</span> <span class="info-label">:رقم الجوال</span>
                                </div>
                            </div>
                        </div>
    
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 5%">#</th>
                                    <th>وصف المنتج / Product Name</th>
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
                                        <td>
                                            <div>${item.name}</div>
                                            <div style="font-size: 10px; color: #666; margin-top: 2px;">SKU: R-${item.id.substring(0, 4)}</div>
                                        </td>
                                        <td>${item.cartQuantity}</td>
                                        <td>${priceBeforeTax.toFixed(2)}</td>
                                        <td>${itemTax.toFixed(2)}</td>
                                        <td style="font-weight: 700;">SAR ${itemTotal.toFixed(2)}</td>
                                    </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>
    
                        <div class="totals-wrapper">
                            <div class="totals-box">
                                 <div class="totals-header">تفاصيل السعر</div>
                                 
                                 <div class="total-row">
                                     <span>المجموع (شامل الضريبة)</span>
                                     <span>SAR ${subtotalRaw.toFixed(2)}</span>
                                 </div>
                                 ${discountAmount > 0 ? `
                                 <div class="total-row" style="color: red;">
                                     <span>الخصم</span>
                                     <span>- SAR ${discountAmount.toFixed(2)}</span>
                                 </div>
                                 ` : ''}
                                 
                                 <div class="total-row">
                                     <span>الضريبة (15%)</span>
                                     <span>SAR ${tax.toFixed(2)}</span>
                                 </div>
                                 <div class="total-row final">
                                     <span>المجموع النهائي</span>
                                     <span>SAR ${total.toFixed(2)}</span>
                                 </div>
                            </div>
                        </div>
    
                        <div class="footer">
                            <div class="footer-right">
                                <div>عنوان التاجر: المملكة العربية السعودية، الرياض، الملك عبدالعزيز، طريق صلاح الدين الأيوبي</div>
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
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء الطباعة");
        }
    };

    const handleNewOrder = () => {
        clearCart();
        setStep("form");
        setCustomer({ name: "", phone: "", city: "الرياض", type: "individual", address: "" });
        onClose();
        // Force refresh strictly
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
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3"> {/* Responsive grid */}
                                    {availablePaymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(method.name)}
                                            className={`flex flex-col items-center justify-center gap-2 p-3 h-20 rounded-2xl border-2 transition-all ${paymentMethod === method.name ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <CreditCard className={`w-5 h-5 ${paymentMethod === method.name ? 'text-primary' : 'text-gray-300'}`} />
                                            <span className="font-bold text-xs text-center line-clamp-2">{method.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-2xl space-y-3 border border-gray-100">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>المجموع (شامل الضريبة)</span>
                                    <span>{subtotalRaw.toLocaleString()} ر.س</span>
                                </div>
                                {discount.value > 0 && (
                                    <div className="flex justify-between text-sm text-red-500 font-bold">
                                        <span>الخصم</span>
                                        <span>- {(subtotalRaw - total).toLocaleString()} ر.س</span>
                                    </div>
                                )}
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
