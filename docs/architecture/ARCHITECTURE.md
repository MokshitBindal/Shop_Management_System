# System Architecture & Technical Design

## Document Version: 1.0

**Date:** February 26, 2026

---

## 1. High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOCAL NETWORK (LAN)                     │
│               + WireGuard VPN (Remote Employees)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Boss/Desktop    │  │  Manager Phone   │   (In-Premises)    │
│  │  React.js Web    │  │  Capacitor.js    │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
│           │                     │                              │
│           │         ┌───────────┴────────────┐                 │
│           │         │ Wi-Fi Router (Local)   │                 │
│           │         │ 802.11ac / 5GHz        │                 │
│           │         └───────────┬────────────┘                 │
│           │                     │                              │
│  ┌────────▼─────────────────────▼──────────────────┐          │
│  │                                                  │          │
│  │  LOCAL SERVER (Mini-PC, i3, 8GB RAM)            │          │
│  │  ┌────────────────────────────────────────┐    │          │
│  │  │  Node.js + Express Backend             │    │          │
│  │  │  - REST APIs                           │    │          │
│  │  │  - WebSocket (Socket.io)               │    │          │
│  │  │  - Authentication & Authorization      │    │          │
│  │  └────────────────────────────────────────┘    │          │
│  │  ┌────────────────────────────────────────┐    │          │
│  │  │  WireGuard VPN Server                  │    │          │
│  │  │  - Assigns VPN IPs to remote devices   │    │          │
│  │  │  - Employee phones connect from 5-10km │    │          │
│  │  │  - Encrypted tunnel (ChaCha20+Poly1305)│    │          │
│  │  └────────────────────────────────────────┘    │          │
│  │  ┌────────────────────────────────────────┐    │          │
│  │  │  PostgreSQL Database                   │    │          │
│  │  │  - Permanent Inventory                 │    │          │
│  │  │  - Temp Stock Ledger (EOD Staging)    │    │          │
│  │  │  - Orders, Items, Users, Ledgers      │    │          │
│  │  │  - Notifications (7-day TTL)          │    │          │
│  │  │  - order_fulfillments (attribution)   │    │          │
│  │  └────────────────────────────────────────┘    │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │             REMOTE EMPLOYEES (5-10km away)             │    │
│  │  ┌───────────────────────────────────────────────┐    │    │
│  │  │  Employee Android (WireGuard VPN client)       │    │    │
│  │  │  → Connects to shop VPN via internet           │    │    │
│  │  │  → Once connected, appears as local device     │    │    │
│  │  │  → Socket.io works identically                 │    │    │
│  │  │  → Notifications auto-deleted after 7 days     │    │    │
│  │  └───────────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Characteristics:

- **Dual-Network Support:** Local Wi-Fi for in-premises devices; WireGuard VPN for remote employees (5-10km)
- **Centralized Database:** Single PostgreSQL instance for all data
- **Real-Time Push:** Socket.io WebSockets over local LAN or VPN tunnel
- **Notification TTL:** All messages purged from server + device after 7 days
- **Manual Backups:** Owner physically manages backup USB drives
- **No Cloud:** Zero external service dependencies (internet only used for VPN tunnel)

---

## 2. Technology Stack Rationale

### 2.1 Frontend Layer

**React.js + Vite**

- **Why React:** Industry-standard, large ecosystem, excellent for building dynamic UIs
- **Why Vite:** Fast build times, optimized for local development, lightweight production bundle
- **Deployment:** Single-page application served from Express backend
- **Styling:** TailwindCSS for responsive design (works well on phones and desktops)

**Capacitor.js (Android Wrapper)**

- **Why Capacitor:** Bridges web app to native Android APIs without rewriting in Kotlin
- **Benefits:**
  - Bluetooth access for thermal printer communication
  - File system access for backup management
  - Native notifications (if Wi-Fi alert system added)
  - Single React codebase runs on web AND Android
- **Build:** `capacitor build android` generates APK for sideloading onto devices

**WebSocket Client (Socket.io-client)**

- Real-time order notifications
- Live checklist updates from Boss to Employees
- Order completion acknowledgments

### 2.2 Backend Layer

**Node.js + Express.js**

- **Why Node.js:** Lightweight, non-blocking I/O perfect for local server with limited hardware
- **Why Express:** Minimal framework overhead, excellent middleware ecosystem
- **Port:** Server runs on `http://localhost:3000` (or configurable)
- **HTTPS:** Self-signed certificate for local HTTPS (to protect passcodes in transit)

