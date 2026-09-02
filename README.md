# 💳 Payment Service

บริการนี้ทำหน้าที่จัดการ **การชำระเงิน (Payment)** และ **การติดตามการจัดส่งยา (Tracking)**
เป็นหนึ่งใน service ของ [ระบบนัดหมายแพทย์](https://github.com/Doctor-Appointment-SA)

**Tech stack:** NestJS · Prisma ORM · PostgreSQL · JWT · Server-Sent Events (SSE)

---

## ✨ Features

- **การชำระเงิน** — สร้างรายการชำระเงินจากใบสั่งยา (prescription), แก้ไข, ยกเลิก และยืนยันการชำระเงิน
- **สถานะการชำระเงิน** — `PENDING` → `SUCCESS` หรือ `CANCEL`
- **ช่องทางการชำระเงิน** — `CREDIT` · `PROMPTPAY` · `BANK` · `CASH`
- **ติดตามการจัดส่งยา** — `PREPARE` → `SENDING` → `SUCCESS`
  (สถานะจะเดินหน้าอัตโนมัติด้วยตัวจำลอง ยังไม่ได้เชื่อมกับระบบขนส่งจริง)
- **อัปเดตแบบ real-time ด้วย SSE** — frontend เปิด connection ค้างไว้
  แล้ว backend จะ push สถานะใหม่ให้ทันทีที่มีการเปลี่ยนแปลง โดยไม่ต้อง polling
- **ยืนยันตัวตนด้วย JWT** — ใช้ token เดียวกับ [Authentication Service](https://github.com/Doctor-Appointment-SA/Authentication-Service)
- **ตรวจสอบความเป็นเจ้าของ (Ownership Authorization)** — การสร้างและการยืนยันชำระเงิน
  จะตรวจว่าใบสั่งยานั้นเป็นของผู้ใช้ที่ล็อกอินอยู่จริงหรือไม่ ถ้าไม่ใช่จะตอบ `403 Forbidden`
  (แค่ล็อกอินแล้วไม่พอ ต้องเป็นเจ้าของใบสั่งยาด้วย)
- ใช้ **Prisma ORM** เชื่อมต่อฐานข้อมูล PostgreSQL

### ความสัมพันธ์ของข้อมูล

```
prescription  ─1:1─  payment  ─1:1─  tracking
```

ใบสั่งยา 1 ใบมีรายการชำระเงินได้ 1 รายการ และการชำระเงิน 1 รายการมีการจัดส่งได้ 1 รายการ
ดู ER diagram ฉบับเต็มได้ที่ [`ERD.svg`](./ERD.svg)

---

## ⚙️ การติดตั้ง

### 1️⃣ Clone โปรเจกต์

```bash
git clone https://github.com/Doctor-Appointment-SA/Payment-Service.git
cd Payment-Service
```

### 2️⃣ ติดตั้ง Dependencies

```bash
npm install
```

### 3️⃣ ตั้งค่าไฟล์ `.env`

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"

# JWT — ต้องใช้ค่าเดียวกับ Authentication Service
JWT_ACCESS_SECRET=""
```

### 4️⃣ สร้าง Prisma Client และ migrate ฐานข้อมูล

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5️⃣ รันเซิร์ฟเวอร์ Development

```bash
npm run build
npm run start:dev
```

เซิร์ฟเวอร์จะรันที่ `http://localhost:4004` และทุก endpoint จะขึ้นต้นด้วย `/api`

> **หมายเหตุ:** CORS ถูกตั้งให้รับเฉพาะ `http://localhost:3000` เท่านั้น
> ถ้ารัน frontend ที่ port อื่น ต้องแก้ที่ `src/main.ts`

### 🐳 รันด้วย Docker

```bash
docker build -t payment-service .
docker run -p 4004:4004 --env-file .env payment-service
```

---

## 🔑 API Reference

### Payment APIs

| Method | Endpoint | คำอธิบาย | ต้องมี Token |
|---|---|---|:---:|
| `POST` | `/api/payments/create` | สร้างรายการชำระเงินจากใบสั่งยา | ✅ |
| `GET` | `/api/payments/:id` | ดูรายการชำระเงินตาม ID | — |
| `GET` | `/api/payments/prescription/:id` | ดูรายการชำระเงินจาก prescription ID | — |
| `PATCH` | `/api/payments/update/:id` | แก้ไขยอดเงิน (เฉพาะตอนสถานะ `PENDING`) | — |
| `PATCH` | `/api/payments/cancel/:id` | ยกเลิกการชำระเงิน | — |
| `PATCH` | `/api/payments/pay/:id` | ยืนยันการชำระเงิน (เฉพาะตอนสถานะ `PENDING`) | ✅ |
| `DELETE` | `/api/payments/:id` | ลบรายการชำระเงิน | — |
| `GET` | `/api/payments/stream/:payment_id` | **SSE** — รับสถานะการชำระเงินแบบ real-time | — |

### Tracking APIs

| Method | Endpoint | คำอธิบาย | ต้องมี Token |
|---|---|---|:---:|
| `POST` | `/api/tracking` | สร้างรายการจัดส่ง | — |
| `GET` | `/api/tracking/:id` | ดูรายการจัดส่งตาม ID | — |
| `GET` | `/api/tracking?payment_id=<ID>` | ดูรายการจัดส่งจาก payment ID | — |
| `PATCH` | `/api/tracking/:id/status` | อัปเดตสถานะการจัดส่ง | — |
| `DELETE` | `/api/tracking/:id` | ลบรายการจัดส่ง | — |
| `GET` | `/api/tracking/stream/:tracking_id` | **SSE** — รับสถานะการจัดส่งแบบ real-time | — |

---

## 📡 การใช้งาน SSE (Server-Sent Events)

แทนที่ frontend จะ polling ถามสถานะซ้ำ ๆ ทุก ๆ กี่วินาที
เราเปิด connection ค้างไว้เส้นเดียว แล้วให้ backend push ข้อมูลมาเองเมื่อมีการเปลี่ยนแปลง

**ลำดับการทำงาน**

1. Frontend เปิด connection ไปที่ `/api/payments/stream/<payment_id>`
2. Backend ส่ง event `init` พร้อมสถานะปัจจุบันกลับมาทันที
3. เมื่อมีการเปลี่ยนสถานะ (เช่น มีคนกดจ่ายเงิน) backend จะ push event ใหม่ให้ทุก subscriber
4. Backend ส่ง event `ping` เป็นระยะเพื่อไม่ให้ connection หลุด
5. เมื่อ frontend ปิด connection ระบบจะถอน listener ออกให้อัตโนมัติ

**ตัวอย่างฝั่ง frontend**

```javascript
const es = new EventSource(`http://localhost:4004/api/payments/stream/${paymentId}`);

es.onmessage = (e) => {
  const event = JSON.parse(e.data);

  if (event.type === 'ping') return;        // heartbeat เฉย ๆ
  if (event.type === 'init') setPayment(event.payload);
  else setPayment(event.payload);
};

es.onerror = () => es.close();
```

**ทดสอบด้วย curl**

```bash
curl -N http://localhost:4004/api/payments/stream/<PAYMENT_ID>
```

---

## 📖 ตัวอย่างการใช้งาน API

### 1. สร้างรายการชำระเงิน

```bash
curl -X POST http://localhost:4004/api/payments/create \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "prescription_id": "<PRESCRIPTION_ID>",
    "cost": 450.00
  }'
```

### 2. ดูรายการชำระเงินจากใบสั่งยา

```bash
curl -X GET http://localhost:4004/api/payments/prescription/<PRESCRIPTION_ID>
```

### 3. ยืนยันการชำระเงิน

```bash
curl -X PATCH http://localhost:4004/api/payments/pay/<PAYMENT_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "PROMPTPAY"
  }'
