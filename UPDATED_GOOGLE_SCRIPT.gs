/**
 * Segadty POS Backend - Professional Google Apps Script
 * v1.3.0 - التحسين النهائي للعلاقات، الحذف، التقارير، وتحديث البيانات
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
  
  return createJSONOutput({ status: 'success', message: 'Database setup complete.' });
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
    case 'getReportsData': response = getReportsData(); break;
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
        logActivity('UPDATE', 'PRODUCT', String(postData.payload.id), JSON.stringify(postData.payload), response.status);
        break;
      case 'deleteProduct':
        response = deleteRow(SHEETS.PRODUCTS, postData.payload.id);
        logActivity('DELETE', 'PRODUCT', String(postData.payload.id), 'Deleted', response.status);
        break;
      case 'bulkAddProducts':
        response = bulkAddProducts(postData.payload);
        logActivity('BULK_ADD', 'PRODUCT', 'MULTIPLE', `Items: ${postData.payload.length}`, response.status);
        break;
      case 'addUser':
        response = addRow(SHEETS.USERS, postData.payload);
        logActivity('ADD', 'USER', response.id || 'N/A', postData.payload.username, response.status);
        break;
      case 'addBranch':
        response = addRow(SHEETS.BRANCHES, postData.payload);
        logActivity('ADD', 'BRANCH', response.id || 'N/A', postData.payload.name, response.status);
        break;
      case 'log':
        logActivity(postData.payload.action, postData.payload.entity, postData.payload.entity_id, postData.payload.details, postData.payload.status);
        response = { status: 'success' };
        break;
      case 'login':
        response = loginUser(postData.payload);
        logActivity('LOGIN', 'USER', postData.payload.username, 'Login attempt', response.status);
        break;
      case 'updateUser':
        response = updateUser(postData.payload);
        logActivity('UPDATE', 'USER', String(postData.payload.id), JSON.stringify(postData.payload), response.status);
        break;
      case 'deleteUser':
        response = deleteRow(SHEETS.USERS, postData.payload.id);
        logActivity('DELETE', 'USER', String(postData.payload.id), 'Deleted', response.status);
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
  if (data.length === 0) return { status: 'success', data: [] };
  
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const result = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = row[i];
    });
    return obj;
  });
  return { status: 'success', data: result };
}

function addRow(sheetName, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: `Sheet ${sheetName} not found` };
  
  if (sheetName === SHEETS.PRODUCTS && data.id) {
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][0]).trim().toLowerCase() === String(data.id).trim().toLowerCase()) {
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

function updateProduct(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PRODUCTS);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  
  const searchId = String(data.id).trim().toLowerCase();
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === searchId) {
      headers.forEach((h, colIndex) => {
        if (data[h] !== undefined) {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[h]);
        }
      });
      return { status: 'success', message: 'Product updated' };
    }
  }
  return { status: 'error', message: 'Product not found with ID: ' + searchId };
}

function deleteRow(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const searchId = String(id).trim().toLowerCase();
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === searchId) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Row deleted' };
    }
  }
  return { status: 'error', message: 'Row not found with ID: ' + searchId };
}

function bulkAddProducts(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PRODUCTS);
  const values = sheet.getDataRange().getValues();
  const headers = HEADERS[SHEETS.PRODUCTS];
  const idMap = {};
  for (let i = 1; i < values.length; i++) idMap[String(values[i][0]).trim().toLowerCase()] = i + 1;
  
  payload.forEach(item => {
    const id = String(item.id).trim().toLowerCase();
    const rowIndex = idMap[id];
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
      idMap[String(newRow[0]).trim().toLowerCase()] = sheet.getLastRow();
    }
  });
  return { status: 'success', message: 'Bulk products processed' };
}

function createOrderTransaction(payload) {
  const { customer, items, total, invoiceNumber } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const productSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  const prodData = productSheet.getDataRange().getValues();
  const productMap = new Map();
  for(let i=1; i<prodData.length; i++) productMap.set(String(prodData[i][0]).trim().toLowerCase(), i + 1);
  
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
  
  const orderId = Utilities.getUuid();
  ss.getSheetByName(SHEETS.ORDERS).appendRow([orderId, invoiceNumber, customerId, total, 'completed', new Date()]);
  
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
    
    const rowIndex = productMap.get(String(item.id || item.product_id).trim().toLowerCase());
    if(rowIndex) {
      const currentStock = Number(prodData[rowIndex-1][5]) || 0;
      productSheet.getRange(rowIndex, 6).setValue(currentStock - item.quantity);
    }
  });
  
  return { status: 'success', message: 'Order created', orderId, invoiceNumber };
}

function updateUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  
  const searchId = String(data.id).trim().toLowerCase();
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === searchId) {
      headers.forEach((colName, colIndex) => {
        if (data[colName] !== undefined && colName !== 'id') {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[colName]);
        }
      });
      return { status: 'success', message: 'User updated' };
    }
  }
  return { status: 'error', message: 'User not found' };
}

function getReportsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const orders = ss.getSheetByName(SHEETS.ORDERS).getDataRange().getValues();
  const items = ss.getSheetByName(SHEETS.ORDER_ITEMS).getDataRange().getValues();
  const prods = ss.getSheetByName(SHEETS.PRODUCTS).getDataRange().getValues();
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  let totalSales = 0;
  let monthlySales = 0;
  const dailySales = {};
  const categorySales = {};
  const productSales = {};
  
  const prodInfo = {};
  for(let i=1; i<prods.length; i++) prodInfo[String(prods[i][0])] = { name: prods[i][1], cat: prods[i][2] };
  
  for(let i=1; i<orders.length; i++) {
    const date = new Date(orders[i][5]);
    const amount = Number(orders[i][3]) || 0;
    totalSales += amount;
    if(date >= startOfMonth) monthlySales += amount;
    const dStr = date.toISOString().split('T')[0];
    dailySales[dStr] = (dailySales[dStr] || 0) + amount;
  }
  
  for(let i=1; i<items.length; i++) {
    const pid = String(items[i][2]);
    const qty = Number(items[i][3]) || 0;
    const price = Number(items[i][4]) || 0;
    const info = prodInfo[pid] || { name: 'Unknown', cat: 'Other' };
    productSales[info.name] = (productSales[info.name] || 0) + qty;
    categorySales[info.cat] = (categorySales[info.cat] || 0) + (qty * price);
  }
  
  return {
    status: 'success',
    data: {
      totalSales,
      monthlySales,
      orderCount: orders.length - 1,
      dailySales,
      categorySales,
      topProducts: Object.entries(productSales).sort((a,b) => b[1] - a[1]).slice(0, 5)
    }
  };
}

function loginUser(payload) {
  const { username, password } = payload;
  if (!username || !password) return { status: 'error', message: 'Username and password required' };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  if (!sheet) return { status: 'error', message: 'Users sheet not found. Please run setup.' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'error', message: 'No users found in database.' };
  
  const rawHeaders = data[0];
  const normalizedHeaders = rawHeaders.map(h => String(h).trim().toLowerCase());
  
  // Find column indices
  const userIdx = normalizedHeaders.findIndex(h => h === 'username' || h === 'user_name' || h === 'اسم المستخدم');
  const passIdx = normalizedHeaders.findIndex(h => h === 'password' || h === 'كلمة المرور');
  const statusIdx = normalizedHeaders.findIndex(h => h === 'status' || h === 'الحالة');
  
  if (userIdx === -1 || passIdx === -1) {
    return { 
      status: 'error', 
      message: 'Required columns (username/password) not found. Found: ' + normalizedHeaders.join(', ') 
    };
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const currentUser = row[userIdx];
    const currentPass = row[passIdx];
    
    if (String(currentUser).trim().toLowerCase() === String(username).trim().toLowerCase()) {
      if (String(currentPass) === String(password)) {
        const status = statusIdx !== -1 ? String(row[statusIdx] || 'active').trim().toLowerCase() : 'active';
        
        if (status === 'inactive' || status === 'blocked') {
          return { status: 'error', message: 'Account is ' + status };
        }
        
        // Construct user object for frontend
        const userObj = {};
        rawHeaders.forEach((h, j) => {
          if (normalizedHeaders[j] !== 'password') {
            userObj[normalizedHeaders[j]] = row[j];
          }
        });
        
        return { status: 'success', data: userObj };
      } else {
        return { status: 'error', message: 'Invalid password' };
      }
    }
  }
  
  return { status: 'error', message: 'User not found' };
}

function logActivity(action, entity, entityId, details, status) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.LOGS) || ss.insertSheet(SHEETS.LOGS);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS[SHEETS.LOGS]);
    sheet.appendRow([new Date(), action, entity, entityId, details, status]);
  } catch (e) {}
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
