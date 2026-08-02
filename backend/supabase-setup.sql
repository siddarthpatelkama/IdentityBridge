-- 1. Enable the pgvector extension for similarity search vector math
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the missing_reports table
CREATE TABLE IF NOT EXISTS missing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_type TEXT CHECK (reporter_type IN ('family', 'police')) NOT NULL,
  contact_info TEXT NOT NULL,
  extracted_data JSONB NOT NULL, -- Schema: { age_approx, gender, clothing, location_missing, physical_marks }
  image_url TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT CHECK (status IN ('active', 'matched', 'resolved')) DEFAULT 'active' NOT NULL
);

-- 3. Create the unidentified_patients table
CREATE TABLE IF NOT EXISTS unidentified_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name TEXT NOT NULL,
  extracted_data JSONB NOT NULL, -- Schema: { age_estimate, gender, clothing, location_found, injuries }
  image_url TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT CHECK (status IN ('active', 'matched', 'resolved')) DEFAULT 'active' NOT NULL
);

-- 4. Disable Row Level Security (RLS) on tables for bulletproof demo access during the hackathon
ALTER TABLE missing_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE unidentified_patients DISABLE ROW LEVEL SECURITY;

-- 5. Set up the 'photos' storage bucket automatically in Supabase
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to storage objects for the photos bucket
-- (Note: These will apply if the storage schema policies are active)
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'photos');

CREATE POLICY "Public Insert Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'photos');

-- 6. Create the Postgres RPC function for Stage 1 Cosine Similarity Vector Matching
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  target_table TEXT
)
RETURNS TABLE (
  id UUID,
  reporter_type TEXT,
  hospital_name TEXT,
  contact_info TEXT,
  extracted_data JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF target_table = 'missing_reports' THEN
    RETURN QUERY
    SELECT 
      m.id,
      m.reporter_type,
      NULL::TEXT AS hospital_name,
      m.contact_info,
      m.extracted_data,
      m.image_url,
      m.created_at,
      m.status,
      (1 - (m.embedding <=> query_embedding))::FLOAT AS similarity
    FROM missing_reports m
    WHERE (1 - (m.embedding <=> query_embedding)) > match_threshold
      AND m.status = 'active'
    ORDER BY m.embedding <=> query_embedding ASC
    LIMIT match_count;
  ELSIF target_table = 'unidentified_patients' THEN
    RETURN QUERY
    SELECT 
      u.id,
      NULL::TEXT AS reporter_type,
      u.hospital_name,
      NULL::TEXT AS contact_info,
      u.extracted_data,
      u.image_url,
      u.created_at,
      u.status,
      (1 - (u.embedding <=> query_embedding))::FLOAT AS similarity
    FROM unidentified_patients u
    WHERE (1 - (u.embedding <=> query_embedding)) > match_threshold
      AND u.status = 'active'
    ORDER BY u.embedding <=> query_embedding ASC
    LIMIT match_count;
  ELSE
    RAISE EXCEPTION 'Invalid target table specified: %', target_table;
  END IF;
END;
$$;

-- 7. Create the user_profiles table to store user roles and metadata
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('Public User', 'Police', 'Hospital')) DEFAULT 'Public User' NOT NULL,
  facility_name TEXT,
  facility_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS on user_profiles for hackathon access convenience
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Fallback public bypass policy in case RLS remains active
DROP POLICY IF EXISTS "Public Access Profiles" ON user_profiles;
CREATE POLICY "Public Access Profiles" ON user_profiles 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);
