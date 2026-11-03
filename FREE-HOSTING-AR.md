# نشر الموقع مجانًا — شرح بالعربي

## أول حاجة: الدومين مش استضافة

تخيل:

- **الدومين** = عنوان المحل: `dewskincare.com`
- **الاستضافة** = المحل نفسه
- **الموقع** = البضاعة اللي جوه المحل

إنت عندك العنوان بس. عشان الناس تلاقي المحل، لازم المحل يكون موجود.

موقعك مش صفحة عادية؛ هو **برنامج Node.js** لازم يشتغل 24 ساعة عشان:

- العملاء يدخلوا ويشتروا
- الأدمن يضيف منتجات
- الطلبات تتحفظ
- الصور تترفع

عشان كده **استضافة Hostinger العادية (Premium) مش هتشغله**. لازم باقة **Business** أو **Cloud**، أو سيرفر VPS.

---

## الطريقة السهلة (مدفوعة)

Hostinger Business/Cloud:

1. تدخل hPanel
2. Websites → Create site → **Web App**
3. ترفع ملف `dew-skincare-live.zip`
4. تختار:
   - Framework: **Other**
   - Node: **22**
   - Entry file: **server.js**
   - Build: **npm install**
   - Start: **npm start**
5. تحط المتغيرات:
   ```text
   NODE_ENV=production
   HOST=0.0.0.0
   DATA_DIR=/home/USER/domains/YOURDOMAIN.com/shop-data
   UPLOAD_DIR=/home/USER/domains/YOURDOMAIN.com/shop-uploads
   ```
6. تربط الدومين + تفعل SSL
7. تدخل `/admin.html` وتغير الباسورد

هي دي أسهل طريقة، لكن **مدفوعة**.

---

## الطريقة المجانية: Oracle Cloud

شركة Oracle عندها خدمة اسمها **Always Free** — سيرفر مجاني للأبد.

تخيل إنك بتاخد **غرفة صغيرة مجانية** في عمارة كبيرة، وتحط فيها المحل بتاعك.

### المميزات

- مجاني (مش تجربة شهر)
- سيرفر كامل تشغل عليه Node
- مساحة تخزين للطلبات والصور
- ينفع عليه الدومين بتاعك
- مش زي Render المجاني اللي بيمسح الطلبات والصور

### العيوب

- محتاج بطاقة بنكية للتحقق (عادةً ما بيسحبوش فلوس)
- الإعداد مش بضغطة زر — حوالي 30–45 دقيقة
- ممكن Oracle تستعيد السيرفر لو فضل خامل فترة طويلة، فخلي بالك من الباك أب

> **Render المجاني** سهل جدًا، لكن بعد 15 دقيقة بدون زيارات بيدخل في نوم، وأي إعادة تشغيل **بتمسح الطلبات والصور**. عشان كده مش مناسب لدكان حقيقي.

---

## خطوات Oracle بالتفصيل

### 1. اعمل حساب

ادخل [oracle.com/cloud/free](https://www.oracle.com/cloud/free/) واعمل حساب. هيطلب بطاقة للتحقق.

### 2. اعمل سيرفر

من القائمة:

- **Compute → Instances → Create Instance**
- Image: **Ubuntu 24.04**
- Shape:
  - **VM.Standard.A1.Flex** (2 OCPU / 12 GB) لو متاح
  - أو **VM.Standard.E2.1.Micro** (أصغر لكن يكفي)
- نزّل **Private Key** واحتفظ بيه (ملف `.key`)
- خلّي الـ **Public IP** موجود

### 3. افتح باب الموقع

السيرفر بيقفل كل الأبواب افتراضيًا. لازم تفتح بابين:

**Networking → Virtual Cloud Networks → Security Lists → Default Security List**

ضيف Ingress Rules:

- Source: `0.0.0.0/0`
- Protocol: TCP
- Destination Port: `80`
- وكمان `443`

### 4. ادخل على السيرفر

من الماك، في Terminal:

```bash
chmod 600 /path/to/your-key.key
ssh -i /path/to/your-key.key ubuntu@YOUR_SERVER_IP
```

### 5. ارفع الموقع

من الماك (مش من داخل السيرفر):

```bash
scp -i /path/to/your-key.key dew-skincare-live.zip ubuntu@YOUR_SERVER_IP:~/
```

### 6. فك الضغط وشغّل السكربت

داخل السيرفر:

```bash
sudo apt update
sudo apt install -y unzip
sudo mkdir -p /var/www/dew
sudo unzip -o ~/dew-skincare-live.zip -d /var/www/dew
sudo bash /var/www/dew/deploy/oracle-setup.sh YOURDOMAIN.com YOUR_EMAIL@gmail.com
```

السكربت هيعمل لوحده:

- تثبيت Node 22
- تثبيت Nginx
- تشغيل الموقع كخدمة دائمة
- فتح البورتات
- إعداد SSL لو الدومين جاهز

### 7. اربط الدومين

في Hostinger:

**Domains → DNS → Manage DNS**

ضيف:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `YOUR_SERVER_IP` |
| A | `www` | `YOUR_SERVER_IP` |

استنى من 10 دقايق لساعة.

### 8. افتح الموقع

- `https://YOURDOMAIN.com`
- `https://YOURDOMAIN.com/admin.html`

لو SSL ما اشتغلش أول مرة:

```bash
sudo certbot --nginx -d YOURDOMAIN.com -d www.YOURDOMAIN.com
```

---

## بعد ما يشتغل

1. ادخل `/admin.html`
2. غيّر الباسورد فورًا
3. **غيّر رقم الواتساب** من Store → WhatsApp number
4. امسح الطلبات التجريبية
5. اعمل طلب تجريبي من الموبايل
6. خد نسخة احتياطية:

```bash
sudo tar -czf ~/dew-backup-$(date +%F).tar.gz /var/lib/dew
```

---

## يعني إيه الكلام ده كله؟

- **IP** = رقم البيت
- **DNS** = دفتر العناوين اللي بيحوّل الاسم لرقم
- **SSL** = القفل الأخضر في المتصفح
- **السيرفر** = كمبيوتر بعيد شغال 24 ساعة
- **Node** = البرنامج اللي بيشغل موقعك

لو حسيت إن خطوة صعبة، قولي رقم الخطوة وأنا أشرحها لك بالتفصيل.

---

## ملخص سريع

| الطريقة | التكلفة | السهولة | مناسبة للطلبات؟ |
| --- | --- | --- | --- |
| Hostinger Business/Cloud | مدفوعة | سهلة | نعم |
| Oracle Cloud Always Free | مجانية | متوسطة/صعبة | نعم |
| Render Free | مجانية | سهلة | لا — بتفقد الطلبات والصور |
| Vercel / Netlify | مجانية | سهلة | لا — مش سيرفر Node دائم |

**توصيتي:** لو تقدر تدفع، Hostinger Business أسهل وأسرع. لو عايز مجاني فعلاً، Oracle هو الحل الواقعي.
