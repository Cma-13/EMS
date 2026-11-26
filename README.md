# EMS - Employee Management System

[![Tests](https://github.com/Cma-13/EMS/actions/workflows/tests.yml/badge.svg)](https://github.com/Cma-13/EMS/actions/workflows/tests.yml)

**Face-recognition attendance · ML leave-approval prediction · Payroll · Role-based HR portal**

A full-stack HR platform that automates the daily work of a small company: employees check in with their face, apply for leave against real company policy, and get paid with unpaid days deducted automatically, while admins get a dashboard and a leave-approval score that explains its own reasoning.

Built as a team Final Year Project for BSc. CSIT at ASMT College, Kathmandu.

---

## Highlights

- **Face-recognition attendance**: webcam check-in and check-out with automatic Present / Late / Half Day status, duplicate-face protection, and an early-exit request flow that admins approve or reject.
- **Hybrid ML leave prediction**: a Random Forest, a Bayesian model of each employee's own history, and HR rules are blended with **adaptive weights** into one approval score, with a full breakdown of why.
- **Policy-driven leave engine**: per-type notice periods, request limits, gaps between requests, monthly caps, yearly balances, and an automatic paid / unpaid split that flows into salary deductions.
- **Payroll**: salary records with allowances, deductions and unpaid-leave deductions, plus an admin salary breakdown.
- **Notification centre**: in-app notifications with unread / all tabs, date grouping, mark read / unread, delete and clear. New employees get a welcome email with their login details (Gmail SMTP).
- **Secure by design**: JWT auth, admin-only routes enforced on the server, employees limited to their own data, login lockout, forced password change on first login, and service keys between microservices.

---

## Architecture

```
                 ┌──────────────────────────┐
                 │  React + Vite + Tailwind │  :5173
                 └─────────────┬────────────┘
                               │ REST (JWT)
        ┌──────────────────────┼───────────────────────┐
        ▼                      ▼                       ▼
┌───────────────┐   ┌────────────────────┐   ┌────────────────────┐
│ Node + Express│   │ Face service       │   │ ML service         │
│ API     :5000 │◄──│ Flask        :5001 │   │ Flask        :5002 │
└───────┬───────┘   │ face_recognition   │   │ scikit-learn       │
        │           └─────────┬──────────┘   └─────────┬──────────┘
        └─────────────────────┼────────────────────────┘
                              ▼
                       ┌─────────────┐
                       │   MongoDB   │
                       └─────────────┘
```

| Part | Tech | Port |
|---|---|---|
| Frontend | React, Vite, Tailwind CSS, Axios | 5173 |
| API | Node.js, Express, Mongoose, JWT, bcrypt, Multer, Nodemailer | 5000 |
| Face service | Python, Flask, face_recognition (dlib), OpenCV | 5001 |
| ML service | Python, Flask, scikit-learn, pandas | 5002 |
| Database | MongoDB | 27017 |

---

## Features

### Admin
- Dashboard with employee, department, leave and salary summaries
- Employees: add (with photo), edit, view, delete, register face
- Departments: create, edit, delete (removes everything linked to its employees)
- Leave: review requests with the ML score and breakdown, approve / reject, view all balances
- Attendance: daily and monthly views, early-exit approvals, absent check that skips holidays, weekends and approved leave
- Payroll: add salary, view history and salary breakdown. Unpaid leave and **absent days** (from face attendance) are deducted automatically, and never twice
- Holidays and email settings

### Employee
- Personal dashboard with attendance and leave summary
- Apply for leave with live policy checks and a paid / unpaid preview
- View own leave history, balance, salary history and attendance
- Notifications and password change

### Attendance kiosk
- Shared check-in / check-out screen for the office
- Early checkout (under 8 hours) asks for a reason and sends it to the admin, protected by a one-time token from the face scan

---

## Leave policy

| Type | Yearly balance | Max per request | Notice | Gap between requests | Monthly cap |
|---|---|---|---|---|---|
| Annual | 14 days | 5 days | 7 days | 14 days | — |
| Casual | 6 days | 3 days | 1 day | 7 days | 3 days |
| Sick | 8 days | — | none | — | — (admin is alerted after 3 in 30 days) |

Leave counts **working days only**: weekends (`WEEKEND_DAYS`) and declared holidays inside a leave are not taken from the balance.

Days beyond the remaining balance become **unpaid** and are deducted from salary (monthly salary ÷ 26 per day). The balance is checked again at approval time, so it can never be overdrawn.

**Attendance status:** check-in by 9:00 AM is Present, by 10:00 AM is Late, after that is Half Day. A full day is 8 hours.

**Payroll:** Net = Basic + Allowances − Other deductions − Unpaid leave − Absent days. Absent days are deducted at basic ÷ 26 per day, skipping weekends, holidays and approved leave days, and the salary form previews exactly what will be deducted.

---

## ML leave-approval prediction

| Component | What it uses |
|---|---|
| **Random Forest** | 300 trees (max depth 8) trained on leave type, duration, month, weekday, previous leaves, department, age, tenure and attendance reliability |
| **Bayesian personal rate** | The employee's own approve / reject history, starting from an industry prior and shifting toward their real rate as history grows |
| **HR rules** | Hard limits on duration by leave type |

**Adaptive weights:** with no history, the model leans on the Random Forest (55% / 25% / 20%). As an employee builds up 16+ decided leaves, it shifts to their personal history (12% / 68% / 20%).

**Dataset:** the UCI *Absenteeism at Work* dataset (740 real records), cleaned (invalid rows, duplicates, outliers capped at the 99th percentile), feature-engineered to match the EMS schema, and bootstrapped to about 7,000 training rows. **Test accuracy is about 80%.** Attendance reliability is a weak prior in training and comes from live attendance data at prediction time.

| Score | Verdict |
|---|---|
| 72–100 | Likely to be Approved |
| 52–71 | Could go either way |
| 35–51 | Unlikely to be Approved |
| 0–34 | Not Recommended |

Run `python evaluate_model.py` in `python_services/ml_service` for the confusion matrix and classification report.

---

## Getting started

### Requirements
- Node.js 18+
- Python **3.11** (face_recognition does not support 3.12+)
- MongoDB running locally

### 1. Environment files

`server/.env`
```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017/ems_new
JWT_KEY=change_me_to_a_long_random_string
FACE_SERVICE_KEY=change_me_face_key        # must match the face service
ADMIN_EMAIL=admin@example.com              # used once by userSeed.js
ADMIN_PASSWORD=change_me
WEEKEND_DAYS=6                             # 0=Sun … 6=Sat, comma-separated
```

`python_services/face_service/.env`
```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=ems_new
TOLERANCE=0.45
FRONTEND_URL=http://localhost:5173
FACE_SERVICE_KEY=change_me_face_key
TIMEZONE=Asia/Kathmandu
```

`python_services/ml_service/.env`
```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=ems_new
FRONTEND_URL=http://localhost:5173
ML_SERVICE_KEY=change_me_ml_key
TIMEZONE=Asia/Kathmandu
```

`frontend/.env`: copy `frontend/.env.example` and set the two keys to match the Python services.

Email (SMTP) settings are entered from **Admin → Email Settings** and need a Gmail App Password.

### 2. Install and create the admin (first time only)

```bash
cd server && npm install && node userSeed.js
cd ../frontend && npm install

cd ../python_services/face_service
py -3.11 -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
pip install git+https://github.com/ageitgey/face_recognition_models

cd ../ml_service
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run (four terminals)

| Terminal | Command |
|---|---|
| API | `cd server` → `npm start` |
| Frontend | `cd frontend` → `npm run dev` |
| Face service | `cd python_services/face_service` → `venv\Scripts\activate` → `python app.py` |
| ML service | `cd python_services/ml_service` → `venv\Scripts\activate` → `python app.py` |

Open **http://localhost:5173** and log in with the admin you created. The attendance kiosk is at **/attendance**.

---

## Project structure

```
EMS/
├── server/
│   ├── controllers/     auth, employee, department, leave, salary, attendance, holiday, notification, dashboard, setting
│   ├── models/          User, Employee, Department, Leave, LeaveBalance, Salary, Attendance, Holiday, Notification
│   ├── routes/          REST routes per module
│   ├── middleware/      JWT auth, admin-only, service-key checks
│   ├── utils/           email service
│   └── userSeed.js      creates the first admin
├── frontend/src/
│   ├── components/      dashboard, employee, department, leave, salary, attendance, notifications
│   ├── pages/           Login, dashboards, attendance kiosk, forced password change
│   ├── context/         auth context
│   └── utils/           API config, route guards, helpers
└── python_services/
    ├── face_service/    face registration, recognition, check-in / check-out
    └── ml_service/      dataset builder, training, evaluation, prediction API
```

---

## Security

- Passwords hashed with bcrypt, JWT sessions, lockout after 5 failed logins
- New employees must change their password on first login
- Admin-only actions and data ownership are enforced **on the server**, not just hidden in the UI
- Services talk to each other with service keys; early checkout needs a one-time token from a real face scan
- Uploads limited to images under 5 MB
- Secrets live in `.env` files, which are git-ignored

---

## Known limitations

- The kiosk's service keys are bundled into the frontend, so the kiosk should run on a trusted office machine
- The daily absent check is started by the admin, not scheduled
- No automated test suite yet
- Web only (no mobile app)

---

## Team

Seema Singdan · Manalika Shrestha · Shreya Dhital

BSc. CSIT Final Year Project, ASMT College (Asian School of Management and Technology), Kathmandu, Nepal
