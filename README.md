# IdentyBridge — Full-Stack Monorepo

Welcome to the **IdentyBridge** repository—a real-time matching engine and portal designed to connect families searching for missing persons with hospitals holding unidentified road accident victims.

> **Demo Data Notice:** All names, phone numbers, locations, and records included in this repository are fictional and are provided solely for demonstration and testing purposes. They do not represent real individuals or actual accident cases.

---

## 📂 Project Structure

This is a unified monorepo containing both the backend and frontend components of the application.

### [Backend](file:///c:/Users/Amrut/OneDrive/Desktop/Hackathon/backend)
- `backend/server.js`: The main Express server entry point.
- `backend/routes/intake.js`: Handles patient intake forms and voice transcription.
- `backend/services/twilioService.js`: Dispatches SMS notifications when a match is verified.
- `backend/services/openaiService.js`: Manages Whisper transcription and text embeddings.
- `backend/services/faceService.js`: Handles face embedding extraction and matching (planned/integrated).
- `backend/scripts/seed.js`: Database seeding script for local or Supabase database.
- `backend/supabase-setup.sql`: SQL schema definitions for Supabase.

### [Frontend](file:///c:/Users/Amrut/OneDrive/Desktop/Hackathon/frontend)
- `frontend/pages/index.js`: The portal landing page.
- `frontend/pages/intake.js`: Hospital patient intake form with voice description support.
- `frontend/pages/dashboard.js`: Police/Admin dashboard to verify match alerts.
- `frontend/pages/report-missing.js`: Family public portal for reporting missing persons.

---

## 🚀 Setup & Installation

### 1. Install Dependencies
Make sure you have Node.js installed, then run `npm install` in both the `backend/` and `frontend/` directories:
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file in the `backend/` folder to `.env` and fill in the credentials (Twilio, OpenAI, Supabase).

---

## ⚡ Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```

### Start Frontend Server
```bash
cd frontend
npm run dev
```