```

### 4. ยกเลิกการชำระเงิน

```bash
curl -X PATCH http://localhost:4004/api/payments/cancel/<PAYMENT_ID>
```

### 5. อัปเดตสถานะการจัดส่ง

```bash
curl -X PATCH http://localhost:4004/api/tracking/<TRACKING_ID>/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SENDING"
  }'
```

---

## 🗂️ โครงสร้างโปรเจกต์

```
src/
├── auth/
│   └── jwt-auth.guard.ts        # Guard ตรวจ JWT ที่ส่งมาจาก Authentication Service
├── strategies/
│   └── jwt.strategy.ts          # ถอด token แล้ว attach user เข้า request
├── payment/
│   ├── payment.controller.ts    # REST endpoints + SSE stream
│   ├── payment.service.ts       # business logic + เงื่อนไขการเปลี่ยนสถานะ
│   ├── dto/                     # validation schema ของแต่ละ request
│   ├── entities/                # enum: PaymentStatus, PaymentMethod
│   └── stream/stream.ts         # event bus สำหรับ push ข้อมูลเข้า SSE
├── tracking/                    # โครงสร้างเดียวกับ payment
└── prisma/                      # Prisma service + connection
```

---

## 📝 หมายเหตุ

- แทนค่า `<ACCESS_TOKEN>` ด้วย JWT ที่ได้จาก Authentication Service
- `JWT_ACCESS_SECRET` ต้องตรงกับที่ Authentication Service ใช้ ไม่งั้น guard จะปฏิเสธทุก request
- ทุก endpoint ผ่าน `ValidationPipe` แบบ `whitelist` — field ที่ไม่ได้ประกาศไว้ใน DTO จะถูกตัดทิ้งอัตโนมัติ
- ยอดเงินเก็บเป็น `Float` — ถ้าจะใช้งานจริงควรเปลี่ยนเป็น `Decimal` เพื่อเลี่ยงปัญหาปัดเศษ
- การจัดส่งยาใช้ตัวจำลองเดินสถานะให้อัตโนมัติ (`fakeDeliveryProgress`) เพื่อให้ทดสอบ SSE ได้
  โดยไม่ต้องต่อกับระบบขนส่งจริง
