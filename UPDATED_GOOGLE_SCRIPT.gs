/**
 * Segadty POS Backend - Professional Google Apps Script
 * v1.1.0 - مع دعم CORS
 */

// --- التكوين (Configuration) ---
const SHEETS = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  USERS: 'users',
  BRANCHES: 'branches'
};

const HEADERS = {
  [SHEETS.PRODUCTS]: ['id', 'name', 'category', 'cost_price', 'selling_price', 'stock', 'min_quantity', 'image', 'created_at'],
  [SHEETS.CUSTOMERS]: ['id', 'name', 'phone', 'city', 'type', 'created_at'],
  [SHEETS.ORDERS]: ['id', 'invoice_number', 'customer_id', 'total_amount', 'status', 'created_at'],
  [SHEETS.ORDER_ITEMS]: ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'subtotal'],
  [SHEETS.USERS]: ['id', 'username', 'name', 'role', 'password', 'branch_id', 'status', 'created_at'],
  [SHEETS.BRANCHES]: ['id', 'name', 'location', 'phone', 'is_active', 'created_at']
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
    case 'getUsers':
      return getTableData(SHEETS.USERS);
    case 'getBranches':
      return getTableData(SHEETS.BRANCHES);
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
      case 'addUser':
        return addRow(SHEETS.USERS, postData.payload);
      case 'addBranch':
        return addRow(SHEETS.BRANCHES, postData.payload);
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
  if (!sheet) return createJSONOutput({ status: 'error', message: `Sheet ${sheetName} not found` });
  
  // منع التكرار للمنتجات بناءً على ID
  if (sheetName === SHEETS.PRODUCTS && data.id) {
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][0]) === String(data.id)) {
        return createJSONOutput({ status: 'success', message: 'Product already exists', id: data.id });
      }
    }
  }

  const headers = HEADERS[sheetName];
  const newRow = headers.map(h => {
    if (h === 'created_at') return new Date();
    if (h === 'id' && !data[h]) return Utilities.getUuid();
    return data[h] !== undefined ? data[h] : '';
  });
  
  sheet.appendRow(newRow);
  return createJSONOutput({ status: 'success', message: 'Row added', id: newRow[0] });
}

// دالة معقدة لإنشاء الطلب وتحديث المخزون (Transaction)
function createOrderTransaction(payload) {
  const { customer, items, total, invoiceNumber } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. التحقق من المخزون وتحديثه
  const productSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  const prodData = productSheet.getDataRange().getValues();
  const productMap = new Map();
  
  for(let i=1; i<prodData.length; i++) {
    productMap.set(String(prodData[i][0]), i + 1);
  }
  
  // 2. إنشاء/تحديث العميل (بناءً على رقم الهاتف)
  const customerSheet = ss.getSheetByName(SHEETS.CUSTOMERS);
  const custData = customerSheet.getDataRange().getValues();
  let customerId = '';
  
  for(let i=1; i<custData.length; i++) {
    if(String(custData[i][2]) === String(customer.phone)) {
      customerId = custData[i][0];
      break;
    }
  }
  
  if(!customerId) {
    customerId = Utilities.getUuid();
    customerSheet.appendRow([customerId, customer.name, customer.phone, customer.city, customer.type, new Date()]);
  }
  
  // 3. إنشاء الطلب
  const orderId = Utilities.getUuid();
  const orderRow = [orderId, invoiceNumber, customerId, total, 'completed', new Date()];
  ss.getSheetByName(SHEETS.ORDERS).appendRow(orderRow);
  
  // 4. إنشاء عناصر الطلب وخصم المخزون
  const orderItemsSheet = ss.getSheetByName(SHEETS.ORDER_ITEMS);
  
  items.forEach(item => {
    orderItemsSheet.appendRow([
      Utilities.getUuid(),
      orderId,
      item.id || item.product_id,
      item.quantity,
      item.price || item.unit_price,
      item.quantity * (item.price || item.unit_price)
    ]);
    
    // خصم المخزون
    const rowIndex = productMap.get(String(item.id || item.product_id));
    if(rowIndex) {
      const currentStock = prodData[rowIndex-1][5];
      productSheet.getRange(rowIndex, 6).setValue(currentStock - item.quantity);
    }
  });
  
  return createJSONOutput({ 
    status: 'success', 
    message: 'Order created and stock updated', 
    orderId: orderId,
    invoiceNumber: invoiceNumber
  });
}

// --- Helper Functions ---

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