**Socket.io**

- Real-time bidirectional communication between server and clients
- Alternative to Firebase Cloud Messaging (which requires cloud)
- Events:
  - `new_order` → pushed to employees
  - `checklist_update` → pushed to Boss dashboard
  - `order_completed` → triggers stock deduction logging
  - `eod_commit` → broadcasts ledger lock to all clients

### 2.3 Database Layer

**PostgreSQL**

- **Why PostgreSQL:**
  - ACID compliance (critical for financial transactions)
  - Excellent concurrency handling (multiple simultaneous orders)
  - Strong data integrity constraints
  - Native JSON support (for future extensibility)
  - Runs efficiently on local hardware
  - Zero licensing cost (open source)

**Drizzle ORM**

- **Why Drizzle (over Prisma):**
  - Smaller bundle size (important for edge deployments)
  - Zero cold-start issues (good for local server)
  - Type-safe SQL generation
  - Better control over generated queries
  - Faster query execution
  - No migration runtime dependency

**Backup Strategy:**

- `pg_dump` utility generates SQL export
- Piped through encryption (AES-256) before USB storage

### 2.4 Hardware Integration

**ESC/POS Thermal Printers**

- Standard protocol for 2-inch and 3-inch receipt printers
- Supported via Bluetooth (via Capacitor) or LAN
- Examples: Zebra ZD, Star Micronics, Sunmi printers

**RAID 1 Configuration**

- Two identical SSDs/HDDs mirrored for redundancy
- Linux `mdadm` utility manages the RAID array
- Transparent to the application layer

---

## 3. Request/Response Flow Diagrams

### 3.1 Order Creation & Notification Flow

```
BOSS ONLY (Web/Desktop)
        │
        ├─► POST /api/orders/create
        │   {
        │     "customerName": "Rajesh",
        │     "customerPhone": "98765-43210",
        │     "items": [
        │       { "itemId": 1, "quantity": 5, "overriddenPrice": 40 }
        │     ],
        │     "discount": 50,
        │     "paymentMethod": "cash|upi|credit|mixed",
        │     "isDeliveryOrder": false,
        │     "deliveryAssigneeId": null
        │   }
        │
        ▼
   [Express Backend]
        │
        ├─► Validate request & role (Boss only)
        ├─► Calculate totals (5 * 40 - 50 = 150)
        ├─► Save to `orders` table with status="pending"
        ├─► Save to `order_items` table
        │
        ├─► Socket.io Emit: 'new_order'
        │   Payload: { orderId: 42, items: [...], isDelivery: false }
        │
        ▼
   [All Connected Employees & Managers]
   (via LAN Wi-Fi or WireGuard VPN tunnel)
        │
        ├─► Receive 'new_order' event
        ├─► Notification stored in DB with TTL = now() + 7 days
        ├─► Alert: "New Order #42 - Rajesh"
        ├─► Display checklist UI with items + storage locations
        │
        └─► Employee begins packing & checking items
            (employee CANNOT mark order complete)
```

### 3.2 Order Completion & EOD Staging Flow

```
MANAGER or BOSS (Mobile/Web)
        │
        ├─► View checklist for Order #42
        ├─► Checks fulfilled (items physically packed by employee)
        │
        ├─► Tap "Mark Complete"
        │   {
        │     "fulfilledByEmployeeIds": [3, 7],   ← REQUIRED attribution
        │     "fulfillmentRole": "packer"          ← packer | delivery
        │   }
        │
        ▼
   [Express Backend]
        │
        ├─► Validate role (Manager or Boss only)
        ├─► Update orders: status = "completed"
        ├─► Insert to `order_fulfillments`:
        │   - orderId: 42, employeeId: 3, role: "packer", attributedBy: managerId
        │   - orderId: 42, employeeId: 7, role: "packer", attributedBy: managerId
        ├─► If credit involved: Insert to customer_ledger
        ├─► Insert to temp_stock_ledger:
        │   - orderId: 42, itemId: [1, 5, 7]
        │   - quantityDeducted: [5, 3, 2]
        │   - isCommitted: false
        │
        ├─► Print physical receipt (ESC/POS)
        │   (via Bluetooth to thermal printer)
        │
        ├─► Socket.io Emit: 'order_completed'
        │   (for dashboard updates)
        │
        └─► Response: "Order completed"
```

### 3.3 End of Day (EOD) Reconciliation Flow

