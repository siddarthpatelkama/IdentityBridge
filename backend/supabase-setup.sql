-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for Missing Reports filed by Families/Police
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

-- Table for Unidentified Patients admitted to Hospitals
CREATE TABLE IF NOT EXISTS unidentified_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name TEXT NOT NULL,
  extracted_data JSONB NOT NULL, -- Schema: { age_estimate, gender, clothing, location_found, injuries }
  image_url TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT CHECK (status IN ('active', 'matched', 'resolved')) DEFAULT 'active' NOT NULL
);

-- Index vector columns for faster cosine similarity query performance (Optional but recommended)
-- Note: We use ivfflat or hnsw for larger datasets; for < 1000 items, standard exact matching is fast.

-- Postgres function to match reports or patients based on cosine similarity
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
      (1 - (m.embedding <=> query_embedding)) AS similarity
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
      (1 - (u.embedding <=> query_embedding)) AS similarity
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
