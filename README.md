# Shop Management System (Vyapar-Sync)

**Local-First, Privacy-First Shop Management for Indian Family Businesses**

A secure, air-gapped inventory and billing management system designed exclusively for single-store retail and wholesale businesses. Zero cloud dependency, zero government/corporate access, complete data sovereignty.

## 🎯 Quick Links to Documentation

### 📋 Core Documentation

- **[System Requirements Specification (SRS)](./docs/SRS.md)** - Complete functional and non-functional requirements
- **[Architecture & Technical Design](./docs/architecture/ARCHITECTURE.md)** - System design, data flows, redundancy strategy
- **[Database Schema](./docs/database/SCHEMA.md)** - PostgreSQL schema, Drizzle ORM implementation, SQL queries
- **[API & WebSocket Endpoints](./docs/api/ENDPOINTS.md)** - Complete REST API and real-time event specification
- **[Project Progress & Timeline](./docs/PROGRESS.md)** - Development roadmap, current status, acceptance criteria

### 🛠️ Quick Start

**Technology Stack:**

- **Frontend:** React.js + Vite (web) + Capacitor.js (Android)
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL 15 + Drizzle ORM
- **Real-Time:** Socket.io (WebSockets for local network)
- **Hardware:** ESC/POS thermal printers, RAID 1 redundancy, local Mini-PC server

---

## 📖 What This System Does

### Core Features

1. **Point of Sale (POS) & Dynamic Billing**
   - Create customer orders with dynamic pricing overrides
   - Apply flat discounts before checkout
   - Support multiple payment modes: Cash, UPI, Credit (Udhaar)

2. **Inventory Management**
   - Track stock across multiple warehouse locations
   - Custom units of measurement (kg, pieces, liters, dozens, etc.)
   - Real-time inventory visibility

3. **Order Fulfillment Workflow**
   - Employees receive live order notifications on Android
   - Interactive fulfillment checklist for physical packing
   - Manager/Boss approval before stock deduction

4. **End of Day (EOD) Reconciliation**
   - Temporary stock ledger prevents database locks during peak hours
   - Single boss-authorized commit applies all day's transactions
   - Immutable daily ledger after EOD lock

5. **Customer Credit (Udhaar) Management**
   - Track customer credit balances and outstanding amounts
   - Payment settlement recording
   - Credit ledger history

6. **Business Metrics & Restock Alerts**
   - Automatic 7/14/30-day sales velocity calculation
   - Smart "Recommended to Buy" dashboard based on demand
   - Daily sales summaries and payment breakdown

7. **Employee Attendance Tracking**
   - Simple check-in/check-out system
   - Daily attendance reports

8. **Physical Receipt Printing**
   - Bluetooth/LAN thermal printer integration (ESC/POS)
   - Instant receipt generation on order completion

---

## 🔐 Privacy & Security First

### Zero Cloud, Zero External Access

- ✅ No cloud storage, no external APIs, no telemetry
- ✅ All data stays on-premises in encrypted form
- ✅ No government agency or corporate access possible
- ✅ Owner maintains physical custody of all backups

### Data Redundancy & Recovery

- **RAID 1 Mirroring:** Two identical drives mirrored for zero data loss
- **Manual Encrypted Backups:** Owner-controlled USB backup with AES-256 encryption
- **Recovery in 5-10 minutes:** Full restoration from backup in case of hardware failure

### Multi-Level Authentication

- **Device Whitelisting:** MAC address authentication
- **JWT Tokens:** 24-hour session tokens with bcrypt passcode hashing
- **Role-Based Access:** Separate permissions for Boss, Manager, Employee

---

## 🚀 Getting Started

### Prerequisites

- Linux server (Ubuntu 22.04 LTS recommended)
- PostgreSQL 15 installed
- Node.js 18 LTS
- Wi-Fi router with local network connectivity
- Mini-PC hardware (Intel i3, 8GB RAM, 256GB SSD × 2 for RAID)

### Installation Overview

1. Clone repository
2. Install dependencies: `npm install`
3. Initialize PostgreSQL and run migrations
4. Configure local server address
5. Build React frontend: `npm run build`
6. Start backend server: `npm run dev`
7. Deploy Android APK to employee devices via sideloading

See [docs/PROGRESS.md](./docs/PROGRESS.md) for detailed setup steps (coming in Phase 1).

---

## 📊 Project Status

**Current Phase:** 🟡 **PLANNING PHASE - Documentation Complete**

