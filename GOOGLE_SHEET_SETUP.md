# الدليل الشامل: إعداد قاعدة بيانات Google Sheets الاحترافية (محدث v1.2.0)

هذا الدليل يحتوي على السكربت النهائي المتوافق مع كافة ميزات النظام (المخزون، السجلات، الحذف، التحديث).

## خطوة 1: إعداد ملف الشيت
1.  افتح ملف Google Sheet جديد.
2.  سمّه `Segadty DB`.
3.  اذهب إلى **Extensions** > **Apps Script**.

## خطوة 2: الكود البرمجي
انسخ الكود التالي بالكامل (هذا هو الكود المحدث لحل مشكلة السجلات والخطأ البرمجي):

```javascript
/**
 * Segadty POS Backend - Professional Google Apps Script
 * v1.2.0 - تم إصلاح مشكلة السجلات والـ Headers
 */

// --- التكوين (Configuration) ---
const SHEETS = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  USERS: 'users',
  BRANCHES: 'branches',
  LOGS: 'logs'
};

const HEADERS = {
  [SHEETS.PRODUCTS]: ['id', 'name', 'category', 'cost_price', 'selling_price', 'stock', 'min_quantity', 'image', 'created_at'],
  [SHEETS.CUSTOMERS]: ['id', 'name', 'phone', 'city', 'type', 'created_at'],
  [SHEETS.ORDERS]: ['id', 'invoice_number', 'customer_id', 'total_amount', 'status', 'created_at'],
  [SHEETS.ORDER_ITEMS]: ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'subtotal'],
  [SHEETS.USERS]: ['id', 'username', 'name', 'role', 'password', 'branch_id', 'status', 'created_at'],
  [SHEETS.BRANCHES]: ['id', 'name', 'location', 'phone', 'is_active', 'created_at'],
  [SHEETS.LOGS]: ['timestamp', 'action', 'entity', 'entity_id', 'details', 'status']
};

// --- دالة الإعداد (Setup) ---
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
      sheet.setFrozenRows(1);
    }
  });
  
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
  }
  
  return createJSONOutput({ status: 'success', message: 'Database setup complete. All tables (including logs) created.' });
}

// --- API Endpoints ---

function doGet(e) {
  const action = e.parameter.action;
  let response;
  
  switch(action) {
    case 'getProducts': response = getTableData(SHEETS.PRODUCTS); break;
    case 'getCustomers': response = getTableData(SHEETS.CUSTOMERS); break;
    case 'getUsers': response = getTableData(SHEETS.USERS); break;
    case 'getBranches': response = getTableData(SHEETS.BRANCHES); break;
    case 'getOrders': response = getTableData(SHEETS.ORDERS); break;
    case 'getLogs': response = getTableData(SHEETS.LOGS); break;
    case 'setup': response = setupDatabase(); break;
    default: response = { status: 'error', message: 'Invalid action' };
  }
  return createJSONOutput(response);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    let response;

    switch(action) {
      case 'createOrder':
        response = createOrderTransaction(postData.payload);
        logActivity('CREATE', 'ORDER', response.orderId || 'N/A', JSON.stringify(postData.payload), response.status);
        break;
      case 'addProduct':
        response = addRow(SHEETS.PRODUCTS, postData.payload);
        logActivity('ADD', 'PRODUCT', response.id || 'N/A', JSON.stringify(postData.payload), response.status);
        break;
      case 'updateProduct':
        response = updateProduct(postData.payload);
        logActivity('UPDATE', 'PRODUCT', postData.payload.id || 'N/A', JSON.stringify(postData.payload), response.status);
        break;
      case 'deleteProduct':
        response = deleteRow(SHEETS.PRODUCTS, postData.payload.id);
        logActivity('DELETE', 'PRODUCT', postData.payload.id || 'N/A', 'Deleted by user', response.status);
        break;
      case 'bulkAddProducts':
        response = bulkAddProducts(postData.payload);
        logActivity('BULK_ADD', 'PRODUCT', 'MULTIPLE', `Items: ${postData.payload.length}`, response.status);
        break;
      case 'log':
        logActivity(postData.payload.action, postData.payload.entity, postData.payload.entity_id, postData.payload.details, postData.payload.status);
        response = { status: 'success' };
        break;
      default:
        response = { status: 'error', message: 'Invalid action' };
    }
    return createJSONOutput(response);
  } catch (error) {
    return createJSONOutput({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- Logic Functions ---

function getTableData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: `Sheet ${sheetName} not found` };
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const result = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return { status: 'success', data: result };
}

function addRow(sheetName, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: `Sheet ${sheetName} not found` };
  const headers = HEADERS[sheetName];
  const newRow = headers.map(h => {
    if (h === 'created_at') return new Date();
    if (h === 'id' && !data[h]) return Utilities.getUuid();
    return data[h] !== undefined ? data[h] : '';
  });
  sheet.appendRow(newRow);
  return { status: 'success', message: 'Row added', id: newRow[0] };
}

function updateProduct(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PRODUCTS);
  const existingData = sheet.getDataRange().getValues();
  const headers = existingData[0];
  for (let i = 1; i < existingData.length; i++) {
    if (String(existingData[i][0]) === String(data.id)) {
      headers.forEach((h, colIndex) => {
        if (data[h] !== undefined) sheet.getRange(i + 1, colIndex + 1).setValue(data[h]);
      });
      return { status: 'success', message: 'Product updated' };
    }
  }
  return { status: 'error', message: 'Product not found' };
}

function deleteRow(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Row deleted' };
    }
  }
  return { status: 'error', message: 'Row not found' };
}

function bulkAddProducts(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PRODUCTS);
  const existingData = sheet.getDataRange().getValues();
  const headers = HEADERS[SHEETS.PRODUCTS];
  const idMap = {};
  for (let i = 1; i < existingData.length; i++) idMap[String(existingData[i][0])] = i + 1;
  
  payload.forEach(item => {
    const rowIndex = idMap[String(item.id)];
    if (rowIndex) {
      headers.forEach((h, colIndex) => {
        const val = item[h] !== undefined ? item[h] : (h === 'stock' ? item.quantity : undefined);
        if (val !== undefined) sheet.getRange(rowIndex, colIndex + 1).setValue(val);
      });
    } else {
      const newRow = headers.map(h => {
        if (h === 'created_at') return new Date();
        if (h === 'id' && !item[h]) return Utilities.getUuid();
        return item[h] !== undefined ? item[h] : (h === 'stock' ? (item.quantity || 0) : '');
      });
      sheet.appendRow(newRow);
      idMap[newRow[0]] = sheet.getLastRow();
    }
  });
  return { status: 'success', message: 'Bulk products processed' };
}

function logActivity(action, entity, entityId, details, status) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.LOGS);
    if (!sheet) {
       sheet = ss.insertSheet(SHEETS.LOGS);
       sheet.appendRow(HEADERS[SHEETS.LOGS]);
    }
    sheet.appendRow([new Date(), action, entity, entityId, details, status]);
  } catch (e) {}
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## خطوة 3: التشغيل والنشر
1. اضغط **Save**.
2. اختر `setupDatabase` واضغط **Run**. (سيقوم بإنشاء 7 جداول بما فيها السجلات).
3. اضغط **Deploy** > **New Deployment** > **Web App**.
4. حدد الوصول لـ **Anyone**.
5. انسخ الرابط الجديد وحدثه في موقعك.
