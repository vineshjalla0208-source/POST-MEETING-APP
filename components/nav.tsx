"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Settings, Zap, Home, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export function Nav() {
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            Post-Meeting App
          </Link>
          <div className="flex gap-4">
            <Link href="/calendar">
              <Button
                variant={pathname === "/calendar" ? "default" : "ghost"}
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link href="/meetings">
              <Button
                variant={pathname?.startsWith("/meetings") ? "default" : "ghost"}
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                Meetings
              </Button>
            </Link>
            <Link href="/automations">
              <Button
                variant={pathname === "/automations" ? "default" : "ghost"}
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Automations
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant={pathname === "/settings" ? "default" : "ghost"}
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </nav>
  )
}
