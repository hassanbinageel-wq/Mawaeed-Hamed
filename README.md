# مواعيد حامد بن عمر

منظومة متكاملة لإدارة مواعيد ومشاوير الشيخ، تشمل ثلاث واجهات في تطبيق واحد:
- **المستخدم الرئيسي** (الشيخ / المساعد)
- **تطبيق السائق**
- **لوحة الإدارة**

جميع الواجهات متصلة بقاعدة بيانات Supabase — أي تحديث يظهر مباشرة عند الآخرين.

---

## الخطوات - من الصفر إلى APK يعمل على جوالك

### 1️⃣ إعداد Supabase (مجاناً)

1. ادخل [https://supabase.com](https://supabase.com) وأنشئ حساباً.
2. اضغط **New project** — اختر اسماً، منطقة قريبة (مثل Frankfurt أو Mumbai)، وكلمة سر قوية لقاعدة البيانات.
3. انتظر ~2 دقيقة حتى ينتهي إعداد المشروع.
4. من القائمة الجانبية اذهب إلى **SQL Editor** → اضغط **New query**.
5. افتح ملف `supabase/schema.sql` من هذا المشروع، انسخ محتواه كاملاً، والصقه في المحرر.
6. اضغط **Run** (Ctrl+Enter). يجب أن تظهر رسالة "Setup complete".
7. اذهب إلى **Settings** ⚙️ → **API** — واحفظ لديك:
   - **Project URL** (يبدأ بـ `https://xxxxx.supabase.co`)
   - **anon / public key** (نص طويل يبدأ بـ `eyJ...`)

### 2️⃣ رفع المشروع على GitHub

```bash
# افتح Terminal داخل مجلد المشروع
git init
git add .
git commit -m "Initial commit"

# أنشئ ريبو جديد على github.com، ثم:
git remote add origin https://github.com/USERNAME/mawaeed-app.git
git branch -M main
git push -u origin main
```

### 3️⃣ إضافة المفاتيح السرية في GitHub

من صفحة الريبو على GitHub:

1. اضغط **Settings** ⚙️ (أعلى الصفحة، وليس القائمة الجانبية).
2. اختر **Secrets and variables** → **Actions**.
3. اضغط **New repository secret** وأضف:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | ألصق Project URL من الخطوة السابقة |
| `SUPABASE_ANON_KEY` | ألصق anon key من الخطوة السابقة |

### 4️⃣ تشغيل بناء APK

GitHub Actions ستبني الـ APK تلقائياً عند كل `push` إلى `main`.

**لتشغيل البناء يدوياً:**
1. اذهب إلى تبويب **Actions** في الريبو.
2. من القائمة الجانبية اختر **Build Android APK**.
3. اضغط **Run workflow** → **Run workflow** (فعّل خيار "release" إن أردت GitHub Release).
4. انتظر 5-10 دقائق حتى يكتمل البناء (سيظهر ✅ أخضر).

### 5️⃣ تحميل APK وتثبيته

1. اضغط على البناء المكتمل ✅ في Actions.
2. اسحب إلى الأسفل حتى تجد قسم **Artifacts** → اضغط **mawaeed-apk** لتحميل ملف مضغوط.
3. فُك الضغط لتحصل على `mawaeed-hamed-bin-omar-debug.apk`.
4. أرسل الملف إلى جوالك (WhatsApp، Google Drive، إلخ).
5. افتحه على الجوال — قد تحتاج تفعيل **"السماح بالتثبيت من هذا المصدر"** في الإعدادات.
6. ثبّت التطبيق واستخدمه!

---

## التطوير محلياً (اختياري)

إذا أردت تشغيل التطبيق على حاسوبك للتجربة قبل بناء APK:

```bash
# ثبّت الحزم
npm install

# انسخ .env.example → .env وضع فيه بيانات Supabase
cp .env.example .env
# افتح .env بمحرر نصوص وأدخل القيم

# شغّل التطبيق
npm run dev
# افتح http://localhost:5173
```

لبناء APK محلياً (يتطلب Android Studio + JDK 21):

```bash
npm run cap:add:android    # مرة واحدة فقط
npm run android:build      # يبني APK داخل android/app/build/outputs/apk/debug/
```

---

## هيكل المشروع

```
mawaeed-app/
├── src/
│   ├── main.jsx              # نقطة الدخول
│   ├── App.jsx               # الواجهات الثلاث (Owner, Driver, Admin)
│   ├── components.jsx        # المكونات المشتركة والأيقونات
│   ├── store.jsx             # AppProvider — يربط React بـ Supabase realtime
│   ├── supabase.js           # عميل Supabase
│   └── index.css             # التنسيقات
├── public/logo.jpg           # شعار الشيخ
├── supabase/schema.sql       # جداول قاعدة البيانات + بيانات تجريبية
├── .github/workflows/
│   └── build-apk.yml         # يبني APK تلقائياً على GitHub
├── capacitor.config.json     # إعدادات تحويل الويب إلى تطبيق أندرويد
├── tailwind.config.js        # التصميم (ألوان، خطوط، الخ)
├── vite.config.js            # إعدادات البناء
└── package.json
```

---

## كيف يعمل الاتصال بين الأجهزة

1. جميع الأجهزة (جوال الشيخ، جوال السائق، لوحة الإدارة) تفتح نفس Supabase.
2. عندما يُنشئ المساعد موعداً جديداً، يُكتب في جدول `appointments`.
3. Supabase يُرسل حدث `postgres_changes` عبر WebSocket لجميع الأجهزة المتصلة.
4. عميل `store.jsx` يستقبل الحدث ويحدّث الواجهة فوراً.
5. لا حاجة لتحديث الصفحة — كل شيء يحصل خلال أقل من ثانية.

---

## بعد الإنشاء - ماذا يجب أن تعرف

**البيانات الأولية** في `schema.sql` تجريبية (وفد ماليزيا، درس الحكم العطائية، الخ). عند التشغيل الأول تراها في التطبيق. يمكنك حذفها من Supabase Dashboard → Table Editor.

**الأمان (RLS)** حالياً مفتوح — أي أحد لديه anon key يستطيع القراءة والكتابة. هذا مناسب لفريق مغلق يستخدم التطبيق داخلياً. لتقييده لاحقاً، فعّل Supabase Auth وحدّث سياسات RLS في `schema.sql`.

**تكلفة Supabase**: الخطة المجانية تكفي لآلاف الطلبات يومياً — لن تحتاج الترقية في السنة الأولى.

**تحديث التطبيق**: أي تعديل تعمل عليه `git push` → GitHub يبني APK جديد → تحمّله وتثبّته فوق القديم.

---

## استكشاف المشاكل

**التطبيق يظهر "تعذّر الاتصال"**
→ راجع أن مفاتيح Supabase في GitHub Secrets صحيحة، ثم أعد تشغيل Build.

**APK لا يفتح على الجوال**
→ فعّل "التثبيت من مصادر غير معروفة" في إعدادات الجوال → التطبيقات.

**البناء يفشل في GitHub Actions**
→ افتح Actions → البناء الفاشل → اقرأ الرسائل الحمراء. أشهر الأسباب: Secrets ناقصة، أو مشكلة في الشبكة.

**التغييرات لا تظهر لحظياً**
→ تأكد أن جميع الأجهزة متصلة بالإنترنت. عند فقدان الاتصال يستمر التطبيق بعرض آخر بيانات محملة حتى يعود.

---

## الترخيص

مشروع خاص. جميع الحقوق محفوظة لصاحب المشروع.
