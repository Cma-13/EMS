# EMS - Employee Management System
## MERN Stack | Face Attendance | AI Leave Prediction | Microservices

---

### About This Project:
A full-stack Employee Management System built as a Final Year Project for BSc. CSIT.
It automates HR operations including face recognition attendance, ML-based leave approval prediction, salary management, and real-time notifications.

---

### Tech Stack:
    Frontend     → React.js + Vite + Tailwind CSS          (port 5173)
    Backend      → Node.js + Express + MongoDB              (port 5000)
    Face Service → Python Flask + face_recognition          (port 5001)
    ML Service   → Python Flask + scikit-learn RandomForest (port 5002)
    Database     → MongoDB (must be running)

---

### Key Features:
    1. Face Recognition Attendance  → check-in/checkout via webcam with liveness detection
    2. AI Leave Prediction          → hybrid model: Random Forest + Bayesian + HR Rules
    3. Employee Management          → add, edit, delete employees with photo upload
    4. Department Management        → create and assign departments
    5. Leave Management             → apply, approve, reject with balance tracking
    6. Salary Management            → add salary, allowances, deductions, payment history
    7. Holiday Management           → declare holidays with employee notifications
    8. Notification System          → real-time notifications for leaves, salary, holidays
    9. Role Based Access            → Admin and Employee separate dashboards
    10. Early Exit Workflow         → employee requests early exit, admin approves/rejects

---

### Run All Services:
    Terminal 1: cd server                          → npm install && npm start          (port 5000)
    Terminal 2: cd frontend                        → npm install && npm run dev        (port 5173)
    Terminal 3: cd python_services/face_service    → pip install -r requirements.txt && python app.py  (port 5001)
    Terminal 4: cd python_services/ml_service      → pip install -r requirements.txt && python app.py  (port 5002)
    Terminal 0: mongod (MongoDB must be running)

---

### Environment Variables:
    server/.env
        PORT=5000
        MONGODB_URL=mongodb://localhost:27017/ems_new
        JWT_KEY=your_jwt_secret_key

    python_services/face_service/.env
        MONGO_URI=mongodb://localhost:27017
        DB_NAME=ems_new
        TOLERANCE=0.45
        FRONTEND_URL=http://localhost:5173
        FACE_SERVICE_KEY=ems-face-secret-2024
        TIMEZONE=Asia/Kathmandu

    python_services/ml_service/.env
        MONGO_URI=mongodb://localhost:27017
        DB_NAME=ems_new
        FRONTEND_URL=http://localhost:5173
        ML_SERVICE_KEY=ems-ml-secret-2024
        TIMEZONE=Asia/Kathmandu

---

### First Time Setup:
    1. Install Node.js v18+, Python 3.11, MongoDB
    2. Configure .env files (change CRLF to LF in VS Code)
    3. cd server → npm install dotenv && npm install
    4. cd server → node userSeed.js   (creates admin user — run ONCE only)
    5. For face service use Python 3.11 venv:
           py -3.11 -m venv venv
           venv\Scripts\activate
           pip install -r requirements.txt
           pip install requests tzdata
           pip install git+https://github.com/ageitgey/face_recognition_models
    6. Run all 4 terminals above
    7. Open http://localhost:5173

---

### Default Login:
    Email:    admin@gmail.com
    Password: admin

---

### ML Model Details:
    Dataset Source  → IBM HR Analytics Employee Attrition & Performance (Kaggle)
    Original rows   → 1,470 real employee records
    After preprocessing → 6,600+ leave request records
    Algorithm       → Hybrid: Random Forest (30%) + Bayesian (50%) + HR Rules (20%)

    Score Interpretation:
        85-100  → Likely Approved
        70-84   → Looks Promising
        55-69   → Could Go Either Way
        40-54   → Needs Review
        0-39    → Unlikely to be Approved

    Preprocessing Steps:
        1. Dropped 24 irrelevant columns from IBM dataset
        2. Encoded categorical columns (Gender, MaritalStatus, OverTime, Department)
        3. Generated leave requests per employee based on real IBM attributes
        4. Derived target variable (Approved/Rejected) using HR approval rules
        5. Trained Random Forest with 300 estimators, max_depth=8

---

### Face Service Messages:
    "No face detected"              → look at camera in good lighting
    "Multiple faces detected"       → only one person in frame
    "Face not recognized"           → not registered or poor lighting
    "Already checked in"            → shows original check-in time, blocked
    "Already checked out"           → shows original check-out time, blocked
    "Not checked in today"          → must check in before checkout
    "Face already on another account" → duplicate face rejected

---

### Project Structure:
    EMS/
    ├── server/                  → Node.js + Express backend
    │   ├── controllers/         → auth, employee, leave, attendance, salary, holiday...
    │   ├── models/              → User, Employee, Leave, Attendance, Salary, Notification...
    │   ├── routes/              → all API routes
    │   ├── middleware/          → JWT auth middleware
    │   └── userSeed.js         → creates default admin user
    │
    ├── frontend/                → React + Vite
    │   └── src/
    │       ├── components/      → dashboard, employee, leave, salary, attendance...
    │       ├── pages/           → Login, AdminDashboard, EmployeeDashboard, AttendancePage
    │       ├── context/         → authContext
    │       └── utils/           → helpers, route guards
    │
    └── python_services/
        ├── face_service/        → Flask face recognition + liveness detection
        └── ml_service/          → Flask ML leave prediction + hybrid model

---

### Known Limitations:
    1. Max 5 days per Annual Leave request (no Emergency Leave type)
    2. face_recognition requires Python 3.11 — not compatible with 3.12+
    3. ML Bayesian component needs 8-10 leave history decisions for accuracy
    4. Email notifications require Gmail App Password setup
    5. Web only — no mobile application

---

### Developer:
    Name    → Seema Singdan
    College → ASMT College, Kathmandu, Nepal
    Program → BSc. CSIT — Final Year Project (8th Semester)
