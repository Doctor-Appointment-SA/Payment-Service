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
curl -X PATCH http://localhost:4005/api/payments/pay/<id>

curl -X PATCH http://localhost:4005/api/payments/pay/5a9c25ac-6c0c-4c04-9cf7-b50b9df50038
curl -X PATCH http://localhost:4005/api/payments/pay/7ff71580-4d83-4bdd-971e-44b7334cabda


============================================================
5️⃣ Delete record
============================================================
curl -X DELETE http://localhost:4005/api/payments/<id>