| Phase                           | Duration    | Status      |
| ------------------------------- | ----------- | ----------- |
| Phase 1: Backend Infrastructure | Weeks 1-4   | ⏳ Starting |
| Phase 2: Web Frontend           | Weeks 5-8   | 📋 Planned  |
| Phase 3: Real-Time & Mobile     | Weeks 9-11  | 📋 Planned  |
| Phase 4: Mobile App (Capacitor) | Weeks 12-14 | 📋 Planned  |
| Phase 5: Testing & Deployment   | Weeks 15-17 | 📋 Planned  |

**Estimated Completion:** Mid-May 2026

---

## 📋 System Architecture at a Glance

```
┌─────────────────────────────────────────────────────┐
│           LOCAL AREA NETWORK (LAN)                  │
│         No Internet Required - Fully Offline         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🖥️ Boss Desktop (React Web)                        │
│  📱 Manager Phone (Capacitor Android)               │
│  📱 Employee Phone (Capacitor Android)              │
│           ↓                                          │
│  ┌──────────────────────────────────────────────┐   │
│  │  LOCAL SERVER (Mini-PC)                      │   │
│  │  ├─ Node.js + Express Backend                │   │
│  │  ├─ PostgreSQL Database (RAID 1)             │   │
│  │  ├─ Socket.io Real-Time Events               │   │
│  │  └─ Backup Management                        │   │
│  └──────────────────────────────────────────────┘   │
│           ↓                                          │
│  🖨️ Thermal Printer (ESC/POS via Bluetooth)        │
│  💾 USB Backup Drive (Owner Controlled)             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Target Customer

**Who this is built for:**

- Single-store family-run retail shops (grocery, general stores)
- Shops with 1 boss + 2-15 managers/employees
- Businesses with 1-3 warehouse locations
- Shops handling 100-2000 orders/day
- Businesses that need complete data privacy and local control

**Who this is NOT for:**

- Multi-location chains (each shop needs independent server)
- Large enterprises
- Businesses requiring cloud sync across locations
- iOS-only deployments

---

## 💼 Business Benefits

| Aspect                 | Benefit                                                        |
| ---------------------- | -------------------------------------------------------------- |
| **Data Privacy**       | Complete control; no external company can access data          |
| **Cost Effective**     | One-time hardware investment (~₹30,000); no monthly cloud fees |
| **Offline Resilience** | Works without internet; power outages don't stop business      |
| **Trust Building**     | Transparent, local-only system builds customer confidence      |
| **Fast Billing**       | <200ms response times on local network; no internet latency    |
| **Compliance**         | No mandatory data sharing; audit-proof local records           |

---

## 🔧 Development Stack Rationale

### Why These Tools?

**React.js**

- Single codebase for web and mobile (via Capacitor)
- Large ecosystem and community support
- Easy to learn for Indian developers

**Node.js + Express**

- Lightweight, perfect for local hardware
- Non-blocking I/O handles concurrent orders well
- Zero licensing cost (open source)

**PostgreSQL**

- ACID compliance (critical for financial ledgers)
- Handles concurrent transactions without locking issues
- Runs efficiently on local hardware

**Drizzle ORM**

- Type-safe SQL generation (prevents SQL injection)
- Better performance than Prisma for local deployments
- Smaller bundle size

**Capacitor.js**

- Bridge between web app and native Android APIs
- Enables Bluetooth printer access and device info
- No need to rewrite app in Kotlin/Java

---

## 📄 Documentation Files

```
docs/
├── SRS.md                          # System Requirements Spec (8,000+ lines)
├── PROGRESS.md                     # Project timeline and status
├── architecture/
│   └── ARCHITECTURE.md             # Technical design and data flows
├── database/
│   └── SCHEMA.md                   # PostgreSQL schema + SQL examples
├── api/
│   └── ENDPOINTS.md                # Complete API reference
└── features/
    └── (Module-specific docs coming in Phase 1)
