============================================================
1️⃣ Create Payment
============================================================
curl -X POST http://localhost:4005/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "prescription_id": "f3583f40-2d92-423f-af71-d411ff4748d7",
    "cost": 499.0,
    "method": "CASH"
  }'

=> if you use the same record of prescrtion could lead to error => prescription and payment is 1-1
so we have to create new prescription record first

============================================================
2️⃣ Find One Payment
============================================================
# Replace <id> with actual payment id
curl -X GET http://localhost:4005/api/payments/<id>

2.1 Find One Prescription
curl -X GET http://localhost:4005/api/payments/prescription/<id>


============================================================
3️⃣ Update Payment (only while PENDING)
============================================================
curl -X PATCH http://localhost:4005/api/payments/update/<id> \
  -H "Content-Type: application/json" \
  -d '{"cost": 599.0}'

curl -X PATCH http://localhost:4005/api/payments/update/5a9c25ac-6c0c-4c04-9cf7-b50b9df50038 \
  -H "Content-Type: application/json" \
  -d '{"cost": 599.0}'


============================================================
4️⃣ Cancel Payment
============================================================
curl -X PATCH http://localhost:4005/api/payments/cancel/<id>

curl -X PATCH http://localhost:4005/api/payments/cancel/5a9c25ac-6c0c-4c04-9cf7-b50b9df50038

============================================================
5️⃣ Mark as Paid
============================================================
curl -X PATCH http://localhost:4005/api/payments/pay/<id> \
  -H "Content-Type: application/json" \
  -d '{"delivery":true}'

curl -X PATCH http://localhost:4005/api/payments/pay/ad9521ca-e131-4b19-8069-83948749023d \
  -H "Content-Type: application/json" \
  -d '{"delivery":true, "location":"my home test"}'


============================================================
5️⃣ Delete record
============================================================
curl -X DELETE http://localhost:4005/api/payments/<id>




============================================================
6️⃣ Tracking — Create (กรณีสร้างเอง ไม่ผ่านจ่ายเงิน)
curl -X POST http://localhost:4005/api/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "adc42689-ee2d-4404-bd70-49a37a783ff3",
    "status": "PREPARE"
  }'


ปกติเมื่อ PATCH /api/payments/pay/:id สำเร็จ ระบบจะ create tracking ให้อัตโนมัติแล้ว

คำสั่งนี้ไว้สำหรับทดสอบ/seed เท่านั้น

============================================================
6.1 Tracking — Find One by Tracking ID
# แทน <tracking_id> ด้วย id จริง
curl -X GET http://localhost:4005/api/tracking/<tracking_id>

============================================================
6.2 Tracking — Find by Payment ID
# ค้นหา tracking ของ payment นั้น ๆ
curl -X GET "http://localhost:4005/api/tracking?payment_id=adc42689-ee2d-4404-bd70-49a37a783ff3"

============================================================
6.3 Tracking — Update Status (generic endpoint)
# PREPARE -> SENDING
curl -X PATCH http://localhost:4005/api/tracking/<tracking_id>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"SENDING"}'

curl -X PATCH http://localhost:4005/api/tracking/0f0d0dec-5b2c-4bef-9eb8-4d21cd486e6d/status \
  -H "Content-Type: application/json" \
  -d '{"status":"SENDING"}'

# SENDING -> SUCCESS
curl -X PATCH http://localhost:4005/api/tracking/<tracking_id>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"SUCCESS"}'

curl -X PATCH http://localhost:4005/api/tracking/0f0d0dec-5b2c-4bef-9eb8-4d21cd486e6d/status \
  -H "Content-Type: application/json" \
  -d '{"status":"SUCCESS"}'

ค่า status ต้องเป็นหนึ่งใน: PREPARE | SENDING | SUCCESS

(ถ้าคุณเปิด shortcut routes ตามตัวอย่างก่อนหน้า)
============================================================
6.3.1 Tracking — Update Status (shortcut routes)
# ตั้ง PREPARE
curl -X PATCH http://localhost:4005/api/tracking/<tracking_id>/prepare

# ตั้ง SENDING
curl -X PATCH http://localhost:4005/api/tracking/<tracking_id>/sending

# ตั้ง SUCCESS
curl -X PATCH http://localhost:4005/api/tracking/<tracking_id>/success

============================================================
6.4 Tracking — Delete
curl -X DELETE http://localhost:4005/api/tracking/<tracking_id>

curl -X DELETE http://localhost:4005/api/tracking/0f0d0dec-5b2c-4bef-9eb8-4d21cd486e6d