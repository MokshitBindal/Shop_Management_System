# API & WebSocket Endpoints Specification

## Document Version: 1.0

**Date:** February 26, 2026

---

## 1. Overview

This document defines all REST API endpoints and WebSocket events for the Local-First Shop Management System. The backend runs on **Node.js + Express** and uses **Socket.io** for real-time communication over the local network.

### Base URL

```
HTTP:  http://localhost:3000
HTTPS: https://localhost:3000 (self-signed certificate)
WS:    ws://localhost:3000/socket.io
WSS:   wss://localhost:3000/socket.io
```

### Authentication

All API endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

Tokens are obtained via `/api/auth/login` and expire after 24 hours.

---

## 2. Authentication Endpoints

### 2.1 Login

**POST** `/api/auth/login`

**Description:** Authenticate user and obtain JWT token

**Request Body:**

```json
{
  "passcode": "****",
  "macAddress": "AA:BB:CC:DD:EE:FF"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Vikram",
    "role": "boss",
    "macAddress": "AA:BB:CC:DD:EE:FF"
  },
  "expiresIn": 86400
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Invalid passcode or device not whitelisted"
}
```

**Implementation Notes:**

- Passcode is compared via `bcrypt.compare()`
- MAC address must exist in `device_whitelist` table
- Failed login attempts are logged
- Token contains: `{ userId, role, exp: +24h }`

---

### 2.2 Logout

**POST** `/api/auth/logout`

**Description:** Invalidate user session

**Request Body:**

```json
{
  "tokenId": "token_signature_hash"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Implementation Notes:**

- Optional endpoint (can rely on client-side token deletion)
- Token is blacklisted on server side (if token management implemented)

---

### 2.3 Verify Token

**GET** `/api/auth/verify`

**Description:** Check if current token is still valid

**Request Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Vikram",
    "role": "boss"
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Token expired or invalid"
}
```

---

## 3. Item Management Endpoints

### 3.1 Get All Items

**GET** `/api/items`

**Query Parameters:**

```
?category=Groceries
?isActive=true
?search=rice
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Basmati Rice",
      "defaultPrice": 45.0,
      "unitId": 1,
      "unit": { "name": "Kilogram", "abbreviation": "kg" },
      "category": "Groceries",
      "isActive": true
    }
  ],
  "count": 1
}
```

---

### 3.2 Create Item

**POST** `/api/items` (Boss only)

**Request Body:**

```json
{
  "name": "Basmati Rice",
  "defaultPrice": 45.0,
  "unitId": 1,
  "costPrice": 35.0,
  "category": "Groceries",
  "barcode": "8901234567890"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Basmati Rice",
    "defaultPrice": 45.0,
    "unitId": 1,
    "category": "Groceries",
    "createdBy": 1,
    "createdAt": "2026-02-26T10:00:00Z"
  }
}
```

---

### 3.3 Update Item Price

**PUT** `/api/items/:id/price` (Boss only)

**Request Body:**

```json
{
  "defaultPrice": 48.0
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Basmati Rice",
    "defaultPrice": 48.0
  }
}
```

---

## 4. Inventory Endpoints

### 4.1 Get Inventory at Location

**GET** `/api/inventory?locationId=1`

**Query Parameters:**

```
?locationId=1          (required)
?itemId=5              (optional, filter single item)
?category=Groceries    (optional, filter by category)
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "location": { "id": 1, "name": "Main Shop" },
    "items": [
      {
        "itemId": 1,
        "itemName": "Basmati Rice",
        "quantity": 250.0,
        "unit": "kg",
        "lastUpdated": "2026-02-26T21:30:00Z"
      },
      {
        "itemId": 2,
        "itemName": "Sugar",
        "quantity": 50.0,
        "unit": "kg"
      }
    ]
  }
}
```

---

### 4.2 Get All Storage Locations

