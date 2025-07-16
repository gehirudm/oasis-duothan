"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Zap, Mail } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle forgot password logic here
    console.log("Password reset request for:", email)
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-yellow-500">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">NoxaProxy</span>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              {isSubmitted ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isSubmitted
                ? "We've sent a password reset link to your email address"
                : "Enter your email address and we'll send you a link to reset your password"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isSubmitted ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-300">
                  If an account with email <strong className="text-white">{email}</strong> exists, you will receive a
                  password reset link shortly.
                </p>
                <div className="space-y-3">
                  <Button className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold" asChild>
                    <Link href="/login">Back to Login</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Try Different Email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold"
                  >
                    Send Reset Link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
                    asChild
                  >
                    <Link href="/auth">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Remember your password?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
