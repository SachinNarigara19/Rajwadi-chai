# Jay Mataji Rajwadi Chai - Shop Management & POS System

A complete, modern Point-of-Sale (POS), Billing, and Inventory Management System designed for chai shops and retail businesses.

---

## 🚀 Features

- **Royal Modern POS**: Instant product selection, quick category filtering, cart calculations, barcode scanning, age verification for restricted items.
- **Invoice & Bill Generation**: Thermal receipt styling (58mm/80mm), PDF invoice downloads, and print formatting.
- **Inventory & Stock Tracking**: Real-time stock alerts, batch updates, valuation metrics, purchase history, and supplier management.
- **Customer Khata (Credit Diary)**: Track customer balance, advance payments, and transaction history.
- **Expense Tracking**: Daily operational expense logging and category-wise expense breakdown.
- **Reports & Analytics**: Daily sales summaries, revenue trends, top-selling items, and profit/loss calculations.
- **Role-Based Access Control**:
  - **Admin**: Full access to all business features, settings, users, and audit logs.
  - **Cashier**: POS billing, invoice management, and receipts.
  - **Inventory Manager**: Stock updates, purchases, and supplier orders.
- **Database Backup & Audit**: System audit logs and one-click database export.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Recharts, TanStack Query
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT Authentication, Zod validation
- **Database**: SQLite (via Prisma)

---

## 🏁 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Git

### 1. Installation
Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

Install root, client, and server dependencies:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Configure Environment
Copy the example environment file in `server`:
```bash
cp server/.env.example server/.env
```

### 3. Initialize Database & Seed Demo Data
```bash
npm run db:migrate
npm run db:seed
```

### 4. Run the Application
Start both the Frontend and Backend concurrently with one command:
```bash
npm run dev
```

Or on Windows, simply double-click **`start.bat`**.

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Default Login Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Cashier** | `cashier` | `cashier123` |
| **Inventory Manager** | `manager` | `manager123` |

---

## 📜 Available Scripts

- `npm run dev`: Runs both client and server concurrently.
- `npm run server:dev`: Runs backend API server in watch mode.
- `npm run client:dev`: Runs frontend Vite dev server.
- `npm run build`: Builds both server (TypeScript) and client (Vite bundle).
- `npm run db:seed`: Seeds database with business settings, categories, products, and default users.
- `npm run db:migrate`: Applies Prisma migrations to SQLite database.
