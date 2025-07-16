"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, LogIn } from "lucide-react"
import { getAdminEmails } from "@/app/actions/admin-actions"
import { useRouter } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [checkingAdmin, setCheckingAdmin] = useState(adminOnly)
  const router = useRouter()

  useEffect(() => {
    if (adminOnly && user) {
      const fetchAdminEmails = async () => {
        try {
          const emails = await getAdminEmails()
          setAdminEmails(emails)
        } catch (error) {
          console.error("Error fetching admin emails:", error)
        } finally {
          setCheckingAdmin(false)
        }
      }

      fetchAdminEmails()
    } else {
      setCheckingAdmin(false)
    }
  }, [adminOnly, user])

  if (loading || (adminOnly && user && checkingAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to HackPlatform</CardTitle>
            <CardDescription>Sign in to access the hackathon platform</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/auth/signin')}
              className="flex items-center"
            >
              Go to Sign In Page
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (adminOnly && !adminEmails.includes(user.email || "")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the admin dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}