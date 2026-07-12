# Product Requirements Document (PRD)
## TransitOps — Smart Transport Operations Platform

**Hackathon Duration:** 8 Hours (Virtual Round)
**Tech Stack:** MERN (MongoDB, Express.js, React.js, Node.js)
**Team Size:** 4 Developers

---

## 1. Overview

TransitOps is a centralized web platform that digitizes vehicle, driver, dispatch,
maintenance, and expense management for logistics companies currently relying on
spreadsheets and manual logbooks. The platform enforces business rules around
vehicle/driver availability, trip lifecycle, and maintenance status, while giving
operational visibility through dashboards and analytics.

### 1.1 Problem Statement
Manual tracking leads to scheduling conflicts, underutilized vehicles, missed
maintenance, expired driver licenses, inaccurate expense tracking, and poor
operational visibility.

### 1.2 Goal
Build an end-to-end platform covering the full transport operations lifecycle —
from vehicle registration to dispatch, maintenance, fuel logging, and analytics —
within the 8-hour hackathon window.

---

## 2. Target Users / Roles (RBAC)

| Role | Responsibilities |
|---|---|
| **Fleet Manager** | Oversees fleet assets, maintenance, vehicle lifecycle, operational efficiency |
| **Driver** | Creates trips, assigns vehicles/drivers, monitors active deliveries |
| **Safety Officer** | Ensures driver compliance, tracks license validity, monitors safety scores |
| **Financial Analyst** | Reviews expenses, fuel consumption, maintenance costs, profitability |

---

## 3. Tech Stack

- **Frontend:** React.js (Vite), React Router, Axios, Chart.js/Recharts for analytics, Tailwind CSS
- **Backend:** Node.js + Express.js, REST API
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT-based authentication, bcrypt for password hashing, RBAC middleware, Email OTP verification (Nodemailer)
- **File Uploads:** Multer (local/disk) or Cloudinary/S3 for storing driver license photos
- **Deployment (optional):** Render/Vercel (frontend), Render/Railway (backend), MongoDB Atlas

---

## 4. Functional Requirements

### 4.1 Authentication
- Secure login using email + password (JWT-based sessions)
- **Email OTP verification (2FA on login):**
  - After correct email/password, system generates a 6-digit OTP and emails it via Nodemailer
  - OTP expires after a short window (e.g., 5 minutes); user has limited resend/retry attempts
  - JWT session token is only issued after OTP is verified
  - OTP is hashed before storing in DB (never store/log plain OTP)
  - Rate-limit OTP requests per email to prevent abuse (e.g., 3 requests / 10 minutes)
- Role-Based Access Control (RBAC) — Fleet Manager, Driver, Safety Officer, Financial Analyst
- Only fully authenticated (password + OTP verified) users can access the application

### 4.2 Dashboard
- KPIs: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips,
  Pending Trips, Drivers On Duty, Fleet Utilization (%)
- Filters: vehicle type, status, region

### 4.3 Vehicle Registry
- Master list: Registration Number (unique), Vehicle Name/Model, Type, Max Load
  Capacity, Odometer, Acquisition Cost, Status
- Status values: `Available`, `On Trip`, `In Shop`, `Retired`

### 4.4 Driver Management
- Profile fields: Name, License Number, License Category, License Expiry Date,
  Contact Number, Safety Score, Status
- **License Photo Upload (additional verification):**
  - Driver profile requires an uploaded photo of the physical driving license (front side, image format only — jpg/png, size-limited e.g. max 5MB)
  - Photo is stored via Multer (disk/local for hackathon demo) or Cloudinary (if time allows) and the URL/path saved on the driver record
  - Safety Officer role can view uploaded license photos and mark a driver's verification status as `Pending`, `Verified`, or `Rejected`
  - A driver cannot be set to `Available` (assignable to trips) until license verification status is `Verified`
- Status values: `Available`, `On Trip`, `Off Duty`, `Suspended`
- Verification status (separate field): `Pending`, `Verified`, `Rejected`

### 4.5 Trip Management
- Create trips: source, destination, available vehicle, available driver, cargo
  weight, planned distance
- Lifecycle: `Draft → Dispatched → Completed → Cancelled`

### 4.6 Maintenance
- Create maintenance records for vehicles
- Adding a vehicle to an active maintenance log auto-switches status to `In Shop`,
  removing it from the driver's selection pool

### 4.7 Fuel & Expense Management
- Fuel logs: liters, cost, date
- Other expenses: tolls, maintenance
- Auto-compute total operational cost per vehicle (Fuel + Maintenance)

