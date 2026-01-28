# 🔧 حل مشكلة "Failed to fetch"

## ❌ المشكلة
عند محاولة نقل البيانات، تظهر رسالة:
```
❌ فشل: Failed to fetch
```

## 🎯 السبب
Google Apps Script **لا يسمح بالطلبات من المتصفح** بسبب عدم وجود CORS headers.

---

## ✅ الحل (3 خطوات بسيطة)

### الخطوة 1: افتح Google Apps Script

1. اذهب إلى Google Sheet الخاص بك
2. اضغط **Extensions** > **Apps Script**
3. ستفتح نافذة المحرر

### الخطوة 2: ابحث عن دالة `createJSONOutput`

في نهاية الكود، ستجد:

```javascript
function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### الخطوة 3: استبدلها بهذا الكود

```javascript
function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

**الفرق:** أضفنا 3 أسطر لتفعيل CORS ✅

### الخطوة 4: احفظ وأعد النشر

1. اضغط **Save** (💾)
2. اضغط **Deploy** > **Manage deployments**
3. اضغط على أيقونة القلم ✏️ بجانب النشر الحالي
4. في **Version**، اختر **New version**
5. اضغط **Deploy**
6. انسخ الرابط الجديد (أو استخدم نفس الرابط القديم)

---

## 🧪 اختبار الحل

### الطريقة 1: من المتصفح مباشرة
افتح هذا الرابط في المتصفح:
```
https://script.google.com/macros/s/AKfycbyy3TDTko8tyWUmedcYvoSTYYK7txtRtIvTdqNdq5yg5z2QTkkV4f01wBxdVfK7FwgZ/exec?action=setup
```

**النتيجة المتوقعة:**
```json
{"status":"success","message":"Database setup complete."}
```

إذا ظهرت هذه الرسالة، معناها السكربت يعمل! ✅

### الطريقة 2: من التطبيق
1. ارجع لصفحة نقل البيانات: `http://localhost:3000/admin/migrate`
2. اضغط **"بدء عملية النقل"**
3. يجب أن تنجح العملية الآن! 🎉

---

## 📋 قائمة التحقق

قبل المحاولة مرة أخرى، تأكد من:

- [ ] تم تحديث دالة `createJSONOutput` في Google Apps Script
- [ ] تم حفظ التغييرات (Save)
- [ ] تم إعادة النشر بـ **New version**
- [ ] الرابط في `.env.local` صحيح
- [ ] التطبيق يعمل (`npm run dev`)

---

## 🆘 إذا لم ينجح الحل

### تحقق من الأخطاء الشائعة:

1. **"Invalid action"**
   - ✅ معناها السكربت يعمل، لكن الـ action خاطئ
   - الحل: تأكد من إرسال `?action=setup` في الرابط

2. **"Sheet not found"**
   - ✅ معناها الاتصال يعمل
   - الحل: شغل دالة `setupDatabase()` من Google Apps Script أولاً

3. **"Authorization required"**
   - ❌ معناها النشر ليس بصلاحية "Anyone"
   - الحل: أعد النشر واختر **Who has access: Anyone**

---

## 💡 نصيحة مهمة

بعد أي تعديل في Google Apps Script، **يجب** إعادة النشر بـ **New version** وإلا لن تظهر التغييرات!

---

**بعد تطبيق هذه الخطوات، المشكلة ستحل بإذن الله! 🎉**
