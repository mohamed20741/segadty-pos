/**
 * سكربت نقل البيانات إلى Google Sheets
 * يجب تشغيله بعد إعداد قاعدة البيانات
 */

// تحميل المتغيرات البيئية
require('dotenv').config({ path: '.env.local' });

const SHEET_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;

// البيانات الموجودة
const mockProducts = [
    {
        id: "PRD-001",
        name: "سجاد صلاة فاخر مخطط",
        category: "سجاد فاخر",
        cost_price: 150,
        selling_price: 250,
        quantity: 25,
        min_quantity: 5,
        image: "/images/products/rug-1.jpg"
    },
    {
        id: "PRD-002",
        name: "سجاد صلاة تركي كلاسيك",
        category: "سجاد عادي",
        cost_price: 80,
        selling_price: 120,
        quantity: 50,
        min_quantity: 10,
        image: ""
    },
    {
        id: "PRD-003",
        name: "سجاد أطفال تعليمي",
        category: "سجاد أطفال",
        cost_price: 40,
        selling_price: 75,
        quantity: 15,
        min_quantity: 5,
        image: ""
    },
    {
        id: "PRD-004",
        name: "مسند ظهر طبي",
        category: "إكسسوارات",
        cost_price: 60,
        selling_price: 100,
        quantity: 30,
        min_quantity: 8,
        image: ""
    },
    {
        id: "PRD-005",
        name: "طقم صلاة هدية (سجادة + مصحف)",
        category: "سجاد فاخر",
        cost_price: 200,
        selling_price: 350,
        quantity: 10,
        min_quantity: 3,
        image: ""
    },
    {
        id: "PRD-006",
        name: "سجاد حرير فاخر",
        category: "سجاد فاخر",
        cost_price: 500,
        selling_price: 850,
        quantity: 5,
        min_quantity: 2,
        image: ""
    }
];

/**
 * إعداد قاعدة البيانات
 */
async function setupDatabase() {
    if (!SHEET_URL) {
        console.error('❌ خطأ: NEXT_PUBLIC_GOOGLE_SHEET_URL غير موجود في ملف .env.local');
        return false;
    }

    try {
        console.log('🔧 جاري إعداد قاعدة البيانات...');
        const response = await fetch(`${SHEET_URL}?action=setup`);
        const result = await response.json();

        if (result.status === 'success') {
            console.log('✅ تم إعداد قاعدة البيانات بنجاح\n');
            return true;
        } else {
            console.error('❌ فشل الإعداد:', result.message);
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error.message);
        return false;
    }
}

/**
 * إضافة منتج
 */
async function addProduct(product) {
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'addProduct',
                payload: payload
            })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

/**
 * نقل جميع المنتجات
 */
async function migrateAllProducts() {
    console.log('📦 جاري نقل المنتجات...\n');

    let successCount = 0;
    let failCount = 0;

    for (const product of mockProducts) {
        const result = await addProduct(product);

        if (result.status === 'success') {
            console.log(`✅ تم إضافة: ${product.name}`);
            successCount++;
        } else {
            console.log(`❌ فشل: ${product.name} - ${result.message}`);
            failCount++;
        }

        // انتظار نصف ثانية بين كل عملية
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 النتيجة النهائية:');
    console.log(`   ✅ نجح: ${successCount}`);
    console.log(`   ❌ فشل: ${failCount}`);
    console.log(`   📦 الإجمالي: ${mockProducts.length}`);
    console.log('='.repeat(60) + '\n');
}

/**
 * الدالة الرئيسية
 */
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 بدء عملية نقل البيانات إلى Google Sheets');
    console.log('='.repeat(60) + '\n');

    // الخطوة 1: إعداد قاعدة البيانات
    const setupSuccess = await setupDatabase();
    if (!setupSuccess) {
        console.log('\n💡 تأكد من:');
        console.log('   1. وجود NEXT_PUBLIC_GOOGLE_SHEET_URL في ملف .env.local');
        console.log('   2. أن الرابط صحيح ومنشور بصلاحية "Anyone"');
        console.log('   3. نسخ الكود من GOOGLE_SHEET_SETUP.md إلى Google Apps Script\n');
        process.exit(1);
    }

    // الخطوة 2: نقل المنتجات
    await migrateAllProducts();

    console.log('🎉 اكتملت عملية النقل بنجاح!\n');
    console.log('💡 الخطوة التالية: قم بتشغيل التطبيق بـ npm run dev\n');
}

// تشغيل السكربت
main().catch(error => {
    console.error('❌ حدث خطأ:', error);
    process.exit(1);
});
