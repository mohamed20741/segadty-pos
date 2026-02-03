import { Product, User, Branch } from "@/types";

export const SHEET_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;

/**
 * دالة مساعدة لإرسال البيانات وانتظار الرد (تستخدم للعمليات التي تحتاج بيانات عائدة مثل تسجيل الدخول)
 */
async function postToSheetWithResponse(action: string, payload: any) {
    if (!SHEET_URL) return { status: 'error', message: 'Sheet URL missing' };

    try {
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            body: JSON.stringify({ action, payload }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error in action ${action}:`, error);
        return { status: 'error', message: String(error) };
    }
}

/**
 * دالة مساعدة لإرسال البيانات إلى السكريبت بطريقة تمنع مشاكل الـ CORS
 * نستخدم 'text/plain' لتجنب الـ Preflight OPTIONS request
 */
async function postToSheet(action: string, payload: any) {
    if (!SHEET_URL) return { status: 'error', message: 'Sheet URL missing' };

    try {
        await fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors', // نستخدم no-cors لضمان وصول الطلب دون اعتراض المتصفح
            body: JSON.stringify({ action, payload }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        });

        // مع no-cors لا يمكن قراءة الرد، لذا نفترض النجاح إذا لم يحدث استثناء
        return { status: 'success' };
    } catch (error) {
        console.error(`Error in action ${action}:`, error);
        return { status: 'error', message: String(error) };
    }
}

/**
 * جلب جميع المنتجات من الشيت
 */
export async function getProductsFromSheet(): Promise<Product[] | null> {
    if (!SHEET_URL) return null;
    try {
        const res = await fetch(`${SHEET_URL}?action=getProducts`);
        const json = await res.json();
        if (json.status === 'success') {
            // Mapping 'stock' from Sheet back to 'quantity' for UI
            return json.data.map((p: any) => ({
                ...p,
                quantity: Number(p.stock) || 0
            }));
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return null;
    }
}

/**
 * إنشاء طلب جديد في الشيت وتحديث المخزون
 */
export async function createOrderInSheet(orderData: any) {
    return postToSheet('createOrder', orderData);
}

/**
 * إضافة منتج جديد
 */
export async function addProductToSheet(productData: Partial<Product>) {
    return postToSheet('addProduct', {
        ...productData,
        stock: productData.quantity, // Mapping quantity to stock column
    });
}

/**
 * تحديث بيانات منتج
 */
export async function updateProductInSheet(productData: Partial<Product>) {
    const payload: any = { ...productData };
    if (productData.quantity !== undefined) {
        payload.stock = productData.quantity;
    }
    return postToSheet('updateProduct', payload);
}

/**
 * حذف منتج
 */
export async function deleteProductFromSheet(id: string) {
    return postToSheet('deleteProduct', { id: String(id).trim() });
}

/**
 * ترحيل كمية كبيرة من المنتجات (Bulk)
 */
export async function bulkAddProductsToSheet(products: Partial<Product>[]) {
    return postToSheet('bulkAddProducts', products);
}

/**
 * تسجيل لوق (Log) مباشر في الشيت
 */
export async function logToSheet(action: string, entity: string, entityId: string, details: string, status: 'success' | 'error') {
    return postToSheet('log', { action, entity, entity_id: entityId, details, status });
}

/**
 * جلب جميع الفروع
 */
export async function getBranchesFromSheet(): Promise<Branch[] | null> {
    if (!SHEET_URL) return null;
    try {
        const res = await fetch(`${SHEET_URL}?action=getBranches`);
        const json = await res.json();
        return json.status === 'success' ? json.data : null;
    } catch (error) {
        console.error("Failed to fetch branches:", error);
        return null;
    }
}

/**
 * إضافة فرع جديد
 */
export async function addBranchToSheet(branchData: Partial<Branch>) {
    return postToSheet('addBranch', branchData);
}

/**
 * جلب جميع المستخدمين
 */
export async function getUsersFromSheet(): Promise<User[] | null> {
    if (!SHEET_URL) return null;
    try {
        const res = await fetch(`${SHEET_URL}?action=getUsers`);
        const json = await res.json();
        return json.status === 'success' ? json.data : null;
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return null;
    }
}

/**
 * البحث عن فاتورة
 */
export async function searchInvoice(query: string) {
    if (!SHEET_URL) return null;
    try {
        const res = await fetch(`${SHEET_URL}?action=searchInvoice&query=${encodeURIComponent(query)}`);
        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Failed to search invoices:", error);
        return { status: 'error', message: String(error) };
    }
}

/**
 * جلب تفاصيل فاتورة
 */
export async function getInvoiceDetails(invoiceId: string) {
    if (!SHEET_URL) return null;
    try {
        const res = await fetch(`${SHEET_URL}?action=getInvoiceDetails&invoiceId=${encodeURIComponent(invoiceId)}`);
        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Failed to fetch invoice details:", error);
        return { status: 'error', message: String(error) };
    }
}

/**
 * معالجة عملية استرجاع أو استبدال
 */
export async function processReturnExchange(payload: any) {
    return postToSheetWithResponse('processReturnExchange', payload);
}

/**
 * جلب بيانات التقارير والإحصائيات
 */
export async function getReportsData(branchId?: string, startDate?: string, endDate?: string) {
    if (!SHEET_URL) return null;
    try {
        let url = `${SHEET_URL}?action=getReportsData`;
        if (branchId) url += `&branchId=${branchId}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        const res = await fetch(url);
        const json = await res.json();
        return json.status === 'success' ? json.data : null;
    } catch (error) {
        console.error("Failed to fetch reports data:", error);
        return null;
    }
}

/**
 * جلب إحصائيات المخزون
 */
export async function getInventoryStats(branchId?: string) {
    if (!SHEET_URL) return null;
    try {
        let url = `${SHEET_URL}?action=getInventoryStats`;
        if (branchId) url += `&branchId=${branchId}`;

        const res = await fetch(url);
        const json = await res.json();
        return json.status === 'success' ? json.data : null;
    } catch (error) {
        console.error("Failed to fetch inventory stats:", error);
        return null;
    }
}

/**
 * جلب أداء الكاشير
 */
export async function getCashierPerformance(branchId?: string, startDate?: string, endDate?: string) {
    if (!SHEET_URL) return null;
    try {
        let url = `${SHEET_URL}?action=getCashierPerformance`;
        if (branchId) url += `&branchId=${branchId}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        const res = await fetch(url);
        const json = await res.json();
        return json.status === 'success' ? json.data : null;
    } catch (error) {
        console.error("Failed to fetch cashier performance:", error);
        return null;
    }
}

/**
 * تسجيل الدخول
 */
export async function loginUser(credentials: any) {
    return postToSheetWithResponse('login', credentials);
}

/**
 * إضافة مستخدم جديد
 */
export async function addUserToSheet(userData: Partial<User>) {
    return postToSheet('addUser', userData);
}

/**
 * تحديث بيانات مستخدم
 */
export async function updateUserInSheet(userData: Partial<User>) {
    return postToSheet('updateUser', userData);
}

/**
 * حذف مستخدم
 */
export async function deleteUserFromSheet(id: string) {
    return postToSheet('deleteUser', { id: String(id).trim() });
}

/**
 * اختبار الاتصال بقاعدة البيانات
 */
export async function testConnection(): Promise<boolean> {
    if (!SHEET_URL) return false;
    try {
        const res = await fetch(`${SHEET_URL}?action=getProducts`);
        return res.ok;
    } catch {
        return false;
    }
}
