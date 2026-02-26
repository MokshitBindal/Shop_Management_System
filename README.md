# Shop Management System (Vyapar-Sync)

**Local-First, Privacy-First Shop Management for Indian Family Businesses**

A secure, inventory and billing management system designed exclusively for single-store retail and wholesale businesses. Zero cloud dependency, zero government/corporate access, complete data sovereignty.

---

## 📋 Documentation

| Document                                                 | Description                                                |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| **[SRS](./docs/SRS.md)**                                 | Complete functional and non-functional requirements        |
| **[Architecture](./docs/architecture/ARCHITECTURE.md)**  | System design, data flows, redundancy strategy             |
| **[Database Schema](./docs/database/SCHEMA.md)**         | PostgreSQL schema, Drizzle ORM implementation, SQL queries |
| **[API & WebSocket Endpoints](./docs/api/ENDPOINTS.md)** | Complete REST API and real-time event specification        |
| **[Project Progress](./docs/PROGRESS.md)**               | Development roadmap, current status, acceptance criteria   |

---

## 🛠️ Technology Stack

| Layer         | Choice                                                  |
| ------------- | ------------------------------------------------------- |
| **Frontend**  | React.js + Vite (web) + Capacitor.js (Android)          |
| **Backend**   | Node.js + Express.js                                    |
| **Database**  | PostgreSQL 15 + Drizzle ORM                             |
| **Real-Time** | Socket.io over local LAN / WireGuard VPN                |
| **VPN**       | WireGuard (self-hosted, for remote warehouse employees) |
| **Hardware**  | ESC/POS thermal printers, RAID 1 SSDs, local Mini-PC    |

---

## 📖 Core Features

1. **POS & Billing** — Boss-only order creation with dynamic pricing, flat discounts, multiple payment modes (Cash / UPI / Credit / Mixed)
2. **Inventory Management** — Stock tracking across multiple warehouse locations with custom units
3. **Order Fulfillment** — Employee checklist UI; Manager/Boss-only order completion with fulfillment attribution
4. **Delivery Orders** — Boss can flag orders as delivery, assign an employee, and track transit status
5. **EOD Reconciliation** — Temporary staging ledger committed by Boss at end of day; ledger correctable by Boss with full audit trail
6. **Customer Credit (Udhaar)** — Outstanding balance tracking and settlement history per customer
7. **Business Metrics** — 7/14/30-day sales velocity, "Recommended to Buy" restock alerts
8. **Attendance Tracking** — Manager-recorded daily check-in/check-out
9. **Thermal Receipt Printing** — ESC/POS via Bluetooth or LAN

---

## 🔐 Security & Privacy

- **No cloud** — All data stays on-premises; zero external telemetry or analytics
- **WireGuard VPN** — Self-hosted; remote employees connect without any third-party relay
- **RAID 1** — Two mirrored SSDs for zero-data-loss hardware redundancy
- **AES-256 encrypted backups** — One-click USB export; physical custody with owner
- **Device whitelisting** — MAC address + JWT authentication; unauthorized devices blocked
- **7-day notification TTL** — Order notifications auto-purged from server and device

---

## 📊 Project Status

**Current Phase:** 🟡 Planning complete — ready for Phase 1 development

| Phase                           | Duration    | Status      |
| ------------------------------- | ----------- | ----------- |
| Phase 1: Backend Infrastructure | Weeks 1–4   | ⏳ Starting |
| Phase 2: Web Frontend           | Weeks 5–8   | 📋 Planned  |
| Phase 3: Real-Time & Mobile     | Weeks 9–11  | 📋 Planned  |
| Phase 4: Mobile App (Capacitor) | Weeks 12–14 | 📋 Planned  |
| Phase 5: Testing & Deployment   | Weeks 15–17 | 📋 Planned  |

**Estimated Completion:** Mid-May 2026

---

## ⚠️ Out of Scope

- GST/TDS tax calculations
- Multi-location central coordination
- iOS app (Android only)
- Supplier/PO management
- Advanced payroll

---

## 📜 License

To be determined during Phase 1.
