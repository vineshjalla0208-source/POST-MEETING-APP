'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { LogIn, Loader2 } from 'lucide-react'

export function SignInClient() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const result = await signIn('google', {
        callbackUrl: '/calendar',
        redirect: true,
      })

      if (result?.error) {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Failed to sign in with Google',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome</CardTitle>
        <CardDescription>
          Sign in with Google to sync your calendar and manage meetings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
