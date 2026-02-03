"use client";

import { cn } from "@/lib/utils";
import { Package, MapPin, Phone, Hash, Calendar, CreditCard, User } from "lucide-react";

interface PrintableInvoiceProps {
    invoiceNumber: string;
    date: string;
    customer: {
        name: string;
        phone: string;
        email?: string;
        city: string;
        address?: string;
    };
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        tax?: number;
        total: number;
    }>;
    totals: {
        subtotal: number;
        tax: number;
        delivery?: number;
        discount?: number;
        grandTotal: number;
    };
    paymentMethod: string;
    type?: "SALE" | "RETURN" | "EXCHANGE";
}

export function PrintableInvoice({
    invoiceNumber,
    date,
    customer,
    items,
    totals,
    paymentMethod,
    type = "SALE"
}: PrintableInvoiceProps) {
    return (
        <div id="printable-invoice" className="bg-white p-8 w-[210mm] min-h-[297mm] mx-auto text-right text-gray-800 font-sans border border-gray-100 shadow-sm print:shadow-none print:border-none print:m-0 print:p-8">
            {/* Header Area */}
            <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-primary/10">
                <div className="flex flex-col items-start text-left">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Tax Invoice</p>
                    <h2 className="text-2xl font-black text-primary">فاتورة ضريبية مبسطة</h2>
                    <div className="mt-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 mb-1">رقم الفاتورة / Invoice #</p>
                        <p className="text-lg font-black font-mono text-gray-800">{invoiceNumber}</p>
                    </div>
                </div>

                <div className="text-center">
                    <div className="mb-4">
                        <h1 className="text-2xl font-black text-gray-900 mb-1">شركة نخبة سجادتي التجارية</h1>
                        <p className="text-xs text-gray-500 font-medium">Segadty Trading Elite Co.</p>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                        <span className="text-[10px] text-gray-400 font-bold text-center px-2">مساحة شعار المتجر</span>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                {/* Order Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="font-bold text-gray-700">تفاصيل الطلب</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-gray-500">تاريخ الطلب:</span>
                        <span className="font-bold text-gray-800">{new Date(date).toLocaleString('ar-SA')}</span>

                        <span className="text-gray-500">طريقة الدفع:</span>
                        <span className="font-bold text-gray-800">{paymentMethod === 'card' ? 'بطاقة مدى / بنكية' : 'نقداً'}</span>

                        <span className="text-gray-500">حالة الطلب:</span>
                        <span className="font-bold text-green-600">{type === 'SALE' ? 'طلب جديد / مكتمل' : type === 'RETURN' ? 'مرتجع' : 'مستبدل'}</span>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                        <User className="w-5 h-5 text-primary" />
                        <span className="font-bold text-gray-700">بيانات العميل</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-gray-500">اسم العميل:</span>
                        <span className="font-bold text-gray-800">{customer.name}</span>

                        <span className="text-gray-500">رقم الجوال:</span>
                        <span className="font-bold font-mono text-gray-800">{customer.phone}</span>

                        <span className="text-gray-500">العنوان:</span>
                        <span className="font-bold text-gray-800">{customer.city} {customer.address ? `- ${customer.address}` : ''}</span>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="mb-10 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-primary/5 text-primary text-xs font-black uppercase">
                            <th className="py-4 px-4 border-l border-white/20">#</th>
                            <th className="py-4 px-4 border-l border-white/20">اسم المنتج / الرمز</th>
                            <th className="py-4 px-4 border-l border-white/20 text-center">الكمية</th>
                            <th className="py-4 px-4 border-l border-white/20 text-center">السعر (قبل الضريبة)</th>
                            <th className="py-4 px-4 border-l border-white/20 text-center">الضريبة (15%)</th>
                            <th className="py-4 px-4 text-center">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.map((item, i) => {
                            const beforeTax = item.price / 1.15;
                            const taxVal = item.price - beforeTax;
                            return (
                                <tr key={i} className="text-sm font-bold text-gray-700">
                                    <td className="py-4 px-4 text-gray-400">{i + 1}</td>
                                    <td className="py-4 px-4">
                                        <p className="mb-1">{item.name}</p>
                                        <p className="text-[10px] font-mono text-gray-400 tracking-tighter">SKU: {item.id}</p>
                                    </td>
                                    <td className="py-4 px-4 text-center font-sans">{item.quantity}</td>
                                    <td className="py-4 px-4 text-center font-sans tracking-tighter">{(beforeTax * item.quantity).toFixed(2)}</td>
                                    <td className="py-4 px-4 text-center font-sans tracking-tighter">{(taxVal * item.quantity).toFixed(2)}</td>
                                    <td className="py-4 px-4 text-center font-sans text-primary">{item.total.toLocaleString()} ر.س</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-10">
                <div className="w-full max-w-sm bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 space-y-3">
                    <div className="flex justify-between text-sm text-gray-500 font-bold">
                        <span>المجموع غير شامل الضريبة:</span>
                        <span className="font-sans">{(totals.subtotal / 1.15).toFixed(2)} ر.س</span>
                    </div>
                    {totals.discount && totals.discount > 0 && (
                        <div className="flex justify-between text-sm text-gray-500 font-bold">
                            <span>الخصومات:</span>
                            <span className="font-sans text-red-600">-{totals.discount.toLocaleString()} ر.س</span>
                        </div>
                    )}
                    {totals.delivery && totals.delivery > 0 && (
                        <div className="flex justify-between text-sm text-gray-500 font-bold">
                            <span>التوصيل:</span>
                            <span className="font-sans">+{totals.delivery.toLocaleString()} ر.س</span>
                        </div>
                    )}
                    <div className="h-px bg-gray-200 my-2"></div>
                    <div className="flex justify-between text-sm text-gray-800 font-black">
                        <span>ضريبة القيمة المضافة (15%):</span>
                        <span className="font-sans">{totals.tax.toLocaleString()} ر.س</span>
                    </div>
                    <div className="pt-4 border-t-2 border-primary/20 flex justify-between items-center bg-primary/5 -mx-6 -mb-6 px-6 py-4 rounded-b-[2.5rem]">
                        <span className="text-lg font-black text-gray-900">المجموع الكلي:</span>
                        <span className="text-2xl font-black text-primary font-sans">{totals.grandTotal.toLocaleString()} ر.س</span>
                    </div>
                </div>
            </div>

            {/* Footer Area */}
            <div className="mt-auto pt-10 border-t border-gray-100 text-[10px] font-bold text-gray-400">
                <div className="grid grid-cols-3 gap-8 mb-6">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>السعودية، الرياض، طريق الملك عبدالعزيز، طريق صلاح الدين الأيوبي</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center border-x border-gray-100">
                        <Hash className="w-3 h-3 text-primary" />
                        <span>الرقم الضريبي: 312762602300003</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <Phone className="w-3 h-3 text-primary" />
                        <span>0500000000 | 920000000</span>
                    </div>
                </div>
                <div className="flex justify-between items-center opacity-50 italic">
                    <p>تم إصدار الفاتورة من نظام سجادتي السحابي (طرف ثالث)</p>
                    <p>شكراً لزيارتكم، نتطلع لخدمتكم مرة أخرى</p>
                </div>
            </div>

            {/* Print Only Styles */}
            <style jsx>{`
                @media print {
                    #printable-invoice {
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
