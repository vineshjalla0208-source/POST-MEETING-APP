"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Chrome, Linkedin, Facebook } from "lucide-react"

export default function SignInClient() {
  return (
    <div className="space-y-3">
      <form
        action={async () => {
          await signIn("google", { callbackUrl: "/" })
        }}
      >
        <Button type="submit" className="w-full" variant="outline">
          <Chrome className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>
      </form>

      <form
        action={async () => {
          await signIn("linkedin", { callbackUrl: "/" })
        }}
      >
        <Button type="submit" className="w-full" variant="outline">
          <Linkedin className="mr-2 h-4 w-4" />
          Sign in with LinkedIn
        </Button>
      </form>

      <form
        action={async () => {
          await signIn("facebook", { callbackUrl: "/" })
        }}
      >
        <Button type="submit" className="w-full" variant="outline">
          <Facebook className="mr-2 h-4 w-4" />
          Sign in with Facebook
        </Button>
      </form>
    </div>
  )
}