```
BOSS (Web Dashboard)
        │
        ├─► 9:00 PM - Reviews "EOD Staging" dashboard
        │   Shows all completed orders from today
        │   - Order #42: Rice 5kg + Sugar 3kg
        │   - Order #43: Oil 2L
        │   - Order #44: Salt 1kg
        │
        │   [Manual verification against physical stock count]
        │
        ├─► Click "Commit EOD"
        │
        ▼
   [Express Backend]
        │
        ├─► Query all temp_stock_ledger where isCommitted = false
        │
        ├─► Group by (itemId, locationId):
        │   - Rice, Main Shop: 5kg + 2kg + 1kg = 8kg
        │   - Oil, Warehouse 1: 2L
        │   - Salt, Main Shop: 1kg
        │
        ├─► Update inventory table:
        │   - inventory[rice, main_shop]: 250kg - 8kg = 242kg
        │   - inventory[oil, warehouse1]: 100L - 2L = 98L
        │   - inventory[salt, main_shop]: 50kg - 1kg = 49kg
        │
        ├─► Update temp_stock_ledger: isCommitted = true (all records)
        │
        ├─► Lock daily_ledger: locked = true
        │
        └─► Socket.io Emit: 'eod_complete'
            (alerts all clients that day is locked)
```

---

## 4. Authentication & Authorization Architecture

### 4.1 Authentication Flow

```
Client (Web/Mobile)
    │
    ├─► Enter Passcode
    │
    ├─► POST /api/auth/login
    │   {
    │     "passcode": "****",
    │     "deviceMacAddress": "AA:BB:CC:DD:EE:FF"  (Capacitor provides this)
    │   }
    │
    ▼
[Express Backend]
    │
    ├─► Hash passcode with bcrypt (bcrypt.compare)
    ├─► Check against users.passcode
    ├─► Verify deviceMacAddress in device_whitelist table
    │
    ├─IF valid:
    │   ├─► Generate JWT token (signed with server secret)
    │   ├─► Token contains: { userId, role, exp: +24h }
    │   ├─► Return token to client
    │   └─► Client stores token in localStorage (web) or AsyncStorage (React Native)
    │
    └─ELSE:
        ├─► Log failed attempt
        └─► Return 401 Unauthorized
```

### 4.2 Authorization Middleware

```
[Every API Request]
    │
    ├─► Extract JWT from Authorization header
    ├─► Verify signature and expiry
    │
    ├─► Attach user object to request context
    │   { userId: 5, role: "manager" }
    │
    ├─► Route Handler Executes with Role Check:
    │
    │   if (requiredRole === "boss" && req.user.role !== "boss") {
    │     return 403 Forbidden
    │   }
    │
    └─► Proceed with business logic
```

### 4.3 Role-Based Access Control (RBAC)

| Endpoint                     | Boss | Manager | Employee           |
| ---------------------------- | ---- | ------- | ------------------ |
| `POST /api/orders/create`    | ✅   | ✅      | ❌                 |
| `PUT /api/items/:id/price`   | ✅   | ❌      | ❌                 |
| `GET /api/metrics/velocity`  | ✅   | ❌      | ❌                 |
| `POST /api/eod/commit`       | ✅   | ❌      | ❌                 |
| `GET /api/orders/:id`        | ✅   | ✅      | ✅ (only assigned) |
| `PUT /api/orders/:id/status` | ✅   | ✅      | ❌                 |
| `GET /api/system/backup`     | ✅   | ❌      | ❌                 |
| `POST /api/attendance/mark`  | ✅   | ✅      | ❌                 |

---

## 5. Data Flow: Key Scenarios

### 5.1 Scenario: Bill Creation to Stock Deduction

```
Timeline: 2:00 PM to 9:30 PM

[2:15 PM] Bill Creation
    Manager creates bill: 5kg Rice
    Backend: Save to orders, order_items (status="pending")
    Employees notified (WebSocket)

[2:20 PM] Fulfillment Begins
    Employee checks: "Rice - 5kg ✓"

[2:25 PM] Manager Marks Complete
    Manager: "Mark Order Complete"
    Payment: "Cash ₹200"
    Backend:
        - orders.status = "completed"
        - INSERT temp_stock_ledger (rice, 5kg, NOT committed)
        - Print receipt

[4:00 PM] Another Bill (Same Item)
    Manager: 2kg Rice
    Backend: INSERT temp_stock_ledger (rice, 2kg, NOT committed)

[9:00 PM] EOD Review
    Boss sees:
        - Temp ledger shows: 7kg Rice total deduction
        - Permanent inventory: Rice = 250kg (UNCHANGED)

[9:30 PM] EOD Commit
    Boss clicks "Commit EOD"
    Backend:
        - SUM temp_stock_ledger: 7kg
        - inventory[Rice] = 250kg - 7kg = 243kg (COMMITTED)
        - Mark temp_ledger records as committed
        - Lock daily ledger

Result: Permanent stock updated ONLY once per day
```

