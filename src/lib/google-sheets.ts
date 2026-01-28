
import { Product, User, Branch } from "@/types";

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

/**
 * جلب جميع المستخدمين
 */
export async function getUsersFromSheet(): Promise<User[] | null> {
    if (!SHEET_URL) return null;
    try {
        const response = await fetch(`${SHEET_URL}?action=getUsers`);
        const json = await response.json();
        if (json.status === 'success' && json.data && Array.isArray(json.data)) {
            return json.data
                .filter((item: any) => item && item.id)
                .map((item: any) => ({
                    id: String(item.id),
                    username: item.username || '',
                    name: item.name || 'مستخدم بدون اسم',
                    role: item.role || 'cashier',
                    branch_id: item.branch_id || '',
                    status: item.status || 'active',
                    created_at: item.created_at
                }));
        }
    } catch (error) {
        console.error("Failed to fetch users:", error);
    }
    return null;
}

/**
 * جلب جميع الفروع
 */
export async function getBranchesFromSheet(): Promise<Branch[] | null> {
    if (!SHEET_URL) return null;
    try {
        const response = await fetch(`${SHEET_URL}?action=getBranches`);
        const json = await response.json();
        if (json.status === 'success' && json.data && Array.isArray(json.data)) {
            return json.data
                .filter((item: any) => item && item.id)
                .map((item: any) => ({
                    id: String(item.id),
                    name: item.name || 'فرع بدون اسم',
                    location: item.location || 'غير محدد',
                    phone: item.phone || '',
                    is_active: item.is_active === true || item.is_active === 'TRUE' || item.is_active === 'true',
                    created_at: item.created_at
                }));
        }
    } catch (error) {
        console.error("Failed to fetch branches:", error);
    }
    return null;
}

/**
 * إضافة مستخدم جديد
 */
export async function addUserToSheet(userData: Partial<User>) {
    if (!SHEET_URL) return { status: 'error' };
    try {
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'addUser', payload: userData })
        });
        return { status: 'success' };
    } catch (error) {
        return { status: 'error' };
    }
}

/**
 * إضافة فرع جديد
 */
export async function addBranchToSheet(branchData: Partial<Branch>) {
    if (!SHEET_URL) return { status: 'error' };
    try {
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'addBranch', payload: branchData })
        });
        return { status: 'success' };
    } catch (error) {
        return { status: 'error' };
    }
}

/**
 * إضافة منتج جديد
 */
export async function addProductToSheet(productData: Partial<Product>) {
    if (!SHEET_URL) return { status: 'error' };
    try {
        await fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                action: 'addProduct',
                payload: {
                    ...productData,
                    stock: productData.quantity, // Mapping quantity to stock column
                }
            })
        });
        return { status: 'success' };
    } catch (error) {
        return { status: 'error' };
    }
}

/**
 * اختبار الاتصال بقاعدة البيانات
 */
export async function testConnection(): Promise<boolean> {
    if (!SHEET_URL) return false;
    try {
        const response = await fetch(`${SHEET_URL}?action=getProducts`);
        const json = await response.json();
        return json.status === 'success';
    } catch (error) {
        console.error("Connection test failed:", error);
        return false;
    }
}