```

---

## 🤝 Contributing & Development

### Getting Code Ready for Development

1. Read [docs/SRS.md](./docs/SRS.md) for requirements
2. Review [docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) for design
3. Check [docs/database/SCHEMA.md](./docs/database/SCHEMA.md) for database structure
4. Refer to [docs/api/ENDPOINTS.md](./docs/api/ENDPOINTS.md) for API contracts
5. Track progress in [docs/PROGRESS.md](./docs/PROGRESS.md)

### Testing Strategy

- Unit tests: Jest + React Testing Library (>80% coverage target)
- Integration tests: Supertest for APIs
- E2E tests: Cypress for critical workflows
- Security tests: Verify zero external API calls

---

## ⚠️ Important Notes

### Current Status (Feb 26, 2026)

- ✅ Requirements and design finalized
- ✅ Architecture documented
- ✅ Database schema designed
- ✅ API contracts specified
- ❌ No code written yet (planning phase complete)

### Not Included (Out of Scope)

- ❌ GST/TDS tax calculations
- ❌ Multi-location central coordination
- ❌ iOS app (Android only)
- ❌ Supplier/PO management
- ❌ Advanced payroll system

These can be added in future phases if needed.

---

## 📞 Support & Questions

For questions about:

- **Architecture:** See [ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)
- **Database Design:** See [SCHEMA.md](./docs/database/SCHEMA.md)
- **API Usage:** See [ENDPOINTS.md](./docs/api/ENDPOINTS.md)
- **Project Timeline:** See [PROGRESS.md](./docs/PROGRESS.md)
- **Requirements:** See [SRS.md](./docs/SRS.md)

---

## 📜 License

(To be determined during Phase 1)

---

## 🎉 Acknowledgments

Built with care for Indian small business owners who value **privacy, security, and local control**.

now with this plan and basic tech stack given to be drizzle/prisma and react, with other required stacks according to yourself, first make me the complete documentation of what is to be made, what will be the features, how scalable it would be, how would you keep backups, send notifications, dont use cloud storage but only private storage etc, as the product is security and redundancy first, to gain the trust of local shopkeepers, give complete srs

i dont think that there is need of fulfilling status, and for order fulfillment workflow, once a order is created by owner/manager, and its status is completed, only then the transaction is maintained by the system to be later verified at the end of the day, to make the permanent changes, also allow for a way for owner/manager to define how the payment of order is done, by upi/cash/credit etc and accordingly be sent to the ledger/history, in metrics also show metric for boss on recommendation for how much stock to buy based on demand, for order fulfillment, there must be checkboxes or something that allows to show what items are given, also allow backup to local server to be handle by the owner for now, later we can do central server or other ways, but we want that, no govt or large corporation gets our data, so no govt agency can get our data, and the main customer of software will only be businessman with only one shop and maybe some warehouses

# Gemini Response 1

Here is a comprehensive System Requirements Specification (SRS) and architecture plan for the Shop Management System, tailored specifically for small, family-run Indian businesses. As a senior developer, I have structured this to prioritize your core requirements: **zero cloud dependency, maximum data security, local network reliability, and a highly intuitive workflow.**

---

# System Requirements Specification (SRS): "Vyapar-Sync" (Local Shop Management System)

## 1. Introduction

**Purpose:** To provide a secure, fully localized, and redundant shop management platform that handles inventory, point-of-sale (POS) billing, order fulfillment, and employee attendance without relying on cloud infrastructure.
**Target Audience:** Indian family-run retail and wholesale businesses requiring strict data privacy, offline capabilities, and flexible pricing controls.

## 2. Proposed Technology Stack

Given your constraints (React, Prisma/Drizzle, No Cloud, Android capability), here is the optimal, production-ready stack:

- **Frontend (Web & Android):** **React.js** with **Vite**. To make it run natively on Android devices (phones/tablets used by employees), we will wrap the React app using **Capacitor.js**. This allows the web app to access native device features (like Bluetooth for printers) while maintaining a single codebase.
- **Backend:** **Node.js** with **Express.js**. Lightweight, highly performant, and pairs perfectly with a local server setup.
- **Database:** **PostgreSQL**. It is highly reliable, ACID-compliant (crucial for ledger/financial data), and handles concurrent local connections flawlessly.
- **ORM:** **Drizzle ORM**. I recommend Drizzle over Prisma for edge/local deployments. It is faster, has zero cold-start issues, generates extremely clean SQL, and is less resource-heavy for a small local server.
- **Real-time Notifications:** **Socket.io** (WebSockets). Since Firebase Cloud Messaging (FCM) uses the cloud, we will use local WebSockets to push notifications directly over the shop's local Wi-Fi router.

## 3. User Roles & Access Control

- **Boss / Owner:** Complete administrative access. Can add/edit items, define units, override prices indefinitely, view business metrics, manage ledgers, and execute the End of Day (EOD) sync.
- **Manager:** Can create bills, apply authorized discounts, change order statuses (Completed, Partial, Delayed), mark employee attendance, and view specific warehouse stocks.
- **Employee:** Can view incoming order notifications, fulfill physical stock packing, and view their own attendance. No access to financial metrics or price editing.

## 4. Core Features & Functional Requirements

### 4.1. Inventory & Storage Management

- **Dynamic Item Master:** Owners can add items, define custom units (e.g., Kgs, Grams, Pieces, Dozens, Bags), and set base prices.
- **Multi-Storage Locations:** Define arbitrary storage units (e.g., "Front Shop", "Godown 1", "Basement"). Stock is tracked per location.

### 4.2. Point of Sale (POS) & Billing

- **Custom Bill Creation:** Capture Customer Name, Contact, and Items.
- **Dynamic Pricing & Discounts:** The Boss/Manager can override the base price of any item on the fly for loyal customers and apply a flat discount amount before generating the final total.
- **Tax-Free Architecture:** Currently hardcoded to exclude GST/Taxes as requested, keeping the interface uncluttered.

### 4.3. Order Fulfillment Workflow & Notifications

- When a bill is generated, an order is created.
- **Local Push Notifications:** Socket.io instantly pings the Android devices of Managers and Employees on the local network.
- **Status Tracking:** Only Boss/Managers can update the state of the order: _Pending -> Fulfilling -> Partial / Delayed / Changes Made -> Completed_.

### 4.4. Temporary Stock & EOD (End of Day) Verification

- **Day-Time Operations:** As items are sold, they are deducted from a `Temporary_Stock_Ledger`. The main inventory remains untouched during chaotic shop hours to prevent database locking and allow for order corrections.
- **EOD Sync:** After closing, the Boss reviews the day's transactions. With one click, the system reconciles the `Temporary_Stock_Ledger` and permanently commits the deductions to the main `Warehouse_Stock` tables.

### 4.5. Ledger & Analytics

- **Order History:** Immutable ledger of all completed orders, searchable by date, customer, or order ID.
- **Business Metrics:** Dashboards for the Boss showing daily sales, top-moving items, and low-stock alerts.

### 4.6. Physical Integrations & Utility

- **Thermal Printing:** The React/Capacitor app will communicate via ESC/POS protocol (Bluetooth or local LAN) to a standard 2-inch or 3-inch thermal printer for instant physical receipts.
- **Attendance System:** Simple check-in/check-out UI for Managers to mark staff presence.

## 5. Database Architecture (High-Level Drizzle Schema)

- **`users`**: id, name, role (ENUM: boss, manager, employee), passkey.
- **`units`**: id, name (e.g., kg, piece), abbreviation.
- **`storage_locations`**: id, name (e.g., Shop, Godown 1).
- **`items`**: id, name, default_price, unit_id.
- **`inventory`**: item_id, location_id, current_quantity.
- **`temp_inventory_ledger`**: id, item_id, location_id, quantity_locked, order_id, status.
- **`orders`**: id, customer_name, customer_phone, total_amount, discount, final_amount, status (ENUM), created_by.
- **`order_items`**: id, order_id, item_id, quantity, overridden_price.
- **`attendance`**: id, user_id, date, status, marked_by.

## 6. Infrastructure: Security, Redundancy & Backups (No Cloud)

Gaining the trust of a local shopkeeper means the system must survive power cuts, hardware failures, and internet outages.

### 6.1. The "Local Server" Setup

- **Hardware:** A standard Mini-PC (like an Intel NUC) or a standard desktop PC kept securely in the owner's office acts as the central server.
- **Local Network:** A high-quality Wi-Fi router connects the server, the Android phones (via Wi-Fi), and the local thermal printers. **No active internet connection is required for the system to function.**

### 6.2. Redundancy & Data Protection

- **RAID 1 Configuration:** The local server must have two physical Hard Drives / SSDs configured in RAID 1 (Mirroring). If one drive fails due to a power surge, the exact copy is instantly available on the second drive, ensuring zero data loss.
- **Automated Local Backups:** A CRON job runs at 2:00 AM daily, dumping the PostgreSQL database. This encrypted SQL dump is automatically pushed to a secure, external USB drive permanently plugged into the server.

### 6.3. Security

- **Network Isolation:** Because the system is entirely local (LAN), it is immune to external web scraping, DDoS attacks, or cloud data breaches.
- **Device Authentication:** Android apps must be registered to the local server MAC address. Even if an employee connects to the Wi-Fi with a personal phone, they cannot access the API without the Boss's device approval.

## 7. Scalability Limits

- **Concurrency:** A local PostgreSQL setup on a basic i3/8GB RAM Mini-PC can handle thousands of concurrent queries. For a single shop with up to 50 employees/managers pushing orders simultaneously, this system will experience zero lag.
- **Multi-Shop Scalability:** Because this is a strictly local system, if the owner opens a _second_ branch across town, they will need a separate server there. Syncing the two branches _without_ the cloud would require setting up a secure VPN tunnel (like WireGuard) between the two routers.

---

This blueprint covers all your requirements while providing a rock-solid, privacy-first technical foundation.

Would you like me to write out the exact Drizzle ORM schema definitions (in TypeScript) for the temporary EOD stock logic, as that is the most complex part of the database architecture?

# Gemini Response 2

i dont think that there is need of fulfilling status, and for order fulfillment workflow, once a order is created by owner/manager, and its status is completed, only then the transaction is maintained by the system to be later verified at the end of the day, to make the permanent changes, also allow for a way for owner/manager to define how the payment of order is done, by upi/cash/credit etc and accordingly be sent to the ledger/history, in metrics also show metric for boss on recommendation for how much stock to buy based on demand, for order fulfillment, there must be checkboxes or something that allows to show what items are given, also allow backup to local server to be handle by the owner for now, later we can do central server or other ways, but we want that, no govt or large corporation gets our data, so no govt agency can get our data, and the main customer of software will only be businessman with only one shop and maybe some warehouses

That makes perfect sense. Simplifying the order states removes unnecessary friction for a fast-paced retail environment, and tightening the data sovereignty aspect aligns exactly with the trust model required for this demographic. If the target is strictly single-shop owners who are highly protective of their business data, an "air-gapped" philosophy is the best selling point.

Here is the revised architectural plan incorporating your updates for workflow, payment tracking, predictive metrics, and strict manual backups.

---

### 1. Refined Order & Fulfillment Workflow

We will strip out the "Fulfilling" status and introduce a more tactile, checklist-based UI for the staff on the floor.

- **Simplified Status Cycle:** Orders will strictly follow a simplified state machine: `Pending` $\rightarrow$ `Completed` (with edge cases for `Partial`, `Delayed`, or `Changes Made`).
- **The "Checklist" UI:** When an order is pushed to the employees' Android app, it will display as a checklist. As the employee or manager physically gathers the items (e.g., 5kg Sugar, 2 packets of Tea), they tap a checkbox next to each item.
- **Completion Trigger:** Only when all checkboxes are ticked can the Manager or Boss mark the order as `Completed`.

### 2. Payment Tracking & Ledger Integration

Since this is a local business, handling "Udhaar" (Credit) and multiple payment streams is critical.

- **Payment Modes:** During the final step of order creation (or upon marking it `Completed`), the Boss/Manager must select the payment method: **Cash, UPI, Credit (Udhaar), or Mixed** (e.g., partially Cash, partially UPI).
- **Ledger Routing:** * Completed orders marked as *Cash* or *UPI\* go directly to the daily sales ledger.
- Orders marked as _Credit_ are tagged to the specific customer's profile, creating an outstanding balance that can be tracked and settled later.

### 3. The "Completed-Only" EOD (End of Day) Queue

We will adjust the temporary table logic so that the database is never cluttered with abandoned or pending orders.

- **The EOD Staging Area:** Only orders that have reached the `Completed` status are logged into the `Temporary_Stock_Ledger`.
- **Final Verification:** At closing time, the Boss opens the EOD dashboard. They will see a clean list of all _completed_ transactions and the total calculated stock deductions. With one click, this temporary ledger is merged into the permanent `Warehouse_Stock` table, and the daily financial ledger is locked.

### 4. Predictive "To-Buy" Metrics (Demand Forecasting)

To give the Boss actionable business intelligence without relying on cloud-based AI, we will use local SQL queries to calculate stock velocity.

- **Velocity Calculation:** The system will analyze the average daily units sold for each item over the last 7, 14, and 30 days.
- **Smart Recommendations:** If an item's current stock falls below its calculated 7-day velocity (e.g., the shop sells 10 bags of rice a day, and only 60 are left), it populates a **"Recommended to Buy"** dashboard.
- This metric ensures the Boss never under-stocks high-demand items or over-invests in slow-moving inventory.

### 5. Absolute Data Sovereignty & Manual Backups

Since the primary selling point is that **no government agency, tax authority, or corporation** can access this data, we will enforce strict local-only protocols.

- **Zero External Telemetry:** The Node.js backend will be explicitly configured to never ping external servers—no cloud crash reporting, no analytics trackers, nothing.
- **Owner-Controlled Manual Backups:** Instead of automated cron jobs that might feel opaque to the owner, we will build a "Backup Data" button right into the Boss's dashboard.
- **The Workflow:** At the end of the day, the Boss plugs a standard USB flash drive into the local server (or downloads directly to their secure admin device). Clicking the button generates an encrypted `.sql` dump of the entire database, which is saved instantly. They maintain physical custody of their backups.

---

This revised plan tightens the loop on operations and doubles down on the privacy-first mandate.

Would you like me to write out the updated **Drizzle ORM schema** to support the new payment methods, checklist items, and the modified EOD ledger workflow?

# Response 3

Here is the complete, professional System Requirements Specification (SRS) document, formatted and ready for you to share with your client or stakeholders.

---

# System Requirements Specification (SRS)

## Project Name: Local-First Shop Management System

**Document Version:** 1.0

**Target Environment:** Local Area Network (LAN) / Air-Gapped Local Server

---

### 1. Introduction

**1.1 Purpose**
This document outlines the software requirements for a highly secure, localized Shop Management System designed specifically for single-store, family-run retail and wholesale businesses. The system manages inventory, point-of-sale (POS) billing, order fulfillment, employee attendance, and predictive stock metrics.

**1.2 Scope**
The software functions entirely offline on a local network, ensuring absolute data sovereignty. It eliminates reliance on cloud infrastructure, preventing external access by third-party corporations or government entities. Key modules include dynamic pricing, credit (Udhaar) tracking, temporary End-of-Day (EOD) ledgers, and a checklist-based order fulfillment workflow.

---

### 2. Overall Description

**2.1 System Environment**

- **Central Server:** A locally hosted machine (e.g., Mini-PC) situated securely within the shop premises.
- **Client Devices:** Android smartphones/tablets connected via the shop's local Wi-Fi router.
- **External Network:** No active internet connection is required for core operations.

**2.2 User Roles & Access Levels**
| Role | Access Permissions |
| :--- | :--- |
| **Boss (Owner)** | Full administrative access. Can modify item prices globally, view predictive metrics, initiate EOD synchronization, manage manual backups, and oversee all financial ledgers. |
| **Manager** | Can create bills, apply manual discounts, update order statuses, mark employee attendance, and select payment methods. Cannot modify base item configurations or access overall business profit metrics. |
| **Employee** | Restricted access. Can view assigned incoming orders, interact with the physical fulfillment checklist, and view personal attendance. |

---

### 3. Technology Stack

- **Frontend (Web & Mobile):** React.js with Vite, wrapped in Capacitor.js for native Android deployment and hardware access (Bluetooth/Network printers).
- **Backend:** Node.js with Express.js for lightweight, high-performance local API serving.
- **Database:** PostgreSQL, ensuring ACID compliance for strict ledger and inventory accuracy.
- **ORM:** Drizzle ORM for performant, type-safe database queries.
- **Real-Time Communications:** Socket.io (WebSockets) for instant, local-network push notifications without utilizing Firebase or external cloud services.

---

### 4. Functional Requirements

**4.1 Inventory & Storage Management**

- **Dynamic Master Items:** Authorized users can create items with custom units of measurement (e.g., Kgs, Pieces, Dozens, Bags) and define base prices.
- **Multi-Storage Tracking:** Inventory can be assigned and tracked across distinct physical locations (e.g., "Main Shop", "Warehouse 1", "Basement").

**4.2 Point of Sale (POS) & Billing**

- **Custom Bill Generation:** Capture customer name, contact details, and purchased items.
- **Dynamic Pricing:** Boss/Managers can manually override the unit price of any item during bill creation.
- **Discount Application:** Support for applying a flat discount amount to the final bill total.
- **Tax Configuration:** The system operates strictly on raw totals; GST and other automated taxes are excluded from the current scope.
- **Payment Modes:** During order completion, the operator must define the payment method: Cash, UPI, Credit (Udhaar), or a Mixed combination. Credit transactions automatically route to a customer outstanding ledger.

**4.3 Order Fulfillment Workflow**

- **Status Progression:** Orders follow a strict state machine: `Pending` $\rightarrow$ `Completed` (with exceptions for `Partial`, `Delayed`, or `Changes Made`).
- **Checklist UI:** Employees receive order notifications on their Android app formatted as an interactive checklist. Each physical item gathered must be individually checked off.
- **Completion Authorization:** Only the Boss or Manager can finalize an order to the `Completed` state once the fulfillment checklist is verified.

**4.4 Temporary Stock & End of Day (EOD) Reconciliation**

- **Staging Ledger:** Completed orders do not immediately deduct from the primary database to prevent locking issues during peak hours. Deductions are logged in a `Temporary_Stock_Ledger`.
- **EOD Verification:** At closing time, the Boss reviews the daily staging ledger. Upon verification, a single system action permanently commits the temporary ledger deductions to the main `Warehouse_Stock` tables and locks the daily financial ledger.

**4.5 Ledgers & Predictive Analytics**

- **Historical Ledgers:** Immutable, searchable history of all finalized transactions, accessible by date, customer, or payment type.
- **Predictive "To-Buy" Metrics:** The system calculates the local sales velocity of items (average units sold over 7/14/30 days). A dedicated dashboard alerts the Boss to restock items falling below their calculated demand threshold.

**4.6 Utility & Hardware Integrations**

- **Thermal Printing:** Integrated ESC/POS protocol support to print physical receipts instantly upon bill generation via connected local or Bluetooth thermal printers.
- **Attendance Tracking:** Built-in module for Managers to record daily check-in and check-out times for employees.

---

### 5. Non-Functional Requirements

**5.1 Security & Data Sovereignty**

- **Air-Gapped Privacy:** The application includes zero external telemetry, cloud analytics, or crash reporting.
- **Device Whitelisting:** Client applications must be authenticated against the local server; unauthorized devices on the Wi-Fi network cannot access the API.

**5.2 Backup & Recovery**

- **Manual Owner Custody Backups:** The system features a one-click "Backup" interface on the Boss's dashboard. This action generates a fully encrypted `.sql` database dump directly to a physically connected USB drive, ensuring the owner maintains total control over their data footprint.

**5.3 Scalability**

- **Performance:** Designed to support up to 50 concurrent local device connections and thousands of daily transactions with zero network latency, bounded only by the local router's capacity.

---

Would you like me to draft the exact Drizzle ORM schema (in TypeScript) to accompany this document, specifically focusing on how the temporary EOD tables and the payment ledgers are structured?

# Response 4

Here is the complete documentation package for the **Local-First Shop Management System**. I have formatted this as a comprehensive, ready-to-share specification suite. You can copy these sections directly into your documentation tool (like Notion, Confluence, or a Markdown editor).

Besides the SRS, I have included the **Drizzle ORM Database Schema** and the **API & WebSocket Architecture** as the primary supporting documents, as these are critical for the development team to begin implementation.

---

# Document 1: System Requirements Specification (SRS)

## 1. Introduction

**1.1 Purpose**
This document outlines the software requirements for a secure, air-gapped Shop Management System tailored for family-run retail and wholesale businesses. It manages inventory, point-of-sale (POS), order fulfillment, ledgers, and predictive metrics.

**1.2 System Philosophy**
The system is built on a strict "Local-First, Zero-Cloud" architecture. All data remains physically on the premises. This ensures complete data sovereignty, protecting the business from external audits, internet outages, and third-party data mining.

## 2. System Architecture & Environment

- **Central Server:** A local machine (e.g., Intel NUC) running Node.js and PostgreSQL.
- **Local Network:** A dedicated Wi-Fi router connects all devices. No active WAN/Internet connection is required.
- **Client Apps:** React.js web application for the Boss/Desktop, and Capacitor.js-wrapped Android applications for mobile staff.
- **Hardware Integrations:** ESC/POS protocol support for thermal receipt printers via LAN or Bluetooth.

## 3. Core Modules & Functional Requirements

### 3.1 Inventory & Storage

- **Item Master:** Authorized users can define items, base prices, and custom units (e.g., Kgs, Pieces, Dozens).
- **Multi-Storage Tracking:** Inventory quantities are tracked across user-defined locations (e.g., Shop Floor, Warehouse 1).

### 3.2 Point of Sale (POS) & Billing

- **Dynamic Cart:** Capture customer details and add items. Boss/Managers can manually override unit prices on the fly and apply a flat manual discount to the total.
- **Tax Exclusion:** The system explicitly excludes automated GST/Tax calculations, operating on raw totals.
- **Payment Allocation:** Upon order completion, the operator defines the payment split: Cash, UPI, or Credit (Udhaar). Credit amounts are routed to the customer's outstanding ledger.

### 3.3 Fulfillment Workflow

- **Role-Based Access:** Employees receive incoming orders on their mobile devices.
- **Checklist Execution:** Orders appear as an interactive checklist. Employees must physically tick off each item as they pack it.
- **Status Machine:** Orders progress strictly from `Pending` $\rightarrow$ `Completed`. Only a Manager or Boss can mark an order as `Completed` once the checklist is satisfied.

### 3.4 The EOD (End of Day) Staging System

- **Temporary Ledger:** To prevent database locking during peak hours, completed orders log their item deductions in a `Temporary_Stock_Ledger` rather than hitting the main inventory directly.
- **Reconciliation:** At closing time, the Boss reviews the staging ledger. A single authorization commits these temporary deductions to the permanent `Warehouse_Stock` and finalizes the daily financial ledger.

### 3.5 Analytics & Security

- **Predictive Metrics:** The system calculates 7/14/30-day sales velocity to generate a "Recommended to Buy" restock list.
- **Manual Encrypted Backups:** A dedicated interface allows the Boss to plug in a USB drive and export an encrypted `.sql` database dump, maintaining physical custody of their backups.
- **Device Whitelisting:** Client apps must be MAC-authenticated to the local server.

---

# Document 2: Drizzle ORM Database Schema (TypeScript)

This schema defines the critical tables, focusing on the temporary EOD ledger, order tracking, and the credit (Udhaar) system.

```typescript
import {
  pgTable,
  serial,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["boss", "manager", "employee"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "completed",
  "partial",
  "delayed",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "upi",
  "credit",
  "mixed",
]);

