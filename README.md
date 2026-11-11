# Sweety – Blood Glucose Tracker

A production-quality full-stack web application designed for comprehensive blood glucose tracking, analytics, and clinical report generation. Built for the evaluation assignment for the position of **Junior Full Stack Developer – JavaScript & AI at Kenpath**.

![Sweety Dashboard Screenshot](screenshots/03_dashboard.png)

---

## Table of Contents
1. [Project Objectives](#project-objectives)
2. [Main Features](#main-features)
3. [Technology Stack](#technology-stack)
4. [Application Architecture](#application-architecture)
5. [Folder Structure](#folder-structure)
6. [Prerequisites](#prerequisites)
7. [Environment Variables](#environment-variables)
8. [Database Setup & Migrations](#database-setup--migrations)
9. [Seed Data & Demo Credentials](#seed-data--demo-credentials)
10. [Quick Start Guide](#quick-start-guide)
11. [Running Automated Tests](#running-automated-tests)
12. [REST API Documentation](#rest-api-documentation)
13. [Strict Validation Rules](#strict-validation-rules)
14. [Reporting Module Calculations](#reporting-module-calculations)
15. [Visual Demonstration & Screenshots](#visual-demonstration--screenshots)
16. [Docker Deployment](#docker-deployment)
17. [Assumptions, Limitations & Future Improvements](#assumptions-limitations--future-improvements)
18. [GitHub Submission Checklist](#github-submission-checklist)

---

## Project Objectives
- Enable individuals to reliably track their blood glucose levels across four distinct daily slots.
- Prevent invalid medical readings, duplicate records, and race conditions through multi-layered validation (client, server, and database levels).
- Provide meaningful clinical analytics via Daily, Month-to-Date, and Previous Month statistical reports.
- Ensure strict cross-user data isolation and secure JWT authentication.
- Deliver an accessible, modern, healthcare-grade user interface responsive across mobile, tablet, and desktop devices.

---

## Main Features
- **User Authentication**: Secure registration and login using JWT tokens and bcrypt password hashing (salted 10 rounds).
- **Personalized Healthcare Dashboard**:
  - Warm personalized welcome (`Hello, [User Name]!`).
  - 4 Real-time Summary Cards: Total Readings, Highest Glucose, Lowest Glucose, and Average Glucose (rounded to 1 decimal place).
  - Date picker to inspect readings and stats for any given day.
  - Interactive Monthly Glucose Trend line chart powered by Recharts with clinical target boundaries (70 mg/dl and 140 mg/dl).
- **Glucose Reading Management (CRUD)**:
  - Add, edit, and delete readings with instantaneous UI feedback.
  - Confirmation dialog before deletion.
  - Pagination support (`page` and `limit`).
  - Clinical status badges (Normal, Elevated, High) based on ADA standards.
- **Strict Multi-Layer Validations**:
  - Enforces all 5 required rules on both frontend and backend.
  - PostgreSQL database-level unique constraint on `(user_id, reading_date, time_slot)` to prevent race conditions.
  - Concurrency-safe transactions for maximum four readings per day.
- **Three Analytical Reports**:
  - **Report A (Daily)**: Metrics and individual time slot records for the selected date.
  - **Report B (Month-to-Date)**: Metrics from the 1st of the month through the selected date.
  - **Report C (Monthly)**: Entire previous calendar month metrics relative to the selected date, accurately handling month boundaries and leap years.

---

## Technology Stack

### Frontend
- **Framework**: React.js 18 with Vite
- **Language**: JavaScript (ES6+)
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with Bearer token interceptor
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest & React Testing Library

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Architecture**: REST API with layered architecture (controllers, services, validators, middleware)
- **Authentication**: JWT (`jsonwebtoken`) & password hashing (`bcryptjs`)
- **Database Driver**: `pg` (node-postgres) with dual-mode embedded relational fallback (`pg-mem`)
- **Testing**: Jest & Supertest

### Database
- **Database Engine**: PostgreSQL 15+
- **Integrity**: Primary Keys, Foreign Keys (`ON DELETE CASCADE`), Unique Constraints, Check Constraints, and Composite Indexes.

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  React (Vite) + Tailwind CSS + React Router + Recharts     │
│  Axios HTTP Interceptor (Bearer JWT Authorization)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                           │
│  Express.js REST API on Port 5000                           │
│  ├── Auth Middleware (JWT Verification)                     │
│  ├── Strict Input Validation Middleware (Rules 1-5)         │
│  ├── Service Layer (Transactions & Concurrency Control)     │
│  └── Centralized Error Handling Middleware                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Parameterized SQL Queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                          │
│  PostgreSQL (or embedded pg-mem for zero-config isolation)  │
│  ├── users (id, name, email UNIQUE, password_hash)          │
│  ├── readings (id, user_id, reading_date, time_slot, value) │
│  ├── UNIQUE (user_id, reading_date, time_slot)              │
│  └── CHECK (glucose_value >= 40 AND glucose_value <= 600)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
sweety/
├── client/                     # Frontend React application
│   ├── public/                 # Static assets & favicon
│   ├── src/
│   │   ├── components/         # Reusable UI components (Modals, Toast, Chart)
│   │   ├── context/            # React AuthContext state provider
│   │   ├── layouts/            # AppLayout with responsive sidebar & navbar
│   │   ├── pages/              # Dashboard, Readings, Reports, Profile, Auth
│   │   ├── services/           # Axios API service instance
│   │   ├── tests/              # React Testing Library form validation tests
│   │   ├── utils/              # Date formatters & clinical badge helpers
│   │   ├── App.jsx             # Main routing configuration
│   │   ├── index.css           # Tailwind CSS directives
│   │   └── main.jsx            # Application root entry
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── server/                     # Backend Node / Express API
│   ├── database/
│   │   ├── schema.sql          # Relational PostgreSQL DDL schema & indexes
│   │   ├── migrate.js          # Migration runner
│   │   └── seed.js             # Demo user and sample readings seed script
│   ├── src/
│   │   ├── config/             # Database connection & credentials
│   │   ├── controllers/        # Express route handlers
│   │   ├── middleware/         # Auth & Centralized Error Handler
│   │   ├── routes/             # REST route declarations
│   │   ├── services/           # Business logic, transactions, reports
│   │   ├── utils/              # Date manipulation & JSON response helpers
│   │   ├── validators/         # Strict validation logic
│   │   ├── app.js              # Express app setup & CORS
│   │   └── server.js           # Server bootstrap
│   ├── tests/                  # Backend Jest & Supertest integration tests
│   ├── package.json
│   └── .env.example
├── screenshots/                # Real screenshots captured from the running app
├── scripts/                    # Automated screenshot runner
├── docker-compose.yml          # Multi-container Docker configuration
├── README.md                   # Complete documentation
└── .gitignore
```

---

## Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14+ (optional: if local PostgreSQL is not installed, the server automatically defaults to an in-memory embedded relational PostgreSQL engine with identical constraints and transaction support for zero-config evaluation).
- **Google Chrome** (optional: used by automated screenshot runner)

---

## Environment Variables

### Backend (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sweety_db
JWT_SECRET=sweety_super_secret_jwt_key_2026_kenpath_evaluation
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`client/.env`)
Create `client/.env` based on `client/.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Database Setup & Migrations

### Native PostgreSQL Setup
1. Create the PostgreSQL database:
   ```sql
   CREATE DATABASE sweety_db;
   ```
2. Apply the schema migration:
   ```bash
   cd server
   npm run migrate
   ```
   Or execute `server/database/schema.sql` directly using `psql`:
   ```bash
   psql -U postgres -d sweety_db -f database/schema.sql
   ```

### Schema Details
- `users`:
  - `id SERIAL PRIMARY KEY`
  - `name VARCHAR(100) NOT NULL`
  - `email VARCHAR(255) UNIQUE NOT NULL`
  - `password_hash VARCHAR(255) NOT NULL`
  - `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
  - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
- `readings`:
  - `id SERIAL PRIMARY KEY`
  - `user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `reading_date DATE NOT NULL`
  - `time_slot VARCHAR(50) NOT NULL`
  - `glucose_value INTEGER NOT NULL CHECK (glucose_value >= 40 AND glucose_value <= 600)`
  - `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
  - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
  - `CONSTRAINT unique_user_date_slot UNIQUE (user_id, reading_date, time_slot)`
  - `CONSTRAINT valid_time_slot CHECK (time_slot IN ('Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'))`

---

## Seed Data & Demo Credentials

To populate the database with the required demo user and sample readings:
```bash
cd server
npm run seed
```

### Demo Credentials
- **Email**: `demo@sweety.app`
- **Password**: `Sweety@123`
- **Name**: `Sweety Demo`

The seed script creates realistic glucose readings across:
- **Today**: Fasting, After breakfast, After lunch.
- **Yesterday**: Full 4 readings across all time slots.
- **Earlier this month**: To demonstrate the Month-to-Date report.
- **Previous calendar month**: To demonstrate the Monthly report.

---

## Quick Start Guide

### 1. Install Backend Dependencies & Start Server
```bash
cd server
npm install
npm run seed
npm start
```
The backend will start on **`http://localhost:5000`**.

### 2. Install Frontend Dependencies & Start Client
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
The frontend will start on **`http://localhost:5173`**.

Open your browser and navigate to: `http://localhost:5173`

---

## Running Automated Tests

### 1. Backend Automated Tests (Jest & Supertest)
```bash
cd server
npm test
```
**Test Coverage Includes (20 test cases)**:
- Successful user registration.
- Duplicate email registration rejection (400).
- Successful login & JWT issuance.
- Incorrect password rejection (401).
- Unauthenticated API access protection (401).
- Glucose reading creation (201).
- Rule 1: Missing glucose value rejection (`"Please enter a glucose value."`).
- Rule 2: Value below 40 rejection (`"Value must be between 40 and 600 mg/dl."`).
- Rule 2: Value above 600 rejection (`"Value must be between 40 and 600 mg/dl."`).
- Rule 2: Decimal value rejection (`"Value must be between 40 and 600 mg/dl."`).
- Rule 3: Duplicate slot on the same date rejection (`"You already have an After lunch reading for this date."`).
- Rule 4: More than four readings on same date rejection (`"You can add only 4 readings per day."`).
- Rule 5: Future date rejection (`"Date cannot be in the future."`).
- Cross-user data isolation: User A cannot read, update, or delete User B's readings (404).
- Successful reading update.
- Successful reading deletion.
- Report A: Daily report calculation and 1-decimal rounding.
- Report B: Month-to-date calculation.
- Report C: Previous calendar month calculation.
- Empty report handling without NaN or undefined.

### 2. Frontend Automated Tests (Vitest & React Testing Library)
```bash
cd client
npm test
```
**Test Coverage Includes**:
- Reading modal renders cleanly.
- Required-value validation test.
- Boundary and invalid value rejection test.
- Successful form submission test.

---

## REST API Documentation

All protected endpoints require the header: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication Endpoints
| Method | Endpoint | Description | Protected | Request Body |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | No | `{ name, email, password, confirmPassword }` |
| `POST` | `/api/auth/login` | Login user | No | `{ email, password }` |
| `GET` | `/api/auth/me` | Current user profile | Yes | None |

### Readings Endpoints
| Method | Endpoint | Description | Protected | Parameters / Body |
|---|---|---|---|---|
| `POST` | `/api/readings` | Create reading | Yes | `{ reading_date, time_slot, glucose_value }` |
| `GET` | `/api/readings` | List readings (paginated) | Yes | Query: `?page=1&limit=10&date=YYYY-MM-DD` |
| `GET` | `/api/readings/:id` | Get single reading | Yes | URL param: `id` |
| `PUT` | `/api/readings/:id` | Update reading | Yes | `{ reading_date, time_slot, glucose_value }` |
| `DELETE` | `/api/readings/:id` | Delete reading | Yes | URL param: `id` |

### Reports Endpoints
| Method | Endpoint | Description | Protected | Query Parameters |
|---|---|---|---|---|
| `GET` | `/api/reports/daily` | Report A (Daily) | Yes | `?date=YYYY-MM-DD` |
| `GET` | `/api/reports/month-to-date` | Report B (Month-to-Date) | Yes | `?date=YYYY-MM-DD` |
| `GET` | `/api/reports/monthly` | Report C (Previous Month) | Yes | `?date=YYYY-MM-DD` |

---

## Strict Validation Rules

| Rule | Condition | Exact Error Message |
|---|---|---|
| **Rule 1** | Missing / empty glucose value | `"Please enter a glucose value."` |
| **Rule 2** | Value < 40 or > 600 or decimal | `"Value must be between 40 and 600 mg/dl."` |
| **Rule 3** | Slot already recorded for date | `"You already have an [Slot Name] reading for this date."` |
| **Rule 4** | Exceeding 4 readings in a day | `"You can add only 4 readings per day."` |
| **Rule 5** | Date is in the future | `"Date cannot be in the future."` |

### Allowed Time Slots
Only the following exact four string labels are permitted:
1. `Morning (fasting)`
2. `After breakfast`
3. `After lunch`
4. `After dinner`

---

## Reporting Module Calculations

### Report A: Daily Report
- **Date Range**: Selected single date (`YYYY-MM-DD`).
- **Calculations**: Total readings count, Highest reading, Lowest reading, Average reading rounded to one decimal place (`Math.round(val * 10) / 10`), and complete individual records with their time slots.

### Report B: Month-to-Date Report
- **Date Range**: First day of the selected month (`YYYY-MM-01`) through the selected date (`YYYY-MM-DD`).
- **Calculations**: Total readings, Highest reading, Lowest reading, Average reading rounded to one decimal place.

### Report C: Monthly Report
- **Date Range**: Entire previous calendar month relative to the selected date.
  - *Example*: If the selected date is `2026-10-15`, the report spans `2026-09-01` to `2026-09-30`.
  - *Example*: If the selected date is in January `2026-01-15`, the report wraps around to December `2025-12-01` to `2025-12-31`.
  - Handles leap years accurately (e.g. February 2024 has 29 days).
- **Calculations**: Total readings, Highest reading, Lowest reading, Average reading rounded to one decimal place.

---

## Visual Demonstration & Screenshots

Actual screenshots captured from the running application:

### 1. Main Dashboard
![Main Dashboard](screenshots/03_dashboard.png)

### 2. Add Glucose Reading Modal
![Add Reading Modal](screenshots/04_add_reading_modal.png)

### 3. Strict Validation Error
![Validation Error](screenshots/07_validation_error.png)

### 4. Glucose Readings Table
![Readings List](screenshots/05_reading_list.png)

### 5. Report A: Daily Report
![Daily Report](screenshots/08_daily_report.png)

### 6. Mobile Responsive View
<img src="screenshots/11_mobile_responsive.png" width="360" alt="Mobile View" />

All screenshots are stored in the `screenshots/` directory:
- `01_login.png`
- `02_registration.png`
- `03_dashboard.png`
- `04_add_reading_modal.png`
- `05_reading_list.png`
- `06_edit_reading_modal.png`
- `07_validation_error.png`
- `08_daily_report.png`
- `09_month_to_date_report.png`
- `10_previous_monthly_report.png`
- `11_mobile_responsive.png`

---

## Docker Deployment

To run the complete application using Docker:
```bash
docker-compose up --build
```
This spins up:
- **`postgres`**: PostgreSQL database with auto-applied `schema.sql`.
- **`server`**: Node.js Express REST API on `http://localhost:5000`.
- **`client`**: Nginx-served React frontend on `http://localhost:5173`.

---

## Assumptions, Limitations & Future Improvements

### Assumptions
1. **User Ownership**: Each authenticated user manages their own glucose readings; cross-user reading access is strictly prohibited.
2. **Four Time Slots**: Blood glucose is tracked according to four standard clinical intervals: Morning (fasting), After breakfast, After lunch, and After dinner.
3. **Date Storage**: Dates are stored as PostgreSQL `DATE` types (`YYYY-MM-DD` strings) without time component to strictly avoid timezone-related date shifts between client and server.
4. **Monthly Report Definition**: The monthly report refers to the entire previous calendar month relative to the selected reference date.

### Limitations
- The system currently restricts readings strictly to the predefined 4 slots per day.
- Offline data synchronization is not implemented (requires Service Workers & IndexedDB).

### Future Improvements
1. **HbA1c Estimation**: Calculate estimated average glucose (eAG) and approximate HbA1c percentage.
2. **PDF / CSV Export**: Generate clinical PDF reports for doctor consultations.
3. **Medication & Insulin Logging**: Track insulin dosages alongside meal glucose spikes.
4. **Continuous Glucose Monitor (CGM) Integration**: Support Dexcom / FreeStyle Libre data import.

---

## GitHub Submission Checklist
- [x] React frontend runs successfully on Vite.
- [x] Express backend runs successfully.
- [x] Database schema, constraints, and indexes defined.
- [x] User registration with password hashing (bcrypt).
- [x] User login with JWT authentication.
- [x] Protected routes and authentication state management.
- [x] Users only access their own readings.
- [x] Add, View, Edit, and Delete reading operations fully working.
- [x] Strict Validation Rules 1–5 enforced on both frontend and backend.
- [x] Database unique constraint `(user_id, reading_date, time_slot)` implemented.
- [x] Daily Report (Report A) implemented with 1-decimal rounding.
- [x] Month-to-Date Report (Report B) implemented.
- [x] Previous Month Report (Report C) implemented with boundary & leap year support.
- [x] Empty reports display cleanly without `NaN` or `undefined`.
- [x] Seed script creates demo user (`demo@sweety.app` / `Sweety@123`) and sample readings.
- [x] 20 Backend unit & integration tests passing.
- [x] Frontend form validation tests passing.
- [x] Recharts responsive glucose line chart implemented.
- [x] Pagination implemented on readings list.
- [x] Docker compose configuration provided.
- [x] 11 real screenshots captured and documented.
- [x] Clean `.gitignore` and `.env.example` files included.
