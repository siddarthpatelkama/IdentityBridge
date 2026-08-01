const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('CRITICAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
}

// Using service_role key to allow administrative DB access and Storage upload bypass.
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = supabase;
