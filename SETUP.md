# ARSS — AI Resume Screening System

## Project Structure

```
ARSS/
├── server/              ← Node.js + Express backend
│   ├── config/          ← DB connection
│   ├── middleware/       ← Auth (JWT) + file upload (Multer)
│   ├── models/          ← Mongoose schemas (Candidate, Admin, Config)
│   ├── routes/          ← API routes (auth, resumes, admin, config)
│   ├── services/        ← Python pipeline bridge
│   ├── uploads/         ← Uploaded resume files (auto-created)
│   ├── .env             ← Environment variables
│   └── index.js         ← Express app entry point
│
├── client/              ← React + Vite frontend
│   └── src/
│       ├── api/         ← Axios service layer
│       ├── components/  ← UI + admin + upload components
│       ├── hooks/       ← useToast
│       ├── layouts/     ← AdminLayout (sidebar)
│       ├── pages/       ← LandingPage, UploadPage, AdminLoginPage, AdminDashboard
│       └── store/       ← Redux Toolkit (auth, candidates, config slices)
│
├── modules/             ← Python AI pipeline (existing)
├── pipeline_runner.py   ← Python entry point called by Node.js
└── config/requirements.yaml
```

## Prerequisites

- Node.js 18+
- Python 3.9+ with pip
- MongoDB running on localhost:27017

## Setup

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Start the backend
```bash
cd server
npm install        # already done
npm run dev        # starts on port 5000
```

### 3. Start the frontend
```bash
cd client
npm run dev        # starts on port 3000
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/admin/login | — | Admin login |
| GET | /api/auth/admin/me | JWT | Verify token |
| POST | /api/auth/admin/logout | JWT | Logout |
| POST | /api/resumes/upload | — | Upload + process resume |
| GET | /api/resumes/:id | — | Get single result |
| GET | /api/admin/stats | JWT | Dashboard stats |
| GET | /api/admin/candidates | JWT | Paginated candidate list |
| GET | /api/admin/candidates/:id | JWT | Single candidate |
| PATCH | /api/admin/candidates/:id/status | JWT | Update status |
| DELETE | /api/admin/candidates/:id | JWT | Delete candidate |
| GET | /api/admin/candidates/:id/download | JWT | Download resume file |
| GET | /api/config/requirements | — | Get job requirements |
| PUT | /api/config/requirements | JWT | Update requirements |

## Routes

| URL | Description |
|-----|-------------|
| / | Landing page |
| /upload | Candidate resume upload + AI results |
| /admin-login | Admin login (restricted to admin email) |
| /admin-dashboard | Protected admin dashboard |

## Admin Credentials

- Email: `aibasedresumescreeningsystem@gmail.com`
- Password: Set on first login (auto-creates admin account)

## Environment Variables (server/.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/arss_db
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=aibasedresumescreeningsystem@gmail.com
CLIENT_URL=http://localhost:3000
```
