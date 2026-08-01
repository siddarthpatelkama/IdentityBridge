# IdentyBridge: Physical & Operational Setup Checklist

This document lists all the manual steps, registrations, configurations, and physical setup actions your team must take to prepare, run, and successfully demo **IdentyBridge** during the hackathon.

---

## 🔑 Phase 1: Account Creation & API Keys (First 1 Hour)
To run the services locally and in production, you must set up the following developer accounts and collect credentials:

### 1. Supabase (Database)
- [ ] Create a free account at [supabase.com](https://supabase.com).
- [ ] Create a new project named `IdentyBridge`. Choose a database region close to you (e.g., India/Mumbai).
- [ ] Go to **Project Settings > API** and copy:
  - `Project URL` (corresponds to `SUPABASE_URL`)
  - `service_role` secret API key (corresponds to `SUPABASE_KEY` for seeding and bypassing RLS).

### 2. Twilio (SMS Gateway)
- [ ] Create a free trial account at [twilio.com](https://twilio.com).
- [ ] Go to your Twilio Console dashboard and copy:
  - `Account SID`
  - `Auth Token`
- [ ] Generate a **Twilio Phone Number** (ensure it supports SMS). Copy this number (corresponds to `TWILIO_PHONE_NUMBER`).
- [ ] **Crucial (Trial Constraint)**: Go to **Phone Numbers > Verified Caller IDs** and add the phone numbers of your team members and the phone you will use for the live demo on stage. *Twilio trial accounts can only send SMS to verified numbers.*

### 3. OpenAI (AI Services)
- [ ] Go to [platform.openai.com](https://platform.openai.com) and sign in.
- [ ] Ensure your account has at least $5 of billing credits.
- [ ] Create a new API Key named `Hackathon_IdentyBridge` and copy it (corresponds to `OPENAI_API_KEY`).

---

## 🗄️ Phase 2: Database Initialization (Siddarth's Scope)
Before seeding data or running the backend, the database tables and search capabilities must be initialized:

- [ ] Connect to your Supabase project dashboard.
- [ ] Open the **SQL Editor** from the left panel.
- [ ] Click **New Query** and run the query to enable the vector extension:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pgvector;
  ```
- [ ] Create the two database tables: `missing_reports` and `unidentified_patients` with columns for `id`, `reporter_type`, `contact_info`, `extracted_data` (JSONB), `image_url` (TEXT), `embedding` (vector(1536)), `created_at`, and `status`.
- [ ] Create the database RPC function `match_documents` for cosine similarity matching (performing the operator `<=>` check on the embeddings).

---

## 💻 Phase 3: Environment Setup & Seeding (Amrutha's Scope)
With the tables ready, populate the database with your 100-record dataset:

- [ ] Create a `.env` file in the backend folder using `.env.example` as a template.
- [ ] Paste all the retrieved API keys and URL configurations.
- [ ] Run `npm install` to download dependencies.
- [ ] Run the seeding command to populate the Supabase database:
  ```bash
  node scripts/seed_data.js
  ```
- [ ] Go to your Supabase **Table Editor** dashboard to verify that:
  - 50 rows exist in `missing_reports`
  - 50 rows exist in `unidentified_patients`
  - The embedding vectors are fully populated (not all zeros if OpenAI key was active).

---

## 📱 Phase 4: Physical Demo Environment Setup (Pre-Pitch)
To present a polished, seamless demo on stage, arrange your physical hardware and screens:

- [ ] **Device A (Presenter Laptop)**: Connected to the projector.
  - Left half of screen: **Hospital/Police Dashboard** view showing the live intake form.
  - Right half of screen: **Global Status Dashboard** showing active matching queues.
- [ ] **Device B (Mobile Phone)**: 
  - Open the **Family Public Portal** form.
  - Have this screen mirrored onto the projector (using tools like Vysor, AirServer, or Zoom screen share) so the audience can watch you submit a missing person report live on mobile.
- [ ] **Device C (Physical SMS Receiver Phone)**:
  - Have a physical phone (with a verified Twilio number) placed on the speaker table.
  - Put the phone volume on loud or have it connected to the audio system so the judges can hear the "ding" sound when the Twilio SMS arrives.

---

## 🎭 Phase 5: Rehearsal Checklist (Final 2 Hours)
Do at least 3 dry runs of the following workflow:

- [ ] **Step 1**: family submits description "Red shirt, age 25, Gachibowli DLF" on Device B.
- [ ] **Step 2**: Hospital officer speaks on Device A: "Male, mid-20s, bleeding from hand, wearing red top, found Gachibowli DLF".
- [ ] **Step 3**: Verify that the matching engine flags the record immediately with high confidence (>85%) on the dashboard.
- [ ] **Step 4**: Click the "Verify Match" button on the Police view.
- [ ] **Step 5**: Wait 2-3 seconds and verify the physical SMS arrives on Device C, showing:
  > `URGENT - IdentyBridge: High probability match found...`