**GET** `/api/storage-locations`

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Main Shop",
      "description": "Front counter and display shelves",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Warehouse 1",
      "isActive": true
    }
  ]
}
```

---

## 5. Order Endpoints

### 5.1 Create Order

**POST** `/api/orders/create` (**Boss only**)

> ⚠️ **Role restriction:** Only Boss can create orders. Manager and Employee will receive `403 Unauthorized`.

**Request Body:**

```json
{
  "customerName": "Rajesh Kumar",
  "customerPhone": "98765-43210",
  "items": [
    {
      "itemId": 1,
      "quantity": 5.0,
      "overriddenPrice": 40.0,
      "locationPacked": 1
    },
    {
      "itemId": 2,
      "quantity": 3.0,
      "overriddenPrice": 40.0,
      "locationPacked": 1
    }
  ],
  "discount": 50.0,
  "paymentMethod": "cash",
  "paymentBreakdown": { "cash": 270.0 },
  "notes": "Loyal customer",
  "isDeliveryOrder": false,
  "deliveryAssigneeId": null,
  "deliveryAddress": null
}
```

**For a Delivery Order:**

```json
{
  "customerName": "Suresh Patel",
  "customerPhone": "91234-56789",
  "items": [
    {
      "itemId": 1,
      "quantity": 10.0,
      "overriddenPrice": 40.0,
      "locationPacked": 1
    }
  ],
  "discount": 0.0,
  "paymentMethod": "credit",
  "isDeliveryOrder": true,
  "deliveryAssigneeId": 3,
  "deliveryAddress": "12, Gandhi Nagar, Near Post Office"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "orderId": 42,
    "customerName": "Rajesh Kumar",
    "customerPhone": "98765-43210",
    "items": [
      { "itemId": 1, "quantity": 5.0, "unitPrice": 40.0, "lineTotal": 200.0 },
      { "itemId": 2, "quantity": 3.0, "unitPrice": 40.0, "lineTotal": 120.0 }
    ],
    "subtotal": 320.0,
    "discount": 50.0,
    "finalAmount": 270.0,
    "paymentMethod": "cash",
    "isDeliveryOrder": false,
    "deliveryAssigneeId": null,
    "status": "pending",
    "createdAt": "2026-02-26T14:30:00Z"
  }
}
```

**Implementation Notes:**

- Role check: `if (req.user.role !== 'boss') return 403`
- Calculates subtotal and finalAmount
- Saves to `orders` and `order_items` tables
- Payment method set at order creation (Boss-defined)
- If `isDeliveryOrder: true`, sends special delivery notification to the assigned employee
- Emits WebSocket `new_order` event to all employees + managers
- Notification stored in DB with TTL = now + 7 days
- No inventory deduction yet (happens on order completion)

---

### 5.2 Get Order Details

**GET** `/api/orders/:orderId`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "customerName": "Rajesh Kumar",
    "customerPhone": "98765-43210",
    "subtotal": 320.0,
    "discount": 50.0,
    "finalAmount": 270.0,
    "status": "pending",
    "paymentMethod": null,
    "items": [
      {
        "id": 1,
        "itemId": 1,
        "itemName": "Basmati Rice",
        "quantity": 5.0,
        "unitPrice": 40.0,
        "lineTotal": 200.0,
        "isChecked": false
      },
      {
        "id": 2,
        "itemId": 2,
        "itemName": "Sugar",
        "quantity": 3.0,
        "unitPrice": 40.0,
        "lineTotal": 120.0,
        "isChecked": false
      }
    ],
    "createdBy": 2,
    "createdAt": "2026-02-26T14:30:00Z"
  }
}
```

---

### 5.3 Mark Order Item as Checked (Fulfillment)

**PUT** `/api/orders/:orderId/items/:itemId/check` (Boss, Manager, Employee)

**Request Body:**

```json
{
  "isChecked": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "orderId": 42,
    "itemId": 1,
    "isChecked": true,
    "allChecked": false
  }
}
```

**Implementation Notes:**

- Emits WebSocket `checklist_update` event to Boss dashboard
- Used by employees to mark items as packed
- Does not change order status

---

### 5.4 Mark Order as Completed

**PUT** `/api/orders/:orderId/complete` (**Boss, Manager** — Employee will receive 403)

> ⚠️ **Fulfillment attribution is required.** Manager must specify which employee(s) packed the order before completing it.

**Request Body:**

```json
{
  "fulfilledByEmployeeIds": [3, 7],
  "fulfillmentRole": "packer"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "orderId": 42,
    "status": "completed",
    "completedAt": "2026-02-26T14:35:00Z",
    "fulfilledBy": [
      { "employeeId": 3, "role": "packer" },
      { "employeeId": 7, "role": "packer" }
    ]
  }
}
```

**Implementation Notes:**

1. Role check: only `boss` or `manager` (employees get 403)
2. `fulfilledByEmployeeIds` must be a non-empty array
3. Updates order status to `completed`
4. Inserts rows into `order_fulfillments` for each employee
5. Creates `temp_stock_ledger` entries for EOD processing
6. Emits WebSocket `order_completed` event with `fulfilledBy` data
7. Triggers thermal printer ESC/POS receipt

