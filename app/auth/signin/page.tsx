import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SignInClient } from '@/components/signin-client-supabase'

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/calendar')
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <SignInClient />
    </div>
  )
}