### 5.2 Scenario: Credit (Udhaar) Order

```
[2:30 PM] Bill with Credit Payment
    Customer: "Rajesh Kumar" | Phone: "98765-43210"
    Items: ₹500 worth
    Payment Method: "CREDIT"

    Backend:
        ├─► Save orders (status="completed", paymentMethod="credit")
        ├─► INSERT customer_ledger:
        │   - customerPhone: "98765-43210"
        │   - orderId: 45
        │   - amountOwed: 500
        │   - amountPaid: 0
        │   - outstanding: 500
        └─► Print receipt (with "CREDIT" indicator)

[3 Days Later] Customer Pays ₹300
    Boss: "Record Payment" for Rajesh Kumar

    Backend:
        ├─► UPDATE customer_ledger:
        │   - amountPaid: 300
        │   - outstanding: 200
        └─► Payment recorded in financial ledger

[7 Days Later] Customer Pays Remaining ₹200
    Backend:
        └─► outstanding: 0 (settled)
```

---

## 6. Redundancy & Disaster Recovery Architecture

### 6.1 RAID 1 Mirroring

```
Server Hardware:
┌─────────────────────────────┐
│  Mother Board               │
│  ┌───────────┬───────────┐  │
│  │  SSD #1   │  SSD #2   │  │
│  │ (256GB)   │ (256GB)   │  │
│  │  RAID 1   │  RAID 1   │  │
│  └─────┬─────┴─────┬─────┘  │
│        │ Mirrored  │         │
│        └─────┬─────┘         │
│          PostgreSQL          │
│         Database & Logs      │
└─────────────────────────────┘

Write Operation:
    Request → Write to SSD #1 → Write to SSD #2 → ACK
    If SSD #1 fails: SSD #2 continues operation
    If SSD #2 fails: SSD #1 continues operation

Recovery: Rebuild from remaining SSD (automatic)
```

### 6.2 Manual Backup Strategy

```
[Daily After EOD]
    Boss: Plug USB Drive → Click "Backup Data"

    Backend:
    ┌─────────────────────────────────┐
    │ 1. Read entire PostgreSQL DB    │
    │ 2. Generate SQL dump            │
    │ 3. Encrypt with AES-256         │
    │ 4. Write to USB as:             │
    │    backup_2026-02-26_21-00.sql  │
    │    (Encrypted file)             │
    └─────────────────────────────────┘

    Physical Ownership:
    ├─ Boss stores USB drives securely
    ├─ Rotate between 3-4 USB drives
    └─ Keep off-site copies (home safe)
```

### 6.3 Recovery Scenarios

**Scenario A: SSD Failure (RAID 1 covers)**

```
Failure Detected → System auto-boots from SSD #2
Action: Replace failed SSD → Automatic RAID rebuild
Downtime: None (users don't notice)
Data Loss: 0%
```

**Scenario B: Database Corruption**

```
Boss notices: Inventory numbers look wrong
Action: Retrieve USB backup
Recovery:
    1. Stop PostgreSQL
    2. Delete corrupted database
    3. Run: pg_restore backup_2026-02-26_21-00.sql
    4. Start PostgreSQL
Downtime: 10 minutes
Data Loss: Anything created after last backup
```

**Scenario C: Catastrophic Server Failure**

```
Server hardware dies completely
Action:
    1. Get new Mini-PC (same spec)
    2. Install Ubuntu Linux + PostgreSQL + Node.js
    3. Restore from USB backup
    4. Start application
Downtime: 1-2 hours
Data Loss: 0% (recovery from backup)
```

---

## 7. Network & Communication Protocol

### 7.1 Local Network Security

```
Shop Wi-Fi Router
├─ SSID: "VyaparSync-Shop"
├─ Password: [Strong password, changed quarterly]
├─ MAC Filtering: [Optional] Only approved device MACs allowed
└─ WPA3 Encryption: (or WPA2 if older devices)

Client Device Authentication:
    Device connects → Requests API
    Backend checks: Is MAC in device_whitelist?
    If NO: 401 Unauthorized (Boss must approve first)
    If YES: Proceed with JWT auth
```

