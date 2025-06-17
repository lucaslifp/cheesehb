
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Log para depuração no console do NAVEGADOR
console.log("Attempting to load Supabase environment variables for BROWSER client...");
console.log("NEXT_PUBLIC_SUPABASE_URL from env:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY from env (first 10 chars):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + "..." : "UNDEFINED");


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("ERROR (Browser Client): Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is not defined in environment variables.");
  throw new Error("Supabase URL is not defined for browser client. Please check your .env file for NEXT_PUBLIC_SUPABASE_URL.");
}
if (!supabaseAnonKey) {
  console.error("ERROR (Browser Client): Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is not defined in environment variables.");
  throw new Error("Supabase Anon Key is not defined for browser client. Please check your .env file for NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

// Este cliente é seguro para ser usado no lado do cliente (navegador)
export const supabaseBrowserClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    
