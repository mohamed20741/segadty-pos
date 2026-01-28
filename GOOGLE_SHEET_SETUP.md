# الدليل الشامل: إعداد قاعدة بيانات Google Sheets الاحترافية

هذا الدليل يحتوي على سكربت (Google Apps Script) متكامل ومحترف لتحويل Google Sheets إلى قاعدة بيانات علائقية (Relational Database) حقيقية تدعم المنتجات، العملاء، الطلبات، وتحديث المخزون تلقائياً.

## المميزات في هذا السكربت:
1.  **إنشاء الجداول تلقائياً**: (setup) بنقرة واحدة يتم بناء هيكل الجداول (`products`, `customers`, `orders`, `order_items`).
2.  **إدارة العلاقات**: ربط الطلبات بالعملاء والمنتجات.
3.  **تحديث المخزون**: خصم الكميات تلقائياً عند إتمام عملية الشراء.
4.  **API متكامل**: يدعم القراءة (GET) والكتابة (POST) لجميع الجداول.

---

## خطوة 1: إعداد ملف الشيت
1.  افتح ملف Google Sheet جديد.
2.  سمّه `Segadty DB` (أو أي اسم).
3.  اذهب إلى **Extensions** > **Apps Script**.

## خطوة 2: الكود البرمجي (backend.gs)
انسخ الكود التالي بالكامل بدلاً من أي كود موجود في المحرر:

```javascript
/**
 * Segadty POS Backend - Professional Google Apps Script
 * v1.0.0
 */

// --- التكوين (Configuration) ---
const SHEETS = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items'
};

const HEADERS = {
  [SHEETS.PRODUCTS]: ['id', 'name', 'category', 'cost_price', 'selling_price', 'stock', 'min_quantity', 'image', 'created_at'],
  [SHEETS.CUSTOMERS]: ['id', 'name', 'phone', 'city', 'type', 'created_at'],
  [SHEETS.ORDERS]: ['id', 'invoice_number', 'customer_id', 'total_amount', 'status', 'created_at'],
  [SHEETS.ORDER_ITEMS]: ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'subtotal']
};

// --- دالة الإعداد (Setup) ---
// * شغل هذه الدالة مرة واحدة فقط لإنشاء الجداول *
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.keys(SHEETS).forEach(key => {
    const sheetName = SHEETS[key];
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, HEADERS[sheetName].length)
           .setValues([HEADERS[sheetName]])
           .setFontWeight("bold")
           .setBackground("#f3f4f6");
      // تجميد الصف الأول
      sheet.setFrozenRows(1);
    }
  });
  
  // حذف الشيت الافتراضي (Sheet1) إذا كان فارغاً
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
  }
  
  return createJSONOutput({ status: 'success', message: 'Database setup complete.' });
}

// --- API Endpoints ---

function doGet(e) {
  const action = e.parameter.action;
  const id = e.parameter.id;
  
  // توجيه الطلبات
  switch(action) {
    case 'getProducts':
      return getTableData(SHEETS.PRODUCTS);
    case 'getCustomers':
      return getTableData(SHEETS.CUSTOMERS);
    case 'getOrders':
      return getTableData(SHEETS.ORDERS);
    case 'setup':
      return setupDatabase();
    default:
      return createJSONOutput({ status: 'error', message: 'Invalid action' });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    // محاولة حجز العملية لمدة 10 ثواني لمنع التضارب
    lock.waitLock(10000); 
    
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    switch(action) {
      case 'createOrder':
        return createOrderTransaction(postData.payload);
      case 'addProduct':
        return addRow(SHEETS.PRODUCTS, postData.payload);
      case 'updateStock':
        return updateProductStock(postData.payload);
      default:
        return createJSONOutput({ status: 'error', message: 'Invalid action' });
    }
  } catch (error) {
    return createJSONOutput({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- Logic Functions (Business Logic) ---

function getTableData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return createJSONOutput({ status: 'error', message: `Sheet ${sheetName} not found` });
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  
  return createJSONOutput({ status: 'success', data: result });
}

function addRow(sheetName, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const headers = HEADERS[sheetName];
  const newRow = headers.map(h => {
    if (h === 'created_at') return new Date();
    if (h === 'id' && !data[h]) return Utilities.getUuid(); // توليد ID تلقائي
    return data[h] || '';
  });
  
  sheet.appendRow(newRow);
  return createJSONOutput({ status: 'success', message: 'Row added', id: newRow[0] });
}

// دالة معقدة لإنشاء الطلب وتحديث المخزون (Transaction)
function createOrderTransaction(payload) {
  const { customer, items, total, invoiceNumber } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. التحقق من المخزون أولاً
  const productSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  const prodData = productSheet.getDataRange().getValues();
  // تحويل المنتجات لفهرس سريع (Map)
  const productMap = new Map(); // ID -> RowIndex (1-based)
  
  for(let i=1; i<prodData.length; i++) {
    productMap.set(String(prodData[i][0]), i + 1);
  }
  
  // التحقق
  const insufficientStock = [];
  items.forEach(item => {
    const rowIndex = productMap.get(item.product_id);
    if(rowIndex) {
      const currentStock = prodData[rowIndex-1][5]; // 5 هو index عمود stock
      if(currentStock < item.quantity) {
        insufficientStock.push(item.product_id);
      }
    }
  });
  
  if(insufficientStock.length > 0) {
    return createJSONOutput({ status: 'error', message: 'Insufficient stock', products: insufficientStock });
  }
  
  // 2. إنشاء العميل (إذا لم يكن موجوداً - تبسيط: ننشئه دائماً أو نفحص الهاتف)
  const customerId = Utilities.getUuid();
  const customerRow = [customerId, customer.name, customer.phone, customer.city, customer.type, new Date()];
  ss.getSheetByName(SHEETS.CUSTOMERS).appendRow(customerRow);
  
  // 3. إنشاء الطلب
  const orderId = Utilities.getUuid();
  const orderRow = [orderId, invoiceNumber, customerId, total, 'completed', new Date()];
  ss.getSheetByName(SHEETS.ORDERS).appendRow(orderRow);
  
  // 4. إنشاء عناصر الطلب + خصم المخزون
  const orderItemsSheet = ss.getSheetByName(SHEETS.ORDER_ITEMS);
  
  items.forEach(item => {
    // إضافة عنصر الطلب
    orderItemsSheet.appendRow([
      Utilities.getUuid(),
      orderId,
      item.product_id,
      item.quantity,
      item.unit_price,
      item.quantity * item.unit_price
    ]);
    
    // خصم المخزون
    const rowIndex = productMap.get(item.product_id);
    const currentStock = prodData[rowIndex-1][5];
    productSheet.getRange(rowIndex, 6).setValue(currentStock - item.quantity); // العمود 6 هو F (stock)
  });
  
  return createJSONOutput({ 
    status: 'success', 
    message: 'Order created successfully', 
    orderId: orderId,
    invoiceNumber: invoiceNumber
  });
}

// --- Helper Functions ---

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

## خطوة 3: التشغيل الأولي
1.  بعد لصق الكود، اضغط **Save** (أيقونة القرص).
2.  من القائمة المنسدلة للوظائف في الأعلى، اختر `setupDatabase` واضغط **Run**.
3.  سيطلب منك الإذن للوصول للشيت، وافق عليه.
4.  ارجع لملف الشيت، ستجد أن التبويبات (products, customers, etc.) تم إنشاؤها تلقائياً مع العناوين!

## خطوة 4: النشر (Deploy)
1.  اضغط **Deploy** > **New deployment**.
2.  Type: **Web app**.
3.  Who has access: **Anyone** (مهم جداً).
4.  اضغط **Deploy**.
5.  انسخ الرابط الجديد وضعه في ملف `.env.local` في مشروعك.