### 7.2 WireGuard VPN for Remote Employees

Employees at warehouses or storage locations 5-10km from the main shop connect via a self-hosted WireGuard VPN:

```
┌─────────────────────────────────────────────┐
│   WireGuard VPN Architecture                │
├─────────────────────────────────────────────┤
│                                             │
│  Local Server (Mini-PC)                     │
│  ├─ WireGuard daemon listens on port 51820  │
│  ├─ Assigns VPN subnet: 10.0.0.0/24        │
│  │    Boss/Manager (LAN): skip VPN          │
│  │    Employee A (remote): 10.0.0.11       │
│  │    Employee B (remote): 10.0.0.12       │
│  └─ Public key per device, registered once  │
│                                             │
│  Employee Phone (Android, 5-10km away)      │
│  ├─ WireGuard app installed                 │
│  ├─ VPN config: Endpoint = shop's public IP │
│  ├─ Establishes encrypted tunnel            │
│  └─ Socket.io connects to 10.0.0.1:3000    │
│     (VPN private IP of the server)          │
│                                             │
└─────────────────────────────────────────────┘
```

**Internet dependency:** Minimal. Only the VPN handshake and keepalive (~few KB/hr per device).
Billing, EOD, printing, and LAN-device operations are 100% offline.

**Key management:**

- Boss registers each employee's WireGuard public key at onboarding
- Revoking access = removing the key from server config (instant)
- No passwords to manage; keys are cryptographic

### 7.3 Data in Transit

```
Web/Mobile Client
    │
    ├─► HTTPS Request (Self-Signed Certificate)
    │   Host: https://local-server.local:3000
    │   Path: /api/orders/create
    │   Headers: {
    │     Authorization: Bearer <JWT_TOKEN>,
    │     Content-Type: application/json
    │   }
    │
    ▼
Local Server (Express)
    │
    ├─► Certificate Validation (Self-Signed)
    ├─► Decrypt TLS payload
    ├─► Extract JWT from Authorization header
    └─► Process request
```

### 7.4 WebSocket Real-Time Events

```
Client establishes persistent WebSocket connection:
    socket.io connects to wss://local-server.local:3000/socket.io
    (or wss://10.0.0.1:3000/socket.io for VPN-connected employees)

Events pushed by server:
    - 'new_order':          { orderId, items, customerName, isDelivery }
    - 'checklist_update':   { orderId, itemId, isChecked }
    - 'order_fulfilling':   { orderId, deliveryAssigneeId }   ← delivery orders
    - 'order_completed':    { orderId, fulfilledBy: [...] }
    - 'eod_complete':       { ledgerLocked: true }

No external cloud services (Firebase, AWS) involved
```

### 7.5 Notification Lifecycle & Auto-Deletion

```
New Order Created
        │
        ├─► Server inserts into `notifications` table:
        │   { id, userId, orderId, content, createdAt, expiresAt = createdAt + 7 days }
        │
        ├─► Socket.io broadcasts 'new_order' to all connected employees
        │
        │   [7 days pass]
        │
        ├─► CRON job (runs daily at 2:00 AM):
        │   DELETE FROM notifications WHERE expiresAt < NOW()
        │
        └─► Mobile app on next launch:
            DELETE local notifications WHERE expiresAt < NOW()
            (client-side cleanup for offline-cached notifications)
```

---

## 8. Scalability Considerations

### 8.1 Current Limits

| Resource         | Limit  | Justification                                        |
| ---------------- | ------ | ---------------------------------------------------- |
| Concurrent Users | 50     | Wi-Fi router limits; typical shop has 5-10 employees |
| Daily Orders     | 2000   | Index on orders.created_at handles queries           |
| Database Size    | 10GB   | 3 years of data; query response <200ms               |
| Response Time    | <200ms | PostgreSQL on local network; no internet latency     |

### 8.2 Optimization Strategies

**Current Phase (Launch):**

- Basic indexes on frequently accessed columns
- PostgreSQL connection pooling (pgBouncer)

**Future Phase (if needed):**

- Materialized views for velocity calculations
- Query caching layer (Redis, if database outgrows hardware)
- Database query logging and optimization

**NOT Planned:**

