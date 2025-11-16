import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const cookieStore = cookies()
  
  return createClient(
    supabaseUrl.trim(),
    supabaseAnonKey.trim(),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

