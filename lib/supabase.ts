import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ ! 단언으로 null 가능성 제거
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
