# 🍽 Food Bridge — Quick Start Guide

## 🚀 Starting the Application

### Step 1: Start MongoDB
Make sure MongoDB is running on your machine:
- Open **MongoDB Compass** or run `mongod` in a terminal (MongoDB Community must be installed)

### Step 2: Start the Backend
```
cd backend
npm run dev
```
Server starts at: http://localhost:5000

### Step 3: Start the Frontend  
Open a second terminal:
```
cd frontend
npm run dev
```
App runs at: http://localhost:5173

---

## 👑 Create Admin Account (First Time Only)

Run this command in PowerShell after starting the backend:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/create" -Method POST -ContentType "application/json" -Body '{"name":"Admin","email":"admin@foodbridge.com","password":"Admin@123","secretKey":"FOODBRIDGE_ADMIN_2026"}'
```

Then login at http://localhost:5173/login with:
- **Email**: admin@foodbridge.com
- **Password**: Admin@123

---

## 🔐 How OTP Works (Development Mode)

Since no email service is configured, OTPs are printed to the **backend server terminal**.

When you login:
1. Enter email + password → Click Continue
2. Look at the backend terminal — you'll see:
   ```
   ========================================
   🔐 OTP for Your Name (email@example.com): 482917
   ⏰ Valid for 2 minutes
   ========================================
   ```
3. Enter that 6-digit OTP in the frontend

---

## 👥 Test Flow

### 1. Register as Donor
- Go to http://localhost:5173/register
- Fill 3-step form, select "Donor" role
- Submit → account is "Pending"

### 2. Approve in Admin Panel
- Login as admin
- Go to admin panel → Users tab
- Click "Approve" on the donor

### 3. Login as Donor
- Login with donor credentials
- OTP will show in backend terminal
- Submit a food donation in the dashboard

### 4. Register + Approve NGO
- Register an NGO account
- Approve from admin panel
- Login as NGO → see the donation → Accept it

### 5. Register + Approve Volunteer  
- Register a Volunteer (set max capacity ≤3kg)
- Approve from admin panel
- Login as Volunteer → accept delivery → mark delivered

---

## 📁 Project Structure

```
food-bridge/
├── backend/           Node.js + Express + MongoDB
│   ├── server.js      Entry point
│   ├── models/        Mongoose schemas
│   ├── controllers/   Business logic
│   ├── routes/        API endpoints
│   ├── middleware/     Auth, upload, error handler
│   ├── utils/         OTP utility
│   └── uploads/       Uploaded files (auto-created)
│
└── frontend/          React + Vite + Tailwind CSS
    └── src/
        ├── pages/     Login, Register, all dashboards
        ├── components/ Reusable UI components
        ├── context/   Auth + Socket contexts
        └── services/  Axios API calls
```

## 🌐 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| /api/auth/register | POST | Register new user |
| /api/auth/login | POST | Login (sends OTP) |
| /api/auth/verify-otp | POST | Verify OTP, get JWT |
| /api/donations | GET/POST | List/create donations |
| /api/donations/:id/accept | PUT | NGO accepts donation |
| /api/donations/:id/assign-volunteer | PUT | Volunteer takes delivery |
| /api/admin/users | GET | Admin: list all users |
| /api/admin/users/:id/approve | PUT | Admin approves user |
| /api/admin/analytics | GET | Admin analytics |
| /api/notifications | GET | Get my notifications |
