import { createClient } from "@supabase/supabase-js";
// Remova a linha abaixo se você não estiver usando tipagem personalizada
// import { Database } from './types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServerClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);
