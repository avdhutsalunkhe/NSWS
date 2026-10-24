# National Single Window System (NSWS) — Sugar Mill ERP & P-II Integration Platform

An enterprise-grade ERP and statutory integration platform developed for Indian Sugar Mills. This system manages plant operations, crushing seasons, daily production, molasses/cane juice diversions for ethanol, domestic & export dispatches, cane grower dues, and generates automated statutory monthly returns (**Form P-II**) conforming directly to the **Central Government National Single Window System (NSWS)** and **Directorate of Sugar & Food Distribution** standards.

---

## 🌟 Key Features

1. **Multi-Plant Management (Multi-Tenant Architecture)**:
   - Configured for multi-plant sugar undertakings (Balrampur, Zira, Gurdaspur, Morinda).
   - Dedicated Single Window System identifiers (`sws_id`, `project_number`, `approval_id`), PAN verification, and whitelisted IP validation.

2. **Sugar Season Management**:
   - Manage multiple crushing seasons (e.g. 2023-24, 2022-23, 2021-22).
   - Switch active seasons with real-time operational context isolation.

3. **Production & Recovery Accounting**:
   - Track cane crushed (MT), white sugar produced from cane, reprocessing old stocks, raw sugar conversion, and mixed juice analysis (Pol % & Purity %).

4. **Ethanol & Molasses Diversions**:
   - Granular tracking of B-Heavy molasses and cane juice diverted to ethanol production.
   - Computes equivalent sugar sacrifice and estimated ethanol yield (liters).

5. **Dispatches & Release Quota**:
   - Manage monthly domestic quota dispatches, levy dispatches, and export release allocations.
   - Validates plant-wise dispatch limits against statutory directives.

6. **Imports & Exports Registry**:
   - Records raw and refined sugar imports/exports, port clearances, vessel numbers, and domestic conversion quantities.

7. **Inventory & Packaging Godown Accounting**:
   - Real-time stock ledgers for white sugar, raw sugar, molasses, and ethanol.
   - Godown packaging reconciliation (50 kg HDPE / Jute bags).

8. **Cane Dues & Farmer Arrears**:
   - Comprehensive Fair and Remunerative Price (FRP) and State Advised Price (SAP) cane payment tracking.
   - Real-time monitoring of cane dues accrued, amount disbursed, and overdue farmer arrears.

9. **Statutory Form P-II Return Engine**:
   - Automated compilation of monthly P-II returns combining production, diversions, sales, and stocks.
   - Generates schema-validated JSON payloads for direct submission to the Central Government NSWS portal.

10. **Role-Based Access Control (RBAC)**:
    - **ADMIN**: Central Directorate of Sugar / Corporate Headquarters access across all mill units.
    - **CLERK**: Plant-scoped data entry operators bound to their specific factory code.
    - Quick Role Switcher toolbar for rapid evaluation and UAT testing.

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js (v5), Better-SQLite3, Sequelize, JSON Web Tokens (JWT), BCryptJS
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (v4), Lucide React, React Router 7
- **Database**: SQLite with Write-Ahead Logging (WAL) for maximum reliability and zero external database setup overhead

---

## 📂 Project Structure

```text
Central Gov/
├── backend/
│   ├── src/
│   │   ├── config/              # SQLite database initialization & WAL pragmas
│   │   ├── middleware/          # JWT authentication & plant-scoping authorization
│   │   ├── models/              # Relational schema (plants, seasons, production, etc.)
│   │   ├── routes/              # Express API endpoints
│   │   ├── seed/                # Seed scripts with official plant configurations
│   │   ├── services/            # NSWS API integration & P-II payload generator
│   │   └── server.js            # Express application entrypoint
│   ├── clear_data.js            # Database reset & maintenance utility
│   ├── database.sqlite          # Pre-configured SQLite database with seed data
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/                  # Static assets & icons
│   ├── src/
│   │   ├── assets/              # Branding assets & images
│   │   ├── components/          # Reusable UI components (Navbar, Sidebar, Badges)
│   │   ├── context/             # AuthContext and DialogContext
│   │   ├── pages/               # Feature dashboards & management modules
│   │   ├── services/            # Axios / Fetch API client for backend
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Application layout & routing
│   │   └── main.tsx             # React entry point
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── setup.bat                    # One-click dependency installation
├── start-all.bat                # Launch both backend & frontend simultaneously
├── start-backend.bat            # Launch backend server
├── start-frontend.bat           # Launch frontend Vite dev server
└── logo.jpeg                    # Directorate of Sugar / RBPSSK emblem
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` (included with Node.js)

