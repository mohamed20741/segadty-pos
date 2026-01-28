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
  let response;
  
  switch(action) {
    case 'getProducts':
      response = getTableData(SHEETS.PRODUCTS);
      break;
    case 'getCustomers':
      response = getTableData(SHEETS.CUSTOMERS);
      break;
    case 'getUsers':
      response = getTableData(SHEETS.USERS);
      break;
    case 'getBranches':
      response = getTableData(SHEETS.BRANCHES);
      break;
    case 'getOrders':
      response = getTableData(SHEETS.ORDERS);
      break;
    case 'getLogs':
      response = getTableData(SHEETS.LOGS);
      break;
    case 'setup':
      response = setupDatabase();
      break;
    default:
      response = { status: 'error', message: 'Invalid action' };
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
      case 'addUser':
        response = addRow(SHEETS.USERS, postData.payload);
        break;
      case 'addBranch':
        response = addRow(SHEETS.BRANCHES, postData.payload);
        break;
      case 'log':
        logActivity(postData.payload.action, postData.payload.entity, postData.payload.entity_id, postData.payload.details, postData.payload.status);
        response = { status: 'success' };
        break;
      default:
        logActivity('UNKNOWN', 'ACTION', 'N/A', action, 'error');
        response = { status: 'error', message: 'Invalid action' };
    }
    return createJSONOutput(response);
  } catch (error) {
    logActivity('ERROR', 'SYSTEM', 'N/A', error.toString(), 'error');
    return createJSONOutput({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- Logic Functions (Business Logic) ---

function getTableData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: `Sheet ${sheetName} not found` };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  
  return { status: 'success', data: result };
}

function addRow(sheetName, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: `Sheet ${sheetName} not found` };
  
  // منع التكرار للمنتجات بناءً على ID
  if (sheetName === SHEETS.PRODUCTS && data.id) {
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][0]) === String(data.id)) {
        return { status: 'success', message: 'Product already exists', id: data.id };
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
  return { status: 'success', message: 'Row added', id: newRow[0] };
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
  
  return { 
    status: 'success', 
    message: 'Order created and stock updated', 
    orderId: orderId,
    invoiceNumber: invoiceNumber
  };
}

function updateProduct(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  const existingData = sheet.getDataRange().getValues();
  const headers = existingData[0];
  
  for (let i = 1; i < existingData.length; i++) {
    if (String(existingData[i][0]) === String(data.id)) {
      // Find the row and update
      headers.forEach((h, colIndex) => {
        if (data[h] !== undefined) {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[h]);
        }
      });
      return { status: 'success', message: 'Product updated' };
    }
  }
  return { status: 'error', message: 'Product not found' };
}

function bulkAddProducts(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  const existingData = sheet.getDataRange().getValues();
  const headers = HEADERS[SHEETS.PRODUCTS];
  
  // Map of existing IDs to their row index (1-based)
  const idMap = {};
  for (let i = 1; i < existingData.length; i++) {
    idMap[String(existingData[i][0])] = i + 1;
  }
  
  payload.forEach(item => {
    const id = String(item.id);
    const rowIndex = idMap[id];
    
    if (rowIndex) {
      // Update existing
      headers.forEach((h, colIndex) => {
        // Map quantity -> stock if needed
        const val = item[h] !== undefined ? item[h] : (h === 'stock' ? (item.quantity) : undefined);
        if (val !== undefined) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(val);
        }
      });
    } else {
      // Add new
      const newRow = headers.map(h => {
        if (h === 'created_at') return new Date();
        if (h === 'id' && !item[h]) return Utilities.getUuid();
        const val = item[h] !== undefined ? item[h] : (h === 'stock' ? (item.quantity || 0) : '');
        return val;
      });
      sheet.appendRow(newRow);
      // Update map to prevent duplicates in the same bulk upload
      idMap[id || newRow[0]] = sheet.getLastRow();
    }
  });
  
  return { status: 'success', message: 'Bulk products processed (Added/Updated)' };
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
  } catch (e) {
    console.error("Logging failed: " + e.toString());
  }
}

function deleteRow(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Row deleted' };
    }
  }
  return { status: 'error', message: 'Row not found' };
}

// --- Helper Functions ---

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
