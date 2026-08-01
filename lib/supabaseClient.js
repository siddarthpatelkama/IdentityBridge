import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Export a single, reusable Supabase client instance.
// If the environment variables are not loaded, we log a warning on the client side.
if (typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn(
        "Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are missing."
    );
}

// Safely initialize the client if values are present to prevent crashes during SSR/builds.
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
