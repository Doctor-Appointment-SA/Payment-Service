# 💳 Payment Service

บริการนี้ทำหน้าที่จัดการ **การชำระเงิน (Payment)** และ **การติดตามการจัดส่งยา (Tracking)**
เป็นหนึ่งใน service ของ [ระบบนัดหมายแพทย์](https://github.com/Doctor-Appointment-SA)

**Tech stack:** NestJS · Prisma ORM · PostgreSQL · JWT · Server-Sent Events (SSE)

---

## ✨ Features

- **การชำระเงิน** — สร้างรายการชำระเงินจากใบสั่งยา (prescription), แก้ไข, ยกเลิก และยืนยันการชำระเงิน
- **สถานะการชำระเงิน** — `PENDING` → `SUCCESS` หรือ `CANCEL`
- **หมดอายุอัตโนมัติใน 60 วินาที** — เมื่อสร้างรายการชำระเงินแล้ว ระบบจะนับถอยหลัง
  แล้วส่งเวลาที่เหลือให้ frontend ทุกวินาทีผ่าน SSE ถ้าครบ 60 วินาทีแล้วยังเป็น `PENDING`
  อยู่ รายการนั้นจะถูก **ลบทิ้ง** (ไม่ใช่เปลี่ยนสถานะเป็น `CANCEL`)
- **ติดตามการจัดส่งยา** — `PREPARE` → `SENDING` → `SUCCESS`
  (สถานะจะเดินหน้าอัตโนมัติด้วยตัวจำลอง ยังไม่ได้เชื่อมกับระบบขนส่งจริง)
- **อัปเดตแบบ real-time ด้วย SSE** — frontend เปิด connection ค้างไว้
  แล้ว backend จะ push สถานะใหม่ให้ทันทีที่มีการเปลี่ยนแปลง โดยไม่ต้อง polling
- **ยืนยันตัวตนด้วย JWT** — ใช้ token เดียวกับ [Authentication Service](https://github.com/Doctor-Appointment-SA/Authentication-Service)
- **ตรวจสอบความเป็นเจ้าของ (Ownership Authorization)** — การสร้างและการยืนยันชำระเงิน
  จะตรวจว่าใบสั่งยานั้นเป็นของผู้ใช้ที่ล็อกอินอยู่จริงหรือไม่ ถ้าไม่ใช่จะตอบ `403 Forbidden`
- ใช้ **Prisma ORM** เชื่อมต่อฐานข้อมูล PostgreSQL

### ความสัมพันธ์ของข้อมูล

```
prescription  ─1:1─  payment  ─1:1─  tracking
```

ใบสั่งยา 1 ใบมีรายการชำระเงินได้ 1 รายการ และการชำระเงิน 1 รายการมีการจัดส่งได้ 1 รายการ
ดู ER diagram ฉบับเต็มได้ที่ [`ERD.svg`](./ERD.svg)

---

## ⚙️ การติดตั้ง

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/Doctor-Appointment-SA/Payment-Service.git
cd Payment-Service
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่าไฟล์ `.env`

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"

# JWT — ต้องใช้ค่าเดียวกับ Authentication Service
JWT_ACCESS_SECRET=""

# ไม่บังคับ (มีค่า default ให้แล้ว)
JWT_ISSUER="auth-service"
JWT_AUDIENCE="payment-service"
```

### 4. สร้าง Prisma Client และ migrate ฐานข้อมูล

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. รันเซิร์ฟเวอร์ Development

```bash
npm run build
npm run start:dev
```

เซิร์ฟเวอร์จะรันที่ `http://localhost:4004` และทุก endpoint จะขึ้นต้นด้วย `/api`

> **หมายเหตุ:** CORS ถูกตั้งให้รับเฉพาะ `http://localhost:3000` เท่านั้น
> ถ้ารัน frontend ที่ port อื่น ต้องแก้ที่ `src/main.ts`

### รันด้วย Docker

Dockerfile ของ service นี้ไม่ได้ copy source เข้า image แต่ใช้วิธี mount source เข้าไปตอนรัน
จึงต้องรันผ่าน [Infra](https://github.com/Doctor-Appointment-SA/Infra) ไม่ใช่ `docker build` เดี่ยว ๆ

```bash
git clone https://github.com/Doctor-Appointment-SA/Infra.git
cd Infra
git submodule update --init --recursive
docker compose up --build
```

| วิธีรัน | Port ที่เรียกใช้ |
|---|---|
| `npm run start:dev` โดยตรง | `http://localhost:4004` |
| ผ่าน `docker compose` (Infra) | `http://localhost:5004` |

---

## API Reference

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

## การใช้งาน SSE (Server-Sent Events)

แทนที่ frontend จะ polling ถามสถานะซ้ำ ๆ ทุก ๆ กี่วินาที
เราเปิด connection ค้างไว้เส้นเดียว แล้วให้ backend push ข้อมูลมาเองเมื่อมีการเปลี่ยนแปลง

มี 2 stream แยกกัน และ **ส่ง event คนละชุด**

### Payment stream — `/api/payments/stream/:payment_id`

| `type` | เมื่อไหร่ | `payload` |
|---|---|---|
| `init` | ทันทีที่เปิด connection | ข้อมูลการชำระเงินปัจจุบัน |
| `ping` | ทุก 5 วินาที | — (กัน connection หลุด) |
| `ping-ttl` | ทุก 1 วินาที หลังสร้างรายการ | จำนวนวินาทีที่เหลือก่อนหมดอายุ |
| `remove` | ครบ 60 วินาทีแล้วยังไม่จ่าย | `{ prescription_id }` — รายการถูกลบแล้ว |
| `remove-failed` | ลบไม่สำเร็จ (สถานะเปลี่ยนไปแล้ว) | — |

> **ข้อควรรู้:** payment stream **ไม่ได้** ส่ง event ตอนจ่ายเงินหรือยกเลิกสำเร็จ
> ถ้าต้องการสถานะล่าสุดหลังกดจ่าย ให้ใช้ค่าที่ตอบกลับมาจาก `PATCH /api/payments/pay/:id` โดยตรง

### Tracking stream — `/api/tracking/stream/:tracking_id`

| `type` | เมื่อไหร่ | `payload` |
|---|---|---|
| `init` | ทันทีที่เปิด connection | ข้อมูลการจัดส่งปัจจุบัน |
| `ping` | ทุก 5 วินาที | — |
| `update` | ทุกครั้งที่สถานะจัดส่งเปลี่ยน | ข้อมูลการจัดส่งชุดใหม่ |

ตัวจำลองจะเดินสถานะให้เอง: `PREPARE` → `SENDING` (หลัง 10 วินาที) → `SUCCESS` (หลัง 20 วินาที)

**ตัวอย่างฝั่ง frontend**

```javascript
const es = new EventSource(`http://localhost:4004/api/payments/stream/${paymentId}`);

es.onmessage = (e) => {
  const event = JSON.parse(e.data);

  switch (event.type) {
    case 'ping':      return;                          // heartbeat เฉย ๆ
    case 'init':      return setPayment(event.payload);
    case 'ping-ttl':  return setSecondsLeft(event.payload);   // นับถอยหลัง
    case 'remove':    es.close(); return onExpired();         // หมดเวลา ถูกลบแล้ว
    case 'remove-failed': return;
  }
};

es.onerror = () => es.close();
```

**ทดสอบด้วย curl**

```bash
curl -N http://localhost:4004/api/payments/stream/<PAYMENT_ID>
```

---

## ตัวอย่างการใช้งาน API

### 1. สร้างรายการชำระเงิน

```bash
curl -X POST http://localhost:4004/api/payments/create \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "prescription_id": "<PRESCRIPTION_ID>",
    "cost": 450.00,
    "method": "PROMPTPAY"
  }'
```

### 2. ดูรายการชำระเงินจากใบสั่งยา

```bash
curl -X GET http://localhost:4004/api/payments/prescription/<PRESCRIPTION_ID>
```

### 3. ยืนยันการชำระเงิน

ระบุว่าต้องการให้จัดส่งยาหรือไม่ และส่งไปที่ไหน — ถ้า `delivery` เป็น `true`
ระบบจะสร้างรายการ tracking ให้อัตโนมัติ พร้อมอัปเดตสถานะใบสั่งยาเป็น `paid`
ทั้งหมดนี้ทำอยู่ใน transaction เดียวกัน

```bash
curl -X PATCH http://localhost:4004/api/payments/pay/<PAYMENT_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "delivery": true,
    "location": "123 ถนนงามวงศ์วาน จตุจักร กรุงเทพฯ"
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

## โครงสร้างโปรเจกต์

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

## หมายเหตุ

- แทนค่า `<ACCESS_TOKEN>` ด้วย JWT ที่ได้จาก Authentication Service
- `JWT_ACCESS_SECRET` ต้องตรงกับที่ Authentication Service ใช้ ไม่งั้น guard จะปฏิเสธทุก request
- ทุก endpoint ผ่าน `ValidationPipe` แบบ `whitelist` — field ที่ไม่ได้ประกาศไว้ใน DTO จะถูกตัดทิ้งอัตโนมัติ
- ยอดเงินเก็บเป็น `Float` — ถ้าจะใช้งานจริงควรเปลี่ยนเป็น `Decimal` เพื่อเลี่ยงปัญหาปัดเศษ
- การจัดส่งยาใช้ตัวจำลองเดินสถานะให้อัตโนมัติ (`fakeDeliveryProgress`) เพื่อให้ทดสอบ SSE ได้
  โดยไม่ต้องต่อกับระบบขนส่งจริง
