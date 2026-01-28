
import { Product } from "@/types";

const SHEET_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;

/**
 * جلب جميع المنتجات من الشيت
 */
export async function getProductsFromSheet(): Promise<Product[] | null> {
    if (!SHEET_URL) return null;

    try {
        const response = await fetch(`${SHEET_URL}?action=getProducts`);
        const json = await response.json();

        if (json.status === 'success' && json.data && Array.isArray(json.data)) {
            return json.data
                .filter((item: any) => item && item.id && item.name) // فلترة البيانات الفارغة
                .map((item: any) => ({
                    id: String(item.id),
                    name: item.name || 'منتج بدون اسم',
                    category: item.category || 'غير مصنف',
                    cost_price: Number(item.cost_price) || 0,
                    selling_price: Number(item.selling_price) || 0,
                    branch_id: "HAM",
                    quantity: Number(item.stock) || 0,
                    min_quantity: Number(item.min_quantity) || 5,
                    image: item.image || "/images/products/rug-1.jpg"
                }));
        }
    } catch (error) {
        console.error("Failed to fetch products:", error);
    }
    return null;
}

/**
 * إنشاء طلب جديد (يخصم المخزون تلقائياً في الشيت)
 */
export async function createOrderInSheet(orderData: any) {
    if (!SHEET_URL) return { status: 'error', message: 'No Sheet URL' };

    try {
        await fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'createOrder',
                payload: orderData
            })
        });

        // من وضع no-cors لا يمكن قراءة الاستجابة، لذا نفترض النجاح في الإرسال
        return { status: 'success', message: 'Order request sent' };
    } catch (error) {
        console.error("Failed to create order:", error);
        return { status: 'error', message: 'Network error' };
    }
}
