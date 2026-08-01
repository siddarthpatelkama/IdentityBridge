# IdentyBridge: Backend & AI Architecture Plan (Siddarth's Scope)

## 1. Project Context
**Project Name:** IdentyBridge
**Purpose:** A real-time matching engine for unidentified road accident victims (hospitalized/unconscious) and missing person reports.
**Target Audience:** Telangana Police, local hospitals, and families.
**Siddarth's Role:** Lead Backend & AI Architect. Responsible for database schema, API routing, AI text-to-vector embeddings, and Voice-to-JSON intake.
**Strict Constraints:** 
- **Two-Stage Matching Only:** Facial recognition only runs on the shortlisted candidates from the text-vector search. Do not run face matching against the entire database.
- **No conversational VLMs for faces:** Use a mathematical face-matching API (Face++ / AWS Rekognition), not a conversational Vision model.
- **No Frontend code:** Handled separately by Ujwala.

## 2. Tech Stack
- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Database Extension:** `pgvector` (for cosine similarity matching) and Supabase Storage (for photo uploads)
- **AI/APIs:** 
  - OpenAI Whisper API (Voice-to-Text)
  - OpenAI LLM API (Text-to-Structured JSON)
  - OpenAI Embeddings API (`text-embedding-3-small` for vector generation)
  - Face++ Compare API (Stage 2 Face Similarity, with built-in mock fallback)
  - Twilio API (SMS Alerts)

## 3. Database Schema (Supabase)

**Table 1: `missing_reports` (Submitted by Families/Police)**
- `id` (uuid, primary key)
- `reporter_type` (enum/text: 'family', 'police')
- `contact_info` (text)
- `extracted_data` (jsonb) -> Schema: `{ age_approx, gender, clothing, location_missing, physical_marks }`
- `image_url` (text) -> Public URL to photo in Supabase storage
- `embedding` (vector(1536)) -> Stores the embedding of the extracted_data values
- `created_at` (timestamp)
- `status` (text: 'active', 'matched', 'resolved')

**Table 2: `unidentified_patients` (Submitted by Hospitals/Police)**
- `id` (uuid, primary key)
- `hospital_name` (text)
- `extracted_data` (jsonb) -> Schema: `{ age_estimate, gender, clothing, location_found, injuries }`
- `image_url` (text) -> Public URL to photo in Supabase storage
- `embedding` (vector(1536))
- `created_at` (timestamp)
- `status` (text: 'active', 'matched', 'resolved')

**Supabase RPC Function:**
- Create a Postgres function `match_documents` to perform cosine similarity search (`<=>`) between the query vector and the vectors in the opposing table, filtering candidates with a score > 0.60.

## 4. API Endpoints Implemented

### A. Unified Intake Pipeline (`POST /api/intake`)
- **Payload:** `multipart/form-data` containing:
  - `photo`: Image file (uploaded to Supabase Storage)
  - `audio`: Optional voice note (transcribed with Whisper and structured with LLM)
  - `manual_data` or flat parameters (fallback if audio is missing)
- **Workflow:**
  1. Uploads image to public bucket `photos`.
  2. Transcribes/structures description to JSON.
  3. Generates 1536-dim vector for description values.
  4. Inserts record into corresponding database table.
  5. Queries opposing table via `match_documents` RPC (>60% similarity, max 5 records).
  6. Compares photos of shortlisted candidates using `compareFaces` and returns combined scores.

### B. Manual Match Verification (`POST /api/match/verify`)
- **Payload:** `{ patient_id: uuid, report_id: uuid }`
- **Workflow:** Updates status of both records to `'matched'` and triggers Twilio SMS to the family's contact number.

### C. Dashboard Data (`GET /api/dashboard`)
- **Payload:** None
- **Workflow:** Returns list of all reports and patients sorted by creation date for general visualization.