---

### 5.5 Set Delivery Order Status to Fulfilling

**PUT** `/api/orders/:orderId/fulfilling` (**Boss, Manager** — delivery orders only)

> Sets the order status to `fulfilling` (items packed, delivery employee in transit).
> Only valid when `isDeliveryOrder = true` on the order.

**Request Body:**

```json
{
  "deliveryAssigneeId": 3,
  "notes": "Departed at 3:15 PM"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "orderId": 43,
    "status": "fulfilling",
    "deliveryAssigneeId": 3,
    "updatedAt": "2026-02-26T15:15:00Z"
  }
}
```

**Error (400) for non-delivery orders:**

```json
{
  "success": false,
  "error": "Status FULFILLING is only valid for delivery orders",
  "code": "INVALID_STATUS_TRANSITION"
}
```

---

### 5.6 Get Orders List

**GET** `/api/orders`

> **Access:** Boss gets full history with date filters. Manager gets only `pending` and `fulfilling` orders (no past history).

**Query Parameters (Boss only):**

```
?status=completed
?startDate=2026-02-20
?endDate=2026-02-26
?customerPhone=98765-43210
?limit=20
?offset=0
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "customerName": "Rajesh Kumar",
      "customerPhone": "98765-43210",
      "finalAmount": 270.0,
      "status": "completed",
      "paymentMethod": "cash",
      "isDeliveryOrder": false,
      "createdAt": "2026-02-26T14:30:00Z"
    }
  ],
  "total": 1
}
```

---

## 6. Ledger Endpoints

### 6.1 Get Customer Ledger (Credit History)

**GET** `/api/ledger/customer/:customerPhone`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "customerPhone": "98765-43210",
    "customerName": "Rajesh Kumar",
    "totalOwed": 1500.0,
    "totalPaid": 600.0,
    "outstanding": 900.0,
    "isSettled": false,
    "orders": [
      {
        "orderId": 42,
        "amountOwed": 500.0,
        "amountPaid": 200.0,
        "outstanding": 300.0,
        "createdAt": "2026-02-20T10:00:00Z"
      }
    ]
  }
}
```

---

### 6.2 Record Credit Payment

**POST** `/api/ledger/customer/:customerPhone/payment` (Boss, Manager)

**Request Body:**

```json
{
  "amountPaid": 300.0,
  "notes": "Paid via cash"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "customerPhone": "98765-43210",
    "amountPaid": 300.0,
    "outstanding": 600.0,
    "isSettled": false
  }
}
```

---

### 6.3 Get Daily Ledger

**GET** `/api/ledger/daily?date=2026-02-26` (**Boss only**)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "transactionDate": "2026-02-26",
    "isLocked": true,
    "corrections": 0,
    "transactions": [
      {
        "id": 1,
        "orderId": 42,
        "customerName": "Rajesh Kumar",
        "totalAmount": 270.0,
        "paymentMethod": "cash",
        "createdByName": "Boss Vikram",
        "verifiedByName": "Manager Suresh",
        "fulfilledBy": ["Arun"],
        "recordedAt": "2026-02-26T14:35:00Z",
        "isCorrected": false
      }
    ],
    "summary": {
      "totalRevenue": 270.0,
      "cashRevenue": 270.0,
      "upiRevenue": 0.0,
      "creditRevenue": 0.0,
      "transactionCount": 1
    }
  }
}
```

---

### 6.4 Create Ledger Correction

**POST** `/api/ledger/daily/:date/corrections` (**Boss only**)

> Allows correction of a locked daily ledger entry. The original record is **never deleted** — only flagged as `isCorrected: true`.

**Request Body:**

```json
{
  "transactionId": 1,
  "field": "totalAmount",
  "originalValue": 270.0,
  "correctedValue": 250.0,
  "reason": "Customer was given extra 20 rupee discount, forgot to apply"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "correctionId": 5,
    "transactionId": 1,
    "field": "totalAmount",
    "originalValue": 270.0,
    "correctedValue": 250.0,
    "reason": "Customer was given extra 20 rupee discount, forgot to apply",
    "correctedBy": 1,
    "correctedByName": "Boss Vikram",
    "correctedAt": "2026-02-27T09:00:00Z"
  }
}
```

**Implementation Notes:**