### Option 1: Quick Start (Windows)
Double-click `setup.bat` to install all dependencies for both backend and frontend, then double-click `start-all.bat` to run the complete platform!

### Option 2: Manual Installation & Startup

#### 1. Setup & Run Backend
```bash
cd backend
npm install
npm start
```
*The backend API server will start at `http://localhost:5000` (and on your local LAN IP).*

#### 2. Setup & Run Frontend
```bash
cd frontend
npm install
npm run dev
```
*The frontend application will be accessible at `http://localhost:3000`.*

---

## 🔐 Default Login Credentials

| Username | Password | Role | Mill / Jurisdiction |
| :--- | :--- | :--- | :--- |
| **`admin`** | `Admin@123` | **ADMIN** | Central Directorate (All Mills Access) |
| **`8901`** | `Clerk@8901` | **CLERK** | Balrampur Sugar Mill (UAT Official Unit) |
| **`102`** | `Clerk@102` | **CLERK** | Zira Sugar Mill |
| **`101`** | `Clerk@101` | **CLERK** | Gurdaspur Cooperative Sugar Mill |
| **`103`** | `Clerk@103` | **CLERK** | Morinda Sugar Mills |

> **Tip**: You can use the **Quick Role Switcher** in the top navigation bar to instantaneously toggle between Admin and different factory clerks during evaluation.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check and network metadata |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT bearer token |
| `GET` | `/api/auth/me` | Fetch active user identity & plant access scope |
| `GET` | `/api/dashboard/metrics` | Retrieve enterprise-wide or plant-specific KPI metrics |
| `GET` | `/api/plants` | List all registered sugar mills |
| `GET` | `/api/sugar-seasons` | List crushing seasons and active season status |
| `GET` | `/api/production` | Fetch monthly crushing and recovery data |
| `GET` | `/api/diversions` | Molasses and cane juice diversion records |
| `GET` | `/api/dispatches` | Domestic quota, levy, and export sales |
| `GET` | `/api/inventory` | Real-time godown balances and stock positions |
| `GET` | `/api/cane-dues` | Farmer payment records & arrears aging |
| `GET` | `/api/p2-reports` | List generated Form P-II monthly return filings |
| `POST` | `/api/p2-reports/generate` | Generate and validate Form P-II for Central Govt portal |
| `POST` | `/api/p2-reports/submit` | Transmit P-II return to Central NSWS gateway |
| `GET` | `/api/audit-logs` | Tamper-evident system activity audit logs |

---

## 🏛️ NSWS Compliance & Form P-II Specifications

Under the Sugar (Control) Order and Directorate of Sugar guidelines, every operating sugar factory in India is mandated to submit monthly returns (Form P-II) detailing:
1. Crushing duration and quantity of cane crushed.
2. Sugar recovery % and production classified by grade and process (cane, reprocessing, raw conversion).
3. Molasses generation (B-Heavy, C-Heavy) and diversion to distillery/ethanol units.
4. Total sugar despatches, closing stock in godowns, and bag packaging types.
5. Cane dues payable, cane price paid, and pending liabilities to growers.

This system guarantees **100% schema alignment** with the NSWS Central Gateway payloads.

---

## 📄 License & Ownership

Developed for **RBPSSK IT Team** and **Directorate of Sugar & Food Distribution Integration**.  
Maintained by **Avadhut Salunkhe**.