### 4.8 Reports & Analytics
- Fuel Efficiency = Distance / Fuel
- Fleet Utilization
- Operational Cost
- Vehicle ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
- CSV export (mandatory); PDF export (bonus)

---

## 5. Mandatory Business Rules

1. Vehicle registration number must be unique
2. Retired or In Shop vehicles never appear in dispatch selection
3. Drivers with expired licenses or `Suspended` status cannot be assigned to trips
4. A driver/vehicle already `On Trip` cannot be assigned to another trip
5. Cargo Weight must not exceed vehicle's max load capacity
6. Dispatching a trip → vehicle & driver status become `On Trip`
7. Completing a trip → vehicle & driver status revert to `Available`
8. Cancelling a dispatched trip → vehicle & driver restored to `Available`
9. Creating an active maintenance record → vehicle status becomes `In Shop`
10. Closing maintenance → vehicle restored to `Available` (unless retired)
11. A driver cannot be assigned to a trip unless their license photo is uploaded and verification status is `Verified`
12. Login requires both correct password **and** a valid, unexpired email OTP before a session token is issued

---

## 6. Database Entities (MongoDB Collections)

- **Users** — name, email, passwordHash, role, otpHash, otpExpiresAt, isEmailVerified
- **Vehicles** — regNumber (unique), name, type, maxLoadCapacity, odometer, acquisitionCost, status
- **Drivers** — name, licenseNumber, licenseCategory, licenseExpiryDate, contact, safetyScore, status, licensePhotoUrl, verificationStatus (Pending/Verified/Rejected)
- **Trips** — source, destination, vehicleId, driverId, cargoWeight, plannedDistance, actualDistance, status, timestamps
- **MaintenanceLogs** — vehicleId, description, cost, startDate, endDate, status (active/closed)
- **FuelLogs** — vehicleId, liters, cost, date
- **Expenses** — vehicleId, type (toll/other), amount, date

---

## 7. Non-Functional Requirements

- Responsive web UI (desktop + mobile)
- Input validation on both client and server
- Centralized error handling middleware in Express
- Environment variables for secrets (`.env`, never committed) — includes SMTP/email
  credentials for OTP sending and JWT secret
- API response time reasonable for demo-scale data
- **Security additions (important given OTP + file upload):**
  - `helmet` + `cors` middleware on Express
  - Rate limiting (`express-rate-limit`) on login and OTP-request endpoints to
    prevent brute-force/spam
  - File-type and file-size validation on license photo upload (reject non-image
    files server-side, not just client-side)
  - Never log OTPs, passwords, or uploaded file contents to console (this was
    flagged as an issue in the Promptly project too — same rule applies here)
  - Store uploaded license photos outside of public git tracking (`.gitignore`
    the uploads folder if using local disk storage) so images aren't committed
    to the repo during hourly commits
  - Set JWT expiry (e.g., 24h) and consider a short-lived OTP-verification token
    that's separate from the final session JWT

---

## 8. Mandatory Deliverables

- Responsive web interface
- Authentication with RBAC + Email OTP verification
- Driver license photo upload + verification status
- CRUD for Vehicles and Drivers
- Trip Management with validations
- Automatic status transitions
- Maintenance workflow
- Fuel & Expense tracking
- Dashboard with KPIs
- Charts and visual analytics

## 9. Bonus Features (if time permits)

- PDF export
- Email reminders for expiring licenses
- Vehicle document management (upload/view)
- Search, filters, sorting
- Dark mode

---

## 10. Team Git Workflow (Virtual Hackathon — Hourly Progress Commits)

Since judges track progress via **hourly commits on `main`**, and 4 members are
building different modules of the same MERN app in parallel, the repo uses **5
branches total**: one working branch per member + one integration/backup branch.

### 10.1 Branch Structure

| Branch | Owner | Scope |
|---|---|---|
| `main` | Everyone (merge target) | Integration branch — hourly progress visible here |
| `feature/auth-dashboard` | Member A | Auth (JWT/RBAC) + Dashboard KPIs |
| `feature/vehicle-driver` | Member B | Vehicle Registry + Driver Management (CRUD) |
| `feature/trip-maintenance` | Member C | Trip Management + Maintenance workflow |
| `feature/fuel-reports` | Member D | Fuel & Expense tracking + Reports/Analytics |
| `stable-backup` | Everyone (checkpoint) | Last known fully-working full-stack version — safety net if `main` breaks |

### 10.2 Initial Setup (once, by repo owner)