- Only `boss` role can create corrections
- Original `daily_ledger` row is NOT deleted; marked `isCorrected: true`
- New `ledger_corrections` audit row is inserted
- Returns `403` if called by Manager or Employee

---

## 7. End of Day (EOD) Endpoints

### 7.1 Get EOD Staging Area

**GET** `/api/eod/staging` (Boss only)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "stagingDate": "2026-02-26",
    "uncommittedCount": 5,
    "deductions": [
      {
        "itemId": 1,
        "itemName": "Basmati Rice",
        "locationId": 1,
        "locationName": "Main Shop",
        "totalQuantityDeducted": 8.0,
        "ordersCount": 3
      }
    ],
    "summary": {
      "itemsAffected": 3,
      "ordersProcessed": 5
    }
  }
}
```

---

### 7.2 Commit EOD

**POST** `/api/eod/commit` (Boss only)

**Request Body:**

```json
{
  "verificationNotes": "Counted inventory manually, numbers match"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "committedAt": "2026-02-26T21:30:00Z",
    "recordsCommitted": 5,
    "ledgerLocked": true,
    "summary": {
      "rice_main_shop_deducted": 8.0,
      "sugar_main_shop_deducted": 3.0
    }
  }
}
```

**Implementation Notes:**

1. Queries all uncommitted temp_stock_ledger records
2. Groups by (itemId, locationId)
3. Updates inventory table with aggregated deductions
4. Marks all temp ledger records as committed
5. Locks daily_ledger for the date
6. Emits WebSocket `eod_complete` event to all clients

---

## 8. Metrics & Analytics Endpoints

### 8.1 Get Sales Velocity

**GET** `/api/metrics/velocity?window=7` (Boss only)

**Query Parameters:**

```
?window=7    (7-day, 14-day, or 30-day velocity)
?categoryId=1 (optional, filter by category)
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "window": 7,
    "items": [
      {
        "itemId": 1,
        "itemName": "Basmati Rice",
        "velocity": 50.0,
        "unit": "kg",
        "totalSoldInWindow": 350.0,
        "ordersCount": 12
      },
      {
        "itemId": 2,
        "itemName": "Sugar",
        "velocity": 30.0,
        "unit": "kg",
        "totalSoldInWindow": 210.0,
        "ordersCount": 8
      }
    ]
  }
}
```

---

### 8.2 Get Restock Recommendations

**GET** `/api/metrics/restock-recommendations` (Boss only)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "itemId": 1,
      "itemName": "Basmati Rice",
      "currentStock": 100.0,
      "velocity7day": 50.0,
      "alertThreshold": 150.0,
      "priority": "HIGH",
      "recommendation": "Reorder at least 100kg (to reach 3 days of inventory)"
    },
    {
      "itemId": 3,
      "itemName": "Mustard Oil",
      "currentStock": 30.0,
      "velocity7day": 5.0,
      "alertThreshold": 15.0,
      "priority": "MEDIUM",
      "recommendation": "Reorder when stock drops below 15L"
    }
  ]
}
```

---

### 8.3 Get Daily Sales Summary

**GET** `/api/metrics/sales-summary?date=2026-02-26` (Boss, Manager)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "date": "2026-02-26",
    "totalRevenue": 5420.0,
    "totalDiscount": 150.0,
    "transactionCount": 18,
    "paymentBreakdown": {
      "cash": 3000.0,
      "upi": 1420.0,
      "credit": 1000.0
    },
    "topItems": [
      {
        "itemId": 1,
        "name": "Basmati Rice",
        "quantitySold": 25.0,
        "revenue": 1000.0
      },
      { "itemId": 2, "name": "Sugar", "quantitySold": 15.0, "revenue": 600.0 }
    ]
  }
}
```

---

## 9. Attendance Endpoints

### 9.1 Mark Attendance

**POST** `/api/attendance/mark` (Boss, Manager)

**Request Body:**

```json
{
  "userId": 3,
  "status": "present",
  "checkInTime": "2026-02-26T09:00:00Z",
  "checkOutTime": "2026-02-26T18:00:00Z",
  "notes": "Regular"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 45,
    "userId": 3,
    "attendanceDate": "2026-02-26",
    "status": "present",
    "markedBy": 1,
    "createdAt": "2026-02-26T09:05:00Z"
  }
}
```

---

### 9.2 Get Attendance Report

**GET** `/api/attendance?startDate=2026-02-01&endDate=2026-02-26&userId=3`

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 3,
      "userName": "Arun",
      "attendanceDate": "2026-02-26",
      "status": "present",
      "checkInTime": "2026-02-26T09:00:00Z",
      "checkOutTime": "2026-02-26T18:00:00Z"
    }
  ],
  "summary": {
    "present": 20,
    "absent": 2,
    "leave": 1,
    "halfDay": 1
  }
}
```

