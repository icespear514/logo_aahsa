/**
 * One-time script to promote a user to master role.
 * Usage: npx tsx scripts/seed-master.ts <email>
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/types'

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/seed-master.ts <email>')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error(
    'Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
  )
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'master' })
    .eq('email', email as string)
    .select()

  if (error) {
    console.error('Error updating role:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.error(
      `No profile found for ${email}. Make sure the user has logged in at least once.`
    )
    process.exit(1)
  }

  console.log(`✓ ${email} is now a master admin.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
