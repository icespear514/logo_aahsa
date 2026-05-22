import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

// NEVER import this in client components. Server-side only.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
