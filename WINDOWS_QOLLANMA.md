# QUIZORA — Windows (Lenovo va barcha Windows noutbuklar) uchun Ishga Tushirish Qo'llanmasi

Ushbu ZIP arxivi Windows operatsion tizimi uchun to'liq optimallashtirilgan. Mac'dagi ortiqcha va xalaqit beruvchi tizim fayllari (`node_modules`, `venv`, `.DS_Store`) olib tashlangan.

---

## 1. Birinchi martalik tayyorgarlik (Faqat 1 marta qilinadi)

Noutbukingizda quyidagi 2 ta bepul dastur o'rnatilgan bo'lishi kerak:

1. **Node.js (Frontend uchun):**
   * Sayt: [https://nodejs.org](https://nodejs.org)
   * **LTS** versiyasini yuklab oling va standart holda o'rnating (`Next -> Next -> Finish`).
2. **Python (Backend uchun):**
   * Sayt: [https://www.python.org/downloads/](https://www.python.org/downloads/)
   * Python 3.11 yoki 3.12 ni yuklab oling.
   * ⚠️ **MUHIM:** O'rnatish boshida pastda turgan **"Add python.exe to PATH"** ga albatta belgi qo'ying!

---

## 2. Loyihani Ishga Tushirish (1 bosishda!)

Zip arxivni ochganingizdan so'ng, loyiha ichidagi maxsus tayyorlangan fayl ustiga 2 marta bosing:

👉 **`start_quizora_windows.bat`**

Ushbu skript:
* Python virtual muhitini avtomatik yaratadi.
* Backend va Frontend uchun barcha kutubxonalarni o'zi avtomatik o'rnatadi.
* Ikkala serverni (Port 8000 va Port 3000) alohida oynalarda xatosiz ishga tushiradi!

---

## 3. Brauzerda Ochish

* **Asosiy sayt:** [http://localhost:3000](http://localhost:3000)
* **Backend API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 4. Tizim Administratori Ma'lumotlari

* **Admin URL:** [http://localhost:3000/admin](http://localhost:3000/admin) yoki [http://localhost:3000/login](http://localhost:3000/login)
* **Email:** `admin@quizora.com`
* **Parol:** `Admin123!`
*(Login sahifasida "Admin hisobiga tezkor kirish" tugmasini bosish orqali ham 1 soniyada kirishingiz mumkin).*