---

## 10. System & Backup Endpoints

### 10.1 Get System Status

**GET** `/api/system/status` (Boss only)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "serverStatus": "online",
    "uptime": "72 hours 30 minutes",
    "databaseSize": "2.5 GB",
    "diskSpaceAvailable": "180 GB",
    "diskSpaceUsed": "76 GB",
    "activeSessions": 4,
    "lastBackup": "2026-02-26T02:00:00Z",
    "raidStatus": "healthy",
    "currentConnectedDevices": ["AA:BB:CC:DD:EE:FF", "CC:11:22:33:44:55"]
  }
}
```

---

### 10.2 Initiate Backup

**POST** `/api/system/backup` (Boss only)

**Response (200 OK - Stream Binary File):**

```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="vyapar_sync_2026-02-26_21-30.sql.enc"
[Binary encrypted SQL dump follows]
```

**Implementation Notes:**

1. Executes `pg_dump` in backend
2. Pipes output through AES-256 encryption
3. Returns encrypted file stream to client
4. Client saves to USB drive (browser download)
5. Logs backup event with timestamp

---

### 10.3 Get Server Logs

**GET** `/api/system/logs?limit=100&filter=error` (Boss only)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-02-26T14:30:00Z",
      "level": "error",
      "message": "Failed to connect to thermal printer",
      "context": { "deviceMac": "AA:BB:CC:DD:EE:FF" }
    }
  ]
}
```

---

## 11. WebSocket Events

### 11.1 Client Connection

```javascript
// Client
import io from "socket.io-client";

const socket = io("wss://localhost:3000", {
  auth: {
    token: "JWT_TOKEN_HERE",
  },
});

socket.on("connect", () => {
  console.log("Connected to server");
  socket.emit("user:joined", { userId: 1, role: "boss" });
});
```

---

### 11.2 Server → Client Events

#### Event: `new_order`

**Emitted by:** Server (when Boss creates an order)
**Received by:** All employees and managers

```javascript
socket.on("new_order", (data) => {
  console.log("New order:", data);
  // data = {
  //   orderId: 42,
  //   customerName: "Rajesh",
  //   isDeliveryOrder: false,
  //   deliveryAssigneeId: null,
  //   items: [
  //     { itemId: 1, itemName: "Rice", quantity: 5, storageLocation: "Shelf A" }
  //   ],
  //   createdAt: "2026-02-26T14:30:00Z",
  //   expiresAt: "2026-03-05T14:30:00Z"  // 7-day TTL
  // }
});
```

---

#### Event: `checklist_update`

**Emitted by:** Server (when employee checks an item)
**Received by:** Boss/Manager dashboard

```javascript
socket.on("checklist_update", (data) => {
  // data = {
  //   orderId: 42,
  //   itemId: 1,
  //   isChecked: true,
  //   checkedBy: 3
  // }
});
```

---

#### Event: `order_fulfilling`

**Emitted by:** Server (when delivery order status set to "fulfilling")
**Received by:** All devices (Boss dashboard and assigned delivery employee)

```javascript
socket.on("order_fulfilling", (data) => {
  // data = {
  //   orderId: 43,
  //   deliveryAssigneeId: 3,
  //   deliveryAssigneeName: "Arun",
  //   updatedAt: "2026-02-26T15:15:00Z"
  // }
});
```

---

#### Event: `order_completed`

**Emitted by:** Server (when Manager/Boss marks order complete)
**Received by:** All devices

```javascript
socket.on("order_completed", (data) => {
  // data = {
  //   orderId: 42,
  //   completedAt: "2026-02-26T14:35:00Z",
  //   verifiedBy: { id: 2, name: "Manager Suresh" },
  //   fulfilledBy: [
  //     { employeeId: 3, name: "Arun", role: "packer" }
  //   ]
  // }
});
```

---

#### Event: `eod_complete`

**Emitted by:** Server (after EOD commit)
**Received by:** All devices

```javascript
socket.on("eod_complete", (data) => {
  // data = {
  //   date: "2026-02-26",
  //   ledgerLocked: true,
  //   recordsCommitted: 5,
  //   committedAt: "2026-02-26T21:30:00Z"
  // }
});
```