- Sharding (single-shop system doesn't need it)
- Replication (RAID 1 provides redundancy)
- Distributed caching (local network, no latency issues)

---

## 9. Security Considerations

### 9.1 Data Protection

| Layer             | Protection                                                     |
| ----------------- | -------------------------------------------------------------- |
| **In Transit**    | HTTPS with self-signed cert (only on local network)            |
| **At Rest**       | Passcodes hashed (bcrypt); other data plaintext (owner choice) |
| **Backup**        | AES-256 encryption before USB storage                          |
| **Device Access** | MAC address whitelisting + JWT authentication                  |

### 9.2 Attack Surface Mitigation

```
Potential Attack                 Mitigation
─────────────────────────────────────────────────
External internet access         App ports firewalled; only VPN port 51820 open
Cloud data breach                No cloud services; local storage only
Employee unauthorized access     Device whitelist + role-based auth
Lost/stolen employee device      Revoke WireGuard key → instant VPN lockout
VPN traffic interception         WireGuard ChaCha20+Poly1305 encryption (end-to-end)
USB backup stolen                AES-256 encrypted backup file
Unauthorized app installation    APK signing + device whitelist
SQL injection                    Drizzle ORM parameterized queries
Network sniffing                 HTTPS (self-signed, sufficient for LAN/VPN)
Notification data retention      7-day TTL auto-purge from server and device
```

### 9.3 Zero Telemetry Policy

All external requests BLOCKED in configuration:

```javascript
// In backend configuration
const EXTERNAL_SERVICES = {
  firebase: null, // Disabled
  googleAnalytics: null, // Disabled
  sentryIO: null, // Disabled
  mixpanel: null, // Disabled
  intercom: null, // Disabled
};
```

---

## 10. Deployment Architecture

### 10.1 Local Server Setup

```
Step 1: Hardware Procurement
    - Mini-PC: Intel i3, 8GB RAM, 256GB SSD × 2
    - Wi-Fi Router: 802.11ac, 100+ Mbps
    - Thermal Printer: ESC/POS compatible
    - UPS: 500VA (for graceful shutdown)

Step 2: OS Installation
    - Ubuntu Linux 22.04 LTS
    - PostgreSQL 15
    - Node.js 18 LTS

Step 3: Application Deployment
    - Clone repo to /opt/vyapar-sync/
    - npm install
    - npm run build (React production build)
    - systemd service starts Node.js on boot

Step 4: RAID 1 Configuration
    - mdadm to mirror SSD #2 to SSD #1
    - Monitor with: cat /proc/mdstat

Step 5: Backup Script
    - Cron job: Daily encrypted backup script
    - Manual trigger: Boss dashboard button
```

### 10.2 Client App Deployment (Android)

```
Developer Flow:
    1. React code compiled with Vite
    2. Capacitor builds Android APK
    3. APK signed with company key
    4. APK distributed to Boss
    5. Boss sideloads to employee phones (via USB or file transfer)

No Google Play Store (for privacy)
No auto-updates (manual by Boss)
```

---

## 11. Monitoring & Maintenance (No External Telemetry)

### 11.1 Local Health Checks

```
Boss Dashboard Features:
├─ Server Status: "Online", CPU %, RAM %, Disk %
├─ Database Size: Current GB, Backup status
├─ Recent Orders: Last 10 completed orders
├─ Sync Status: Last EOD time, ledger locked?
├─ Device Status: Connected employees/managers
└─ Alerts: Manual email (no external calls)
    ├─ "Low Disk Space" (when <20GB free)
    ├─ "Failed Backup" (USB not detected)
    └─ "Database Size Alert" (when >8GB)
```

### 11.2 Maintenance Tasks

**Daily:**

- Boss verifies EOD ledger
- Manual backup created

**Weekly:**

- Check server health from dashboard
- Verify RAID status: `cat /proc/mdstat`

**Monthly:**

- Test recovery from backup (simulate failure)
- Review system logs for errors

**Quarterly:**

- Password changes for users
- Wi-Fi router password update

---

## 12. Future Scalability (Multi-Location)

If the owner expands to a second shop, here's the architecture:

```
Branch A (Delhi)              Branch B (Bangalore)
┌────────────────┐            ┌────────────────┐
│ Server A       │            │ Server B       │
│ PostgreSQL A   │            │ PostgreSQL B   │
│ (Independent)  │            │ (Independent)  │
└────────┬───────┘            └────────┬───────┘
         │                             │
         └──── WireGuard VPN ──────────┘
               (Secure tunnel, manual setup)
               Data sync via scripts (optional)

Each branch is autonomous
Headquarters can run sync jobs to consolidate metrics
```

This is **NOT** the primary deployment model; it's for future reference only.
