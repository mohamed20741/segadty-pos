/**
 * سكربت نقل البيانات الموجودة إلى Google Sheets
 * Migration Script - Transfer Mock Data to Google Sheets
 */

import { mockProducts } from '../src/lib/data';

const SHEET_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;

interface MigrateResult {
    success: boolean;
    message: string;
    details?: any;
}

/**
 * إعداد قاعدة البيانات (إنشاء الجداول)
 */
async function setupDatabase(): Promise<MigrateResult> {
    if (!SHEET_URL) {
        return { success: false, message: 'SHEET_URL غير موجود في ملف .env.local' };
    }

    try {
        console.log('🔧 جاري إعداد قاعدة البيانات...');
        const response = await fetch(`${SHEET_URL}?action=setup`);
        const result = await response.json();

        if (result.status === 'success') {
            console.log('✅ تم إعداد قاعدة البيانات بنجاح');
            return { success: true, message: 'Database setup complete', details: result };
        } else {
            return { success: false, message: result.message || 'فشل الإعداد' };
        }
    } catch (error) {
        return { success: false, message: `خطأ في الاتصال: ${error}` };
    }
}

/**
 * إضافة منتج واحد إلى Google Sheets
 */
async function addProduct(product: any): Promise<MigrateResult> {
    if (!SHEET_URL) {
        return { success: false, message: 'SHEET_URL غير موجود' };
    }

    try {
        const payload = {
            id: product.id,
            name: product.name,
            category: product.category,
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            stock: product.quantity,
            min_quantity: product.min_quantity,
            image: product.image || '',
        };

        const response = await fetch(SHEET_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'addProduct',
                payload: payload
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            return { success: true, message: `تم إضافة: ${product.name}`, details: result };
        } else {
            return { success: false, message: result.message || 'فشلت الإضافة' };
        }
    } catch (error) {
        return { success: false, message: `خطأ: ${error}` };
    }
}

/**
 * نقل جميع المنتجات
 */
async function migrateAllProducts(): Promise<void> {
    console.log('\n📦 جاري نقل المنتجات...\n');

    let successCount = 0;
    let failCount = 0;

    for (const product of mockProducts) {
        const result = await addProduct(product);

        if (result.success) {
            console.log(`✅ ${result.message}`);
            successCount++;
        } else {
            console.log(`❌ فشل: ${product.name} - ${result.message}`);
            failCount++;
        }

        // انتظار قصير بين كل عملية لتجنب التحميل الزائد
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 النتيجة النهائية:`);
    console.log(`   ✅ نجح: ${successCount}`);
    console.log(`   ❌ فشل: ${failCount}`);
    console.log(`   📦 الإجمالي: ${mockProducts.length}`);
    console.log('='.repeat(50) + '\n');
}

/**
 * الدالة الرئيسية
 */
async function main() {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 بدء عملية نقل البيانات إلى Google Sheets');
    console.log('='.repeat(50) + '\n');

    // الخطوة 1: إعداد قاعدة البيانات
    const setupResult = await setupDatabase();
    if (!setupResult.success) {
        console.error('❌ فشل الإعداد:', setupResult.message);
        console.log('\n💡 تأكد من:');
        console.log('   1. وجود NEXT_PUBLIC_GOOGLE_SHEET_URL في ملف .env.local');
        console.log('   2. أن الرابط صحيح ومنشور بصلاحية "Anyone"');
        console.log('   3. تشغيل setupDatabase() في Google Apps Script أولاً\n');
        return;
    }

    // الخطوة 2: نقل المنتجات
    await migrateAllProducts();

    console.log('🎉 اكتملت عملية النقل!\n');
}

// تشغيل السكربت
main().catch(console.error);