---

### 11.3 Client → Server Events

#### Event: `user:joined`

**Sent by:** Client (on connection)

```javascript
socket.emit("user:joined", {
  userId: 3,
  role: "employee",
  deviceMac: "CC:11:22:33:44:55",
});
```

---

#### Event: `ping`

**Sent by:** Client (keep-alive heartbeat)

```javascript
socket.emit("ping", { timestamp: Date.now() });
```

**Server responds:**

```javascript
socket.on("pong", (data) => {
  console.log("Connection alive");
});
```

---

## 12. Error Handling

### Standard Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2026-02-26T14:30:00Z"
}
```

### Common Error Codes

| Code                        | HTTP | Description                                                           |
| --------------------------- | ---- | --------------------------------------------------------------------- |
| `INVALID_CREDENTIALS`       | 401  | Passcode or MAC address invalid                                       |
| `TOKEN_EXPIRED`             | 401  | JWT token has expired                                                 |
| `UNAUTHORIZED`              | 403  | User role doesn't have permission for this action                     |
| `ITEM_NOT_FOUND`            | 404  | Item ID doesn't exist                                                 |
| `INVALID_QUANTITY`          | 400  | Insufficient stock for order                                          |
| `DATABASE_ERROR`            | 500  | Database operation failed                                             |
| `PRINTER_ERROR`             | 500  | Thermal printer not responding                                        |
| `FULFILLMENT_REQUIRED`      | 400  | Must specify at least one fulfilling employee before completing order |
| `INVALID_STATUS_TRANSITION` | 400  | Status change not valid (e.g., FULFILLING on non-delivery order)      |
| `CORRECTION_NOT_BOSS`       | 403  | Only Boss can create ledger corrections                               |

---

## 13. Role-Based Access Control (RBAC) Reference

| Endpoint                                   | Boss | Manager                  | Employee       |
| ------------------------------------------ | ---- | ------------------------ | -------------- |
| `POST /api/orders/create`                  | ✅   | ❌                       | ❌             |
| `GET /api/orders/:id`                      | ✅   | ✅ (pending/active only) | ❌             |
| `GET /api/orders` (full history)           | ✅   | ❌                       | ❌             |
| `GET /api/orders` (pending only)           | ✅   | ✅                       | ❌             |
| `PUT /api/orders/:id/complete`             | ✅   | ✅                       | ❌             |
| `PUT /api/orders/:id/fulfilling`           | ✅   | ✅                       | ❌             |
| `PUT /api/orders/:id/items/:itemId/check`  | ✅   | ✅                       | ✅             |
| `GET /api/items`                           | ✅   | ✅                       | ✅ (read-only) |
| `POST /api/items`                          | ✅   | ❌                       | ❌             |
| `PUT /api/items/:id/price`                 | ✅   | ❌                       | ❌             |
| `GET /api/inventory`                       | ✅   | ✅                       | ❌             |
| `GET /api/storage-locations`               | ✅   | ✅                       | ❌             |
| `GET /api/ledger/customer/:phone`          | ✅   | ❌                       | ❌             |
| `POST /api/ledger/customer/:phone/payment` | ✅   | ❌                       | ❌             |
| `GET /api/ledger/daily`                    | ✅   | ❌                       | ❌             |
| `POST /api/ledger/daily/:date/corrections` | ✅   | ❌                       | ❌             |
| `GET /api/eod/staging`                     | ✅   | ❌                       | ❌             |
| `POST /api/eod/commit`                     | ✅   | ❌                       | ❌             |
| `GET /api/metrics/*`                       | ✅   | ❌                       | ❌             |
| `GET /api/metrics/sales-summary`           | ✅   | ❌                       | ❌             |
| `POST /api/attendance/mark`                | ✅   | ✅                       | ❌             |
| `GET /api/attendance`                      | ✅   | ✅                       | ✅ (own only)  |
| `POST /api/system/backup`                  | ✅   | ❌                       | ❌             |
| `GET /api/system/status`                   | ✅   | ❌                       | ❌             |

---

## 14. Rate Limiting

To prevent abuse (though local network makes this less critical):

```
Anonymous: 5 requests/minute
Authenticated: 100 requests/minute
Backup endpoint: 1 request/hour (per user)
```

---

## 14. CORS Policy

Since this is a local network system:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

All origins on the local network are trusted.
