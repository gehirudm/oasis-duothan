"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isHuman, setIsHuman] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isHuman) {
      setError("Please verify that you are human")
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle(email, password)
      router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError("Invalid email or password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      router.push("/dashboard")
    } catch (err) {
      console.error("Google login error:", err)
      setError("Failed to login with Google. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = () => {
    router.push("/auth/register")
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">

      {/* Login Form */}
      <div className="flex-1 flex items-start justify-center px-4 mt-20">
        <div className="w-full max-w-md space-y-8">
          {/* Login Title */}
          <h1 className="text-3xl font-bold text-foreground text-center">Login</h1>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Google Login Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full glass-effect hover:bg-white/20 dark:hover:bg-white/10 text-foreground font-medium py-6 rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "Logging in..." : "Login with Google"}
            </Button>

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground font-medium">OR</span>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-effect border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500/20 rounded-xl py-6 text-base"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-effect border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:ring-red-500/20 rounded-xl py-6 text-base"
                required
                disabled={loading}
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-left">
              <button
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
                className="text-sm text-amber-500 hover:text-amber-400 underline transition-colors duration-200 font-medium"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-base"
              disabled={!isHuman || loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* Create Account Button */}
            <Button
              type="button"
              onClick={handleCreateAccount}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted font-semibold py-6 rounded-xl transition-all duration-300 text-base"
              disabled={loading}
            >
              Create account
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}