// Users & Auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  role: roleEnum("role").notNull(),
  passcode: varchar("passcode", { length: 255 }).notNull(), // Local hash
  macAddress: varchar("mac_address", { length: 50 }), // For device whitelisting
});

// Master Data
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  defaultPrice: decimal("default_price", { precision: 10, scale: 2 }).notNull(),
  unitId: integer("unit_id")
    .references(() => units.id)
    .notNull(),
});

// Permanent Inventory
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  locationId: integer("location_id")
    .references(() => locations.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 })
    .notNull()
    .default("0"),
});

// Order Management
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  priceApplied: decimal("price_applied", { precision: 10, scale: 2 }).notNull(), // Supports manual override
  isChecked: boolean("is_checked").default(false).notNull(), // For the fulfillment checklist
});

// The EOD Staging Area
export const temporaryStockLedger = pgTable("temp_stock_ledger", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  locationId: integer("location_id")
    .references(() => locations.id)
    .notNull(),
  quantityDeducted: decimal("quantity_deducted", {
    precision: 10,
    scale: 3,
  }).notNull(),
  isCommitted: boolean("is_committed").default(false).notNull(), // Flips to true after EOD sync
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Credit (Udhaar) Ledger
export const customerLedger = pgTable("customer_ledger", {
  id: serial("id").primaryKey(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  orderId: integer("order_id").references(() => orders.id),
  amountOwed: decimal("amount_owed", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

# Document 3: API & Event Architecture Overview

Since we are avoiding cloud services (like FCM), the system relies on a combination of REST APIs for data fetching and WebSockets for real-time local network updates.

### REST API Endpoints (Express.js)

- `POST /api/auth/login` - Authenticates user and validates device MAC address.
- `GET /api/inventory/` - Fetches current stock levels.
- `POST /api/orders/create` - Creates a new POS order (Status: Pending).
- `PUT /api/orders/:id/status` - Updates order to Completed/Partial (Triggers WebSocket event).
- `POST /api/eod/commit` - **Critical Endpoint:** Boss-only. Reads all `is_committed = false` records in `temporaryStockLedger`, applies deductions to `inventory`, and sets them to `true`.
- `GET /api/metrics/velocity` - Runs SQL aggregations for the 7/14/30 day demand forecasting.
- `GET /api/system/backup` - Boss-only. Executes `pg_dump` via child process and returns the encrypted `.sql` file stream.

### WebSocket Events (Socket.io)

- **Event:** `new_order`
- _Payload:_ `{ orderId, itemsList }`
- _Listener:_ Mobile devices (Employees). Populates their fulfillment checklist.

- **Event:** `checklist_update`
- _Payload:_ `{ orderId, itemId, isChecked: boolean }`
- _Listener:_ Manager/Boss dashboards. Shows real-time packing progress.

- **Event:** `order_completed`
- _Payload:_ `{ orderId, paymentMethod }`
- _Listener:_ Server. Triggers the insertion into the `temporaryStockLedger`.

---

Would you like me to outline the specific local hardware integration strategy next, particularly how we can configure Capacitor to communicate with standard ESC/POS thermal printers over the local LAN/Bluetooth?