```bash
git init
git add .
git commit -m "chore: initial project scaffold (MERN boilerplate)"
git branch -M main
git remote add origin <repo-url>
git push -u origin main

# Create the 4 feature branches from main
git checkout -b feature/auth-dashboard
git push -u origin feature/auth-dashboard

git checkout main
git checkout -b feature/vehicle-driver
git push -u origin feature/vehicle-driver

git checkout main
git checkout -b feature/trip-maintenance
git push -u origin feature/trip-maintenance

git checkout main
git checkout -b feature/fuel-reports
git push -u origin feature/fuel-reports

# Create the backup/stable branch from main
git checkout main
git checkout -b stable-backup
git push -u origin stable-backup
```

### 10.3 Each Member's Hourly Workflow

Each member works only on their own `feature/*` branch, then merges into `main`
every hour to show visible progress:

```bash
# Start of work session — always sync first
git checkout feature/<your-branch-name>
git pull origin main --rebase

# ... do your work for the hour ...

git add .
git commit -m "feat(<module>): <what you built this hour> - Hour <N>"
git push origin feature/<your-branch-name>

# Merge your progress into main so it's visible on the main branch
git checkout main
git pull origin main
git merge feature/<your-branch-name> --no-ff -m "merge: <module> progress - Hour <N>"
git push origin main

# Go back to your feature branch for the next hour
git checkout feature/<your-branch-name>
```

**Commit message convention:**
```
feat(auth): implement JWT login + RBAC middleware - Hour 1
feat(vehicle): add vehicle CRUD APIs - Hour 2
feat(trip): dispatch validation logic - Hour 3
fix(dashboard): correct fleet utilization calc - Hour 4
```

### 10.4 Updating the Backup Branch (`stable-backup`)

After `main` is confirmed working at a milestone (e.g., end of every 2 hours),
one team member updates `stable-backup` so there's always a safe, fully working
version to fall back to:

```bash
git checkout stable-backup
git pull origin stable-backup
git merge main -m "checkpoint: stable version at Hour <N>"
git push origin stable-backup
```

**If `main` breaks and can't be fixed quickly:**
```bash
git checkout main
git reset --hard stable-backup
git push origin main --force
```
*(Use `--force` carefully — confirm with the team before force-pushing to `main`.)*

### 10.5 Suggested Ownership Split (maps directly to PRD sections)

- **Member A →** `feature/auth-dashboard`: Section 4.1 (Auth/RBAC) + 4.2 (Dashboard)
- **Member B →** `feature/vehicle-driver`: Section 4.3 (Vehicle Registry) + 4.4 (Driver Management)
- **Member C →** `feature/trip-maintenance`: Section 4.5 (Trip Management) + 4.6 (Maintenance)
- **Member D →** `feature/fuel-reports`: Section 4.7 (Fuel & Expense) + 4.8 (Reports & Analytics)

This keeps merge conflicts minimal since each member owns distinct Mongoose
models, routes, and React pages/components.

---

## 11. Suggested 8-Hour Timeline

| Hour | Milestone |
|---|---|
| 1 | Repo/branch setup, MERN boilerplate, DB schema finalized, auth scaffolding |
| 2 | Auth complete (login/RBAC), Vehicle & Driver CRUD APIs done |
| 3 | Vehicle/Driver frontend forms + tables, Trip creation API |
| 4 | Trip dispatch/complete/cancel logic + validations (business rules) |
| 5 | Maintenance workflow (status auto-switch), Fuel/Expense logging APIs |
| 6 | Dashboard KPIs + charts, Reports (fuel efficiency, ROI, utilization) |
| 7 | Integration on `main`, bug fixes, CSV export, UI polish |
| 8 | Final testing, `stable-backup` sync, demo prep, deployment (if time allows) |

---

## 12. Example Workflow (from spec, for validation/testing)

1. Register vehicle `Van-05`, max capacity 500 kg, status `Available`
2. Register driver `Alex` with valid license
3. Create trip, cargo weight = 450 kg
4. System validates 450 ≤ 500 → dispatch allowed
5. Vehicle & Driver status → `On Trip`
6. Complete trip (final odometer + fuel consumed) → both status → `Available`
7. Create maintenance record (e.g., Oil Change) → vehicle → `In Shop`, hidden from dispatch
8. Reports update operational cost & fuel efficiency from latest trip/fuel log

---

## 13. Reference

Mockup: https://link.excalidraw.com/l/65VNwvy7c4X/1FHGDNgD2